# Real Audio Transcription & Sleep Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fake/placeholder audio analysis (a hardcoded transcription string for voice notes, `Math.random()`-based snoring/sleep-talking detection for sleep tracking) with real, locally-run analysis — no external paid APIs.

**Architecture:** A new shared `AudioTranscriptionService` in the NestJS API wraps whisper.cpp (built into the API's Docker image, invoked as a subprocess) for real speech-to-text, plus FFmpeg-based real per-segment volume analysis. Voice notes get a one-function swap to use it. Sleep tracking gets a real multipart file upload (it currently sends a local device path with no file at all), a new async Bull queue/processor mirroring the existing voice-notes pattern, and real volume-threshold heuristics replacing the random simulation.

**Tech Stack:** NestJS, TypeORM (Postgres), Bull/Redis, whisper.cpp (C++, vendored in Docker), FFmpeg (via `fluent-ffmpeg`, already a dependency but unused), React Native (mobile client changes for sleep upload).

## Global Constraints

- No external paid transcription API (OpenAI Whisper API, etc.) — whisper.cpp only, self-hosted on the existing VPS.
- No persistent/always-loaded whisper.cpp server process — invoke as a subprocess per job (processing already runs async via Bull, so per-call model-load overhead is acceptable).
- Transcription language: Polish (`pl`) explicitly — the app's primary language — using a multilingual whisper.cpp model (not an English-only `.en` variant).
- No test suite exists in this repo (established project fact) — verification is `tsc --noEmit` plus manual/curl smoke testing, not new automated tests.
- Follow existing patterns exactly where they exist (voice notes' upload/queue/processor pattern is the reference implementation for sleep).

---

### Task 1: Shared `AudioTranscriptionService` + whisper.cpp/FFmpeg in Docker

**Files:**
- Modify: `api/Dockerfile`
- Modify: `api/package.json` (remove unused `ffmpeg-static` dependency)
- Create: `api/src/audio-transcription/audio-transcription.service.ts`
- Create: `api/src/audio-transcription/audio-transcription.module.ts`

**Interfaces:**
- Produces: `AudioTranscriptionService.transcribe(audioFilePath: string, language?: string): Promise<string>`, `AudioTranscriptionService.extractSegment(audioFilePath: string, startSeconds: number, endSeconds: number): Promise<string>` (returns a temp WAV file path the caller must delete), `AudioTranscriptionService.analyzeVolumeSegments(audioFilePath: string, segmentSeconds?: number): Promise<AudioSegmentVolume[]>` where `AudioSegmentVolume = { startTime: number; endTime: number; avgVolumeDb: number }`. Exported from `AudioTranscriptionModule`.

- [ ] **Step 1: Add whisper.cpp build stage and FFmpeg to the Dockerfile**

Replace the full contents of `api/Dockerfile` with:

```dockerfile
# Multi-stage Dockerfile for production optimization

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm prune --production

# Stage 2: whisper.cpp build stage (real, local, offline speech-to-text —
# no external API calls; see docs/superpowers/specs/2026-07-21-real-audio-transcription-design.md)
FROM node:18-alpine AS whisper-builder

RUN apk add --no-cache build-base git cmake

WORKDIR /opt
RUN git clone --depth 1 --branch v1.9.1 https://github.com/ggml-org/whisper.cpp.git
WORKDIR /opt/whisper.cpp
RUN sh ./models/download-ggml-model.sh base
RUN cmake -B build && cmake --build build -j --config Release

# Stage 3: Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling, and ffmpeg + whisper.cpp's
# runtime shared-lib requirements (libgomp for OpenMP, libstdc++)
RUN apk add --no-cache dumb-init ffmpeg libgomp libstdc++

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Set ownership of the app directory
RUN chown -R nestjs:nodejs /app

# whisper.cpp binary + multilingual base model, baked into the image (no
# runtime download)
COPY --from=whisper-builder /opt/whisper.cpp/build/bin/whisper-cli /opt/whisper.cpp/build/bin/whisper-cli
COPY --from=whisper-builder /opt/whisper.cpp/models/ggml-base.bin /opt/whisper.cpp/models/ggml-base.bin

USER nestjs

# Copy production dependencies from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy package.json for metadata
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Create uploads directories
RUN mkdir -p uploads/voice-notes uploads/sleep-recordings

# Expose default local port. Render injects PORT at runtime.
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
```

- [ ] **Step 2: Remove the unused `ffmpeg-static` dependency**

`ffmpeg-static` bundles a prebuilt glibc binary that isn't reliably compatible with Alpine's musl libc, and it's never actually imported anywhere in `api/src`. FFmpeg is installed via `apk` in the Dockerfile instead (Step 1), and `fluent-ffmpeg` (already a dependency, also currently unused) is pointed at that binary in Step 3.

In `api/package.json`, remove this line from `dependencies`:
```json
    "ffmpeg-static": "^5.3.0",
```

Run: `cd api && npm install`
Expected: `package-lock.json` updates, no errors.

- [ ] **Step 3: Write `AudioTranscriptionService`**

Create `api/src/audio-transcription/audio-transcription.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const WHISPER_BIN = process.env.WHISPER_CLI_PATH || '/opt/whisper.cpp/build/bin/whisper-cli';
const WHISPER_MODEL = process.env.WHISPER_MODEL_PATH || '/opt/whisper.cpp/models/ggml-base.bin';
const FFMPEG_PATH = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';

export interface AudioSegmentVolume {
    startTime: number; // seconds from start of file
    endTime: number; // seconds from start of file
    avgVolumeDb: number; // mean_volume from ffmpeg's volumedetect filter — negative dB, closer to 0 is louder
}

@Injectable()
export class AudioTranscriptionService {
    private readonly logger = new Logger(AudioTranscriptionService.name);

    constructor() {
        ffmpeg.setFfmpegPath(FFMPEG_PATH);
    }

    /**
     * Real, local speech-to-text via whisper.cpp — no external API calls.
     * Converts the input file to the 16kHz mono WAV whisper.cpp requires,
     * runs inference, and returns the transcript text.
     */
    async transcribe(audioFilePath: string, language = 'pl'): Promise<string> {
        const wavPath = await this.convertToWav(audioFilePath);
        const outputBase = wavPath.replace(/\.wav$/, '');

        try {
            await execFileAsync(
                WHISPER_BIN,
                ['-m', WHISPER_MODEL, '-l', language, '-nt', '-otxt', '-of', outputBase, '-f', wavPath],
                { timeout: 5 * 60 * 1000 },
            );

            const transcript = await fs.readFile(`${outputBase}.txt`, 'utf-8');
            return transcript.trim();
        } finally {
            await fs.unlink(wavPath).catch(() => undefined);
            await fs.unlink(`${outputBase}.txt`).catch(() => undefined);
        }
    }

    /**
     * Extracts [startSeconds, endSeconds) from an audio file into a new temp
     * WAV file ready for transcribe(). Caller must delete the returned path.
     */
    async extractSegment(audioFilePath: string, startSeconds: number, endSeconds: number): Promise<string> {
        const outPath = path.join(os.tmpdir(), `segment-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
        await new Promise<void>((resolve, reject) => {
            ffmpeg(audioFilePath)
                .seekInput(startSeconds)
                .setDuration(endSeconds - startSeconds)
                .audioChannels(1)
                .audioFrequency(16000)
                .audioCodec('pcm_s16le')
                .output(outPath)
                .on('end', () => resolve())
                .on('error', reject)
                .run();
        });
        return outPath;
    }

    /**
     * Real average volume (dB) per fixed-length time window across the whole
     * file, using ffmpeg's volumedetect filter — replaces the previous
     * Math.random()-based placeholder in sleep audio analysis.
     */
    async analyzeVolumeSegments(audioFilePath: string, segmentSeconds = 30): Promise<AudioSegmentVolume[]> {
        const durationSeconds = await this.getDurationSeconds(audioFilePath);
        const segments: AudioSegmentVolume[] = [];

        for (let start = 0; start < durationSeconds; start += segmentSeconds) {
            const end = Math.min(start + segmentSeconds, durationSeconds);
            const avgVolumeDb = await this.measureSegmentVolume(audioFilePath, start, end);
            segments.push({ startTime: start, endTime: end, avgVolumeDb });
        }

        return segments;
    }

    private getDurationSeconds(audioFilePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
                if (err) return reject(err);
                resolve(metadata.format.duration ?? 0);
            });
        });
    }

    private measureSegmentVolume(audioFilePath: string, startSeconds: number, endSeconds: number): Promise<number> {
        return new Promise((resolve, reject) => {
            let meanVolume = -91; // ffmpeg's practical floor for digital silence
            ffmpeg(audioFilePath)
                .seekInput(startSeconds)
                .setDuration(endSeconds - startSeconds)
                .audioFilters('volumedetect')
                .format('null')
                .output('/dev/null')
                .on('stderr', (line: string) => {
                    const match = line.match(/mean_volume:\s*(-?\d+(\.\d+)?)\s*dB/);
                    if (match) meanVolume = parseFloat(match[1]);
                })
                .on('end', () => resolve(meanVolume))
                .on('error', reject)
                .run();
        });
    }

    private async convertToWav(audioFilePath: string): Promise<string> {
        const outPath = path.join(os.tmpdir(), `whisper-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
        await new Promise<void>((resolve, reject) => {
            ffmpeg(audioFilePath)
                .audioChannels(1)
                .audioFrequency(16000)
                .audioCodec('pcm_s16le')
                .output(outPath)
                .on('end', () => resolve())
                .on('error', reject)
                .run();
        });
        return outPath;
    }
}
```

- [ ] **Step 4: Write `AudioTranscriptionModule`**

Create `api/src/audio-transcription/audio-transcription.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AudioTranscriptionService } from './audio-transcription.service';

@Module({
    providers: [AudioTranscriptionService],
    exports: [AudioTranscriptionService],
})
export class AudioTranscriptionModule { }
```

- [ ] **Step 5: Verify the whisper.cpp build stage compiles**

Run (from repo root):
```bash
docker build --target whisper-builder -t whisper-builder-check -f api/Dockerfile api
```
Expected: build completes successfully, ending in the `cmake --build` step with no errors. This isolates and verifies Task 1's riskiest part (compiling C++ on Alpine/musl) before it's wired into anything else.

- [ ] **Step 6: Type-check and commit**

Run: `cd api && npx tsc --noEmit`
Expected: no new errors compared to the pre-existing baseline.

```bash
git add api/Dockerfile api/package.json api/package-lock.json api/src/audio-transcription/
git commit -m "feat: add local whisper.cpp-based AudioTranscriptionService

Real, self-hosted speech-to-text and volume analysis, replacing the
external-API dependency this project explicitly doesn't want. Nothing
consumes this yet — wired into voice notes and sleep tracking in the
following tasks."
```

---

### Task 2: Wire voice notes to real transcription

**Files:**
- Modify: `api/src/voice-notes/voice-processing.service.ts`
- Modify: `api/src/voice-notes/voice-notes.module.ts`

**Interfaces:**
- Consumes: `AudioTranscriptionService.transcribe(audioFilePath, language?)` from Task 1.

- [ ] **Step 1: Replace the placeholder `transcribeAudio` method**

In `api/src/voice-notes/voice-processing.service.ts`, the constructor and imports need the new service. Replace the top of the file (imports + constructor) — change:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as path from 'path';
```
to:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AudioTranscriptionService } from '../audio-transcription/audio-transcription.service';
```

(Removes the now-unused `path` import — `transcribeAudio` no longer needs `path.basename`.)

Change the constructor:
```typescript
    constructor(private readonly configService: ConfigService) {
```
to:
```typescript
    constructor(
        private readonly configService: ConfigService,
        private readonly audioTranscriptionService: AudioTranscriptionService,
    ) {
```

Replace the entire `transcribeAudio` method body:

```typescript
    private async transcribeAudio(audioFilePath: string): Promise<string> {
        try {
            // Note: OpenRouter free models don't include Whisper for audio transcription
            // Using placeholder transcription for now

            const filename = path.basename(audioFilePath);
            const placeholderText = `Placeholder transcription for ${filename}. ` +
                `W przyszłości można użyć lokalnego modelu transkrypcji lub płatnej usługi.`;

            this.logger.warn('Using placeholder transcription - Whisper not available in OpenRouter free tier');
            return placeholderText;

        } catch (error) {
            this.logger.error('Transcription placeholder failed:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }
```
with:
```typescript
    private async transcribeAudio(audioFilePath: string): Promise<string> {
        try {
            return await this.audioTranscriptionService.transcribe(audioFilePath, 'pl');
        } catch (error) {
            this.logger.error('Transcription failed:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }
```

- [ ] **Step 2: Register `AudioTranscriptionModule` in `VoiceNotesModule`**

In `api/src/voice-notes/voice-notes.module.ts`, add the import:
```typescript
import { AudioTranscriptionModule } from '../audio-transcription/audio-transcription.module';
```
and add it to `imports`:
```typescript
    imports: [
        TypeOrmModule.forFeature([VoiceNote]),
        BullModule.registerQueue({
            name: 'voice-processing',
        }),
        UsersModule,
        EventsModule,
        AudioTranscriptionModule,
    ],
```

- [ ] **Step 3: Type-check**

Run: `cd api && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Smoke-test with a real short audio clip**

This requires a running instance with the Task 1 Docker image (or, for local iteration, `WHISPER_CLI_PATH`/`WHISPER_MODEL_PATH`/`FFMPEG_PATH` pointed at a local whisper.cpp checkout — see Task 1 Step 5's build for what these need to resolve to). Record or obtain a short (a few seconds) `.m4a`/`.wav` Polish speech sample, then either:
- Call `AudioTranscriptionService.transcribe()` directly from a one-off script, or
- Upload it through `POST /api/voice-notes` and check the resulting `VoiceNote.transcription` field once the Bull job completes (`processingStatus` moves from `pending` → `processing` → `completed`; check via `GET /api/voice-notes/:id`).

Expected: `transcription` contains real Polish text matching what was said — not a placeholder string, not empty.

- [ ] **Step 5: Commit**

```bash
git add api/src/voice-notes/voice-processing.service.ts api/src/voice-notes/voice-notes.module.ts
git commit -m "fix: voice notes use real whisper.cpp transcription instead of a placeholder"
```

---

### Task 3: `SleepTracking` processing-status field + migration

**Files:**
- Modify: `api/src/sleep/entities/sleep-tracking.entity.ts`
- Create: `api/src/migrations/1784650000000-AddSleepTrackingProcessingStatus.ts`

**Interfaces:**
- Produces: `SleepProcessingStatus` enum (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) and `SleepTracking.processingStatus: SleepProcessingStatus` (default `PENDING`), `SleepTracking.processingError?: string`, exported from `sleep-tracking.entity.ts` for use in Task 4/5.

- [ ] **Step 1: Add the enum and columns to the entity**

In `api/src/sleep/entities/sleep-tracking.entity.ts`, add after the existing `SnoringIntensity` enum:

```typescript
export enum SleepProcessingStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}
```

Add these columns to the `SleepTracking` class, after the `analysisMetadata` column and before the `// Relations` comment:

```typescript
    @Column({
        name: 'processing_status',
        type: 'varchar',
        length: 20,
        default: SleepProcessingStatus.PENDING,
    })
    processingStatus: SleepProcessingStatus;

    @Column({ name: 'processing_error', type: 'text', nullable: true })
    processingError?: string;
```

- [ ] **Step 2: Write the migration**

Create `api/src/migrations/1784650000000-AddSleepTrackingProcessingStatus.ts`:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSleepTrackingProcessingStatus1784650000000 implements MigrationInterface {
    name = 'AddSleepTrackingProcessingStatus1784650000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sleep_tracking" ADD "processing_status" character varying(20) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" ADD "processing_error" text`);
        // Existing rows predate this column and already have full (fake)
        // analysis data — mark them completed so they don't show as pending.
        await queryRunner.query(`UPDATE "sleep_tracking" SET "processing_status" = 'completed'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sleep_tracking" DROP COLUMN "processing_error"`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" DROP COLUMN "processing_status"`);
    }
}
```

- [ ] **Step 3: Run the migration locally to verify it applies cleanly**

Run: `cd api && npm run typeorm -- migration:run -d src/database/data-source.ts` (check `api/package.json`'s scripts for the exact migration-run script name if this differs — match whatever the existing migrations use).
Expected: migration runs without error; `\d sleep_tracking` in psql shows the two new columns.

- [ ] **Step 4: Type-check and commit**

Run: `cd api && npx tsc --noEmit`
Expected: no new errors.

```bash
git add api/src/sleep/entities/sleep-tracking.entity.ts api/src/migrations/1784650000000-AddSleepTrackingProcessingStatus.ts
git commit -m "feat: add processing-status tracking to SleepTracking

Mirrors VoiceNote's ProcessingStatus — needed because sleep audio analysis
is about to move off the request path onto an async Bull queue (Task 4/5)."
```

---

### Task 4: Sleep audio upload transport + async job enqueue

**Files:**
- Create: `api/src/sleep/dto/process-sleep-audio.dto.ts`
- Modify: `api/src/sleep/sleep-tracking.controller.ts`
- Modify: `api/src/sleep/sleep-tracking.service.ts`
- Modify: `api/src/sleep/sleep.module.ts`

**Interfaces:**
- Consumes: `SleepProcessingStatus` from Task 3.
- Produces: `SleepTrackingService.createPendingRecord(userId, dto, audioFilePath): Promise<SleepTracking>` and enqueues a `'sleep-processing'` Bull job `{ sleepTrackingId: string, audioFilePath: string }` — consumed by Task 5's processor.

- [ ] **Step 1: DTO for the multipart fields**

Create `api/src/sleep/dto/process-sleep-audio.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ProcessSleepAudioDto {
    @ApiProperty({ description: 'When the recording started (ISO timestamp)' })
    @IsDateString()
    bedtime: string;

    @ApiProperty({ description: 'When the recording stopped (ISO timestamp)' })
    @IsDateString()
    wakeTime: string;
}
```

- [ ] **Step 2: Replace the JSON `process-audio` endpoint with a multipart upload**

In `api/src/sleep/sleep-tracking.controller.ts`, add imports:
```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProcessSleepAudioDto } from './dto/process-sleep-audio.dto';
```
(`ApiOperation`, `ApiResponse` etc. are already imported — add `ApiConsumes`/`ApiBody` alongside them in the existing `@nestjs/swagger` import line rather than a second import line.)

Replace the entire existing `process-audio` endpoint:

```typescript
    @Post('process-audio')
    @ApiOperation({ summary: 'Process nocturnal audio recording with AI analysis' })
    @ApiResponse({
        status: 201,
        description: 'Audio processed and sleep record created successfully',
        type: SleepTracking,
    })
    async processAudio(
        @CurrentUser() user: User,
        @Body() processAudioDto: {
            audioFilePath: string;
            bedtime: string;
            wakeTime: string;
        },
    ): Promise<SleepTracking> {
        return this.sleepTrackingService.processNocurnalAudio(
            user.id,
            processAudioDto.audioFilePath,
            processAudioDto.bedtime,
            processAudioDto.wakeTime,
        );
    }
```

with:

```typescript
    @Post('process-audio')
    @UseInterceptors(
        FileInterceptor('audio', {
            limits: {
                fileSize: 1024 * 1024 * 1024, // 1GB — a full night can run large at even modest bitrates
            },
            fileFilter: (req, file, cb) => {
                const allowedMimeTypes = [
                    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aac',
                    'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/flac',
                    'audio/ogg', 'audio/webm', 'application/octet-stream',
                ];
                if (allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Invalid audio file format'), false);
                }
            },
        }),
    )
    @ApiOperation({ summary: 'Upload a nocturnal audio recording for AI analysis' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                audio: { type: 'string', format: 'binary' },
                bedtime: { type: 'string' },
                wakeTime: { type: 'string' },
            },
            required: ['audio', 'bedtime', 'wakeTime'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Recording accepted and queued for analysis (processingStatus: pending)',
        type: SleepTracking,
    })
    async processAudio(
        @CurrentUser() user: User,
        @Body() processAudioDto: ProcessSleepAudioDto,
        @UploadedFile() audioFile: Express.Multer.File,
    ): Promise<SleepTracking> {
        if (!audioFile) {
            throw new BadRequestException('Audio file is required');
        }
        return this.sleepTrackingService.createPendingRecordAndQueue(
            user.id,
            audioFile,
            processAudioDto.bedtime,
            processAudioDto.wakeTime,
        );
    }
```

Add `BadRequestException`, `UploadedFile`, `UseInterceptors` to the existing `@nestjs/common` import at the top of the file (they're likely partially imported already — merge into the existing import statement rather than duplicating it).

- [ ] **Step 3: Replace `processNocurnalAudio` with pending-record-creation + enqueue**

In `api/src/sleep/sleep-tracking.service.ts`, add imports:
```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { randomUUID as uuidv4 } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SleepProcessingStatus } from './entities/sleep-tracking.entity';
```

Add the queue to the constructor:
```typescript
    constructor(
        @InjectRepository(SleepTracking)
        private readonly sleepTrackingRepository: Repository<SleepTracking>,
        @InjectRepository(SleepEvent)
        private readonly sleepEventRepository: Repository<SleepEvent>,
        private readonly sleepAnalysisService: SleepAnalysisService,
        private readonly sleepCorrelationService: SleepCorrelationService,
        @InjectQueue('sleep-processing')
        private readonly sleepProcessingQueue: Queue,
    ) { }
```

Replace the `processNocurnalAudio` method (and leave `createBasicSleepRecord` in place — Task 5 still uses it as the real failure fallback) with:

```typescript
    /**
     * Saves the uploaded recording, creates a pending SleepTracking record,
     * and queues it for async analysis (see SleepProcessingProcessor).
     * Mirrors VoiceNotesService.create()'s upload-then-queue pattern.
     */
    async createPendingRecordAndQueue(
        userId: string,
        audioFile: Express.Multer.File,
        bedtime: string,
        wakeTime: string,
    ): Promise<SleepTracking> {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'sleep-recordings');
        await fs.mkdir(uploadsDir, { recursive: true });

        const fileExtension = path.extname(audioFile.originalname) || '.m4a';
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, audioFile.buffer);

        const sleepDurationHours = Math.round(
            (new Date(wakeTime).getTime() - new Date(bedtime).getTime()) / (1000 * 60 * 60) * 10
        ) / 10;

        const sleepRecord = await this.create(userId, {
            sleepDate: new Date().toISOString().split('T')[0],
            recordingStartTime: bedtime,
            recordingEndTime: wakeTime,
            sleepDurationHours,
            audioFiles: [{
                url: filePath,
                duration: sleepDurationHours * 60,
                segment: 1,
                size: audioFile.size,
            }],
        });

        await this.sleepTrackingRepository.update(sleepRecord.id, {
            processingStatus: SleepProcessingStatus.PENDING,
        });

        this.sleepProcessingQueue.add('process-sleep-audio', {
            sleepTrackingId: sleepRecord.id,
            audioFilePath: filePath,
        }).catch((error) => {
            this.logger.error(`Failed to queue sleep recording ${sleepRecord.id} for processing:`, error);
        });

        return { ...sleepRecord, processingStatus: SleepProcessingStatus.PENDING };
    }
```

- [ ] **Step 4: Register the Bull queue in `SleepModule`**

In `api/src/sleep/sleep.module.ts`, add the import:
```typescript
import { BullModule } from '@nestjs/bull';
```
and add to `imports`:
```typescript
        BullModule.registerQueue({
            name: 'sleep-processing',
        }),
```
(Task 5 adds the processor itself to `providers` — not this task, since it doesn't exist yet.)

- [ ] **Step 5: Type-check**

Run: `cd api && npx tsc --noEmit`
Expected: errors referencing `SleepProcessingProcessor` not existing yet are expected and fine — Task 5 creates it. No *other* new errors.

- [ ] **Step 6: Commit**

```bash
git add api/src/sleep/dto/process-sleep-audio.dto.ts api/src/sleep/sleep-tracking.controller.ts api/src/sleep/sleep-tracking.service.ts api/src/sleep/sleep.module.ts
git commit -m "fix: sleep recordings are now actually uploaded to the server

Previously the client sent audioFilePath as a local device path in a JSON
body — the server never received the audio file at all. Now uses multipart
upload (mirroring voice notes' pattern) and queues analysis on a new
sleep-processing Bull queue instead of blocking the request."
```

---

### Task 5: Real volume-based analysis + selective real transcription

**Files:**
- Modify: `api/src/sleep/services/sleep-analysis.service.ts`
- Create: `api/src/sleep/processors/sleep-processing.processor.ts`
- Modify: `api/src/sleep/sleep.module.ts`

**Interfaces:**
- Consumes: `AudioTranscriptionService.analyzeVolumeSegments`, `.extractSegment`, `.transcribe` (Task 1); `SleepTrackingService.createBasicSleepRecord` (existing, made accessible — see Step 1); `SleepProcessingStatus` (Task 3).

- [ ] **Step 1: Make `createBasicSleepRecord` accessible to the processor**

In `api/src/sleep/sleep-tracking.service.ts`, change its visibility from `private` to keep it usable as the failure fallback from the new processor:
```typescript
    private async createBasicSleepRecord(
```
to:
```typescript
    async createBasicSleepRecord(
```

Add a companion update method the processor uses to write real results onto the *existing* pending record (rather than creating a new one, which is what the old synchronous flow did). Add this method to `SleepTrackingService`, near `createPendingRecordAndQueue`:

```typescript
    /**
     * Writes real analysis results onto an existing (pending) SleepTracking
     * record and saves its SleepEvents. Called by SleepProcessingProcessor
     * after AI analysis completes.
     */
    async applyAnalysisResults(
        sleepTrackingId: string,
        analysisResult: {
            snoringDetected: boolean;
            snoringIntensity: SnoringIntensity;
            sleepTalkingDetected: boolean;
            sleepTalkingFrequency: number;
            sleepQualityScore: number;
            awakeningsCount: number;
            sleepEfficiency: number;
            analysisMetadata: any;
            events: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[];
        },
    ): Promise<void> {
        await this.sleepTrackingRepository.update(sleepTrackingId, {
            snoringDetected: analysisResult.snoringDetected,
            snoringIntensity: analysisResult.snoringIntensity,
            sleepTalkingDetected: analysisResult.sleepTalkingDetected,
            sleepTalkingFrequency: analysisResult.sleepTalkingFrequency,
            sleepQualityScore: analysisResult.sleepQualityScore,
            awakeningsCount: analysisResult.awakeningsCount,
            sleepEfficiency: analysisResult.sleepEfficiency,
            analysisMetadata: analysisResult.analysisMetadata,
            processingStatus: SleepProcessingStatus.COMPLETED,
        });

        if (analysisResult.events.length > 0) {
            const sleepEvents = analysisResult.events.map((event) =>
                this.sleepEventRepository.create({ ...event, sleepTrackingId }),
            );
            await this.sleepEventRepository.save(sleepEvents);
        }
    }

    async markProcessingFailed(sleepTrackingId: string, errorMessage: string): Promise<void> {
        await this.sleepTrackingRepository.update(sleepTrackingId, {
            processingStatus: SleepProcessingStatus.FAILED,
            processingError: errorMessage,
        });
    }
```

Import `SnoringIntensity` is already imported in this file; `SleepProcessingStatus` was added to this file's imports in Task 4 Step 3.

- [ ] **Step 2: Replace the fake `segmentAudio` with real volume analysis**

In `api/src/sleep/services/sleep-analysis.service.ts`, add the import:
```typescript
import { AudioTranscriptionService } from '../../audio-transcription/audio-transcription.service';
```

Add it to the constructor:
```typescript
    constructor(
        @InjectRepository(SleepEvent)
        private sleepEventsRepository: Repository<SleepEvent>,
        private configService: ConfigService,
        private readonly audioTranscriptionService: AudioTranscriptionService,
    ) {
```

Replace the `AudioSegment` interface:
```typescript
interface AudioSegment {
    startTime: number; // seconds
    endTime: number; // seconds
    audioData: ArrayBuffer;
    volume: number;
}
```
with:
```typescript
interface AudioSegment {
    startTime: number; // seconds
    endTime: number; // seconds
    avgVolumeDb: number; // real mean volume from ffmpeg's volumedetect filter
}
```

Replace the entire `segmentAudio` method:
```typescript
    private async segmentAudio(audioFilePath: string, durationMs: number): Promise<AudioSegment[]> {
        const segments: AudioSegment[] = [];
        const segmentDurationMs = 30 * 1000; // 30 seconds

        // This is a simplified version - in production you'd use FFmpeg or similar
        // For now, create logical segments
        for (let i = 0; i < durationMs; i += segmentDurationMs) {
            const startTime = i / 1000;
            const endTime = Math.min((i + segmentDurationMs) / 1000, durationMs / 1000);

            segments.push({
                startTime,
                endTime,
                audioData: new ArrayBuffer(0), // Placeholder
                volume: Math.random() * 100, // Placeholder - would be calculated from actual audio
            });
        }

        return segments;
    }
```
with:
```typescript
    private async segmentAudio(audioFilePath: string, _durationMs: number): Promise<AudioSegment[]> {
        const volumeSegments = await this.audioTranscriptionService.analyzeVolumeSegments(audioFilePath, 30);
        return volumeSegments.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            avgVolumeDb: s.avgVolumeDb,
        }));
    }
```

- [ ] **Step 3: Replace the random `analyzeAudioSegment` heuristics with real volume thresholds**

Replace the entire `analyzeAudioSegment` method body's detection logic. These are approximate, non-clinical thresholds against `avgVolumeDb` (ffmpeg's `mean_volume`, where roughly -91dB is digital silence and 0dB is full scale) — tune later against real recordings if they prove too sensitive/insensitive:

```typescript
    private async analyzeAudioSegment(
        sleepTrackingId: string,
        segment: AudioSegment,
        segmentIndex: number,
    ): Promise<Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[]> {
        const events: Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt' | 'sleepTracking'>[] = [];
        const avgVolumeDb = segment.avgVolumeDb;
        const segmentDuration = segment.endTime - segment.startTime;

        // Real audio, simple heuristic thresholds (not ML, not clinically
        // validated — see docs/superpowers/specs/2026-07-21-real-audio-transcription-design.md).
        // Snoring: moderately loud, sustained low-frequency-ish rumble —
        // approximated here by a mid volume band without the sharper energy
        // of speech.
        if (avgVolumeDb > -35 && avgVolumeDb <= -15) {
            const intensity = avgVolumeDb > -22 ? SleepEventIntensity.HIGH :
                avgVolumeDb > -28 ? SleepEventIntensity.MODERATE :
                    SleepEventIntensity.LOW;

            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.SNORING,
                intensity,
                durationSeconds: segmentDuration,
                confidenceScore: 0.6,
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    volume: avgVolumeDb,
                    pattern: intensity === SleepEventIntensity.HIGH ? 'irregular' : 'regular',
                },
            });
        }

        // Sleep talking: the loudest, sharpest volume spikes — most likely
        // to be actual speech rather than snoring/breathing.
        if (avgVolumeDb > -15) {
            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.SLEEP_TALKING,
                intensity: SleepEventIntensity.MODERATE,
                durationSeconds: segmentDuration,
                confidenceScore: 0.6,
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    volume: avgVolumeDb,
                },
            });
        }

        // Movement: brief, moderate volume that isn't sustained enough to be
        // snoring or speech — approximated by a quieter band than both.
        if (avgVolumeDb > -50 && avgVolumeDb <= -35) {
            events.push({
                sleepTrackingId,
                eventTime: new Date(Date.now() - (segmentIndex * 30000)),
                eventType: SleepEventType.MOVEMENT,
                intensity: SleepEventIntensity.LOW,
                durationSeconds: Math.min(segmentDuration, 5),
                confidenceScore: 0.5,
                audioSegmentStart: segment.startTime,
                audioSegmentEnd: segment.endTime,
                details: {
                    movement_type: 'position_change',
                    volume: avgVolumeDb,
                },
            });
        }

        return events;
    }
```

- [ ] **Step 4: Replace the random `transcribeSleepTalking` with real transcription**

Replace the entire `transcribeSleepTalking` method:
```typescript
    private async transcribeSleepTalking(
        audioFilePath: string,
        startTime: number,
        endTime: number,
    ): Promise<string> {
        try {
            // In production, you'd extract the audio segment and send to Whisper
            // For now, return placeholder transcriptions
            const placeholderTranscriptions = [
                'mmm... nie...',
                'gdzie jest...',
                'tak, tak...',
                'nie chcę...',
                'już późno...',
                'hmm... dobrze...',
            ];

            return placeholderTranscriptions[Math.floor(Math.random() * placeholderTranscriptions.length)];

            // Real implementation would be:
            // const transcription = await this.openai.audio.transcriptions.create({
            //     file: fs.createReadStream(segmentPath),
            //     model: 'whisper-1',
            //     language: 'pl',
            // });
            // return transcription.text;

        } catch (error) {
            this.logger.warn(`Transcription failed: ${error.message}`);
            return '';
        }
    }
```
with:
```typescript
    private async transcribeSleepTalking(
        audioFilePath: string,
        startTime: number,
        endTime: number,
    ): Promise<string> {
        let segmentPath: string | null = null;
        try {
            segmentPath = await this.audioTranscriptionService.extractSegment(audioFilePath, startTime, endTime);
            return await this.audioTranscriptionService.transcribe(segmentPath, 'pl');
        } catch (error) {
            this.logger.warn(`Transcription failed: ${error.message}`);
            return '';
        } finally {
            if (segmentPath) {
                await require('fs/promises').unlink(segmentPath).catch(() => undefined);
            }
        }
    }
```

- [ ] **Step 5: Write the Bull processor**

Create `api/src/sleep/processors/sleep-processing.processor.ts`:

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SleepAnalysisService } from '../services/sleep-analysis.service';
import { SleepTrackingService } from '../sleep-tracking.service';

interface SleepProcessingJob {
    sleepTrackingId: string;
    audioFilePath: string;
}

@Processor('sleep-processing')
export class SleepProcessingProcessor {
    private readonly logger = new Logger(SleepProcessingProcessor.name);

    constructor(
        private readonly sleepTrackingService: SleepTrackingService,
        private readonly sleepAnalysisService: SleepAnalysisService,
    ) { }

    @Process('process-sleep-audio')
    async processSleepAudio(job: Job<SleepProcessingJob>) {
        const { sleepTrackingId, audioFilePath } = job.data;
        this.logger.log(`Processing sleep recording: ${sleepTrackingId}`);

        try {
            const sleepTracking = await this.sleepTrackingService.findById(sleepTrackingId, undefined as any);
            const durationMs = sleepTracking.sleepDurationHours
                ? sleepTracking.sleepDurationHours * 60 * 60 * 1000
                : 0;

            const analysisResult = await this.sleepAnalysisService.analyzeSleepAudio(
                sleepTrackingId,
                audioFilePath,
                durationMs,
            );

            await this.sleepTrackingService.applyAnalysisResults(sleepTrackingId, analysisResult);

            this.logger.log(`Sleep analysis completed for ${sleepTrackingId}. Quality: ${analysisResult.sleepQualityScore}/10`);
        } catch (error) {
            this.logger.error(`Failed to process sleep recording ${sleepTrackingId}:`, error.stack);
            await this.sleepTrackingService.markProcessingFailed(sleepTrackingId, error.message);
            throw error;
        }
    }
}
```

`SleepTrackingService.findById(id, userId)` filters by `userId` in its `where` clause (see existing implementation) — passing `undefined` bypasses that filter unintentionally. Fix `findById` to make the userId check optional for this internal, non-user-facing call path: in `api/src/sleep/sleep-tracking.service.ts`, change:
```typescript
    async findById(id: string, userId: string): Promise<SleepTracking> {
        const sleepRecord = await this.sleepTrackingRepository.findOne({
            where: { id, userId },
        });
```
to:
```typescript
    async findById(id: string, userId?: string): Promise<SleepTracking> {
        const sleepRecord = await this.sleepTrackingRepository.findOne({
            where: userId ? { id, userId } : { id },
        });
```
and update the processor's call to drop the now-unnecessary cast:
```typescript
            const sleepTracking = await this.sleepTrackingService.findById(sleepTrackingId);
```

- [ ] **Step 6: Register the processor and `AudioTranscriptionModule` in `SleepModule`**

In `api/src/sleep/sleep.module.ts`, add imports:
```typescript
import { AudioTranscriptionModule } from '../audio-transcription/audio-transcription.module';
import { SleepProcessingProcessor } from './processors/sleep-processing.processor';
```
Add `AudioTranscriptionModule` to `imports` and `SleepProcessingProcessor` to `providers`:
```typescript
@Module({
    imports: [
        TypeOrmModule.forFeature([
            SleepTracking,
            SleepEvent,
            VoiceNote,
            DailyActivity
        ]),
        BullModule.registerQueue({
            name: 'sleep-processing',
        }),
        AudioTranscriptionModule,
    ],
    controllers: [SleepTrackingController],
    providers: [
        SleepTrackingService,
        SleepAnalysisService,
        SleepCorrelationService,
        SleepProcessingProcessor,
    ],
    exports: [
        SleepTrackingService,
        SleepAnalysisService,
        SleepCorrelationService
    ],
})
export class SleepModule { }
```

- [ ] **Step 7: Type-check**

Run: `cd api && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 8: Smoke-test with a real recording**

Using a short (1-2 minute) test audio file with at least one segment of clear speech and one segment of near-silence, call `POST /api/sleep-tracking/process-audio` (multipart: `audio`, `bedtime`, `wakeTime`) with a valid auth token. Poll `GET /api/sleep-tracking/:id` until `processingStatus` is `completed`, then check:
- `snoringDetected`/`sleepTalkingDetected` reflect the actual loud vs. quiet segments in the test file, not a fixed 10%/random pattern.
- Any `SleepEvent` with `eventType: sleep_talking` has a `transcription` matching real words in the test file, not one of the 6 old placeholder phrases.

Expected: results correlate with the actual test audio content.

- [ ] **Step 9: Commit**

```bash
git add api/src/sleep/services/sleep-analysis.service.ts api/src/sleep/processors/sleep-processing.processor.ts api/src/sleep/sleep.module.ts api/src/sleep/sleep-tracking.service.ts
git commit -m "fix: replace Math.random() sleep analysis with real volume-based heuristics and transcription

segmentAudio/analyzeAudioSegment previously never read the actual audio
(audioData: new ArrayBuffer(0)) and generated events from Math.random().
transcribeSleepTalking picked a random line from 6 hardcoded placeholder
phrases — the real Whisper call was commented out. Both now use
AudioTranscriptionService for real per-segment volume (ffmpeg volumedetect)
and real whisper.cpp transcription of the loudest (likely-speech) segments.
Processing now runs async via a new sleep-processing Bull queue instead of
blocking the upload request."
```

---

### Task 6: Mobile client — sleep multipart upload + async processing UX

**Files:**
- Modify: `hooks/use-sleep-recording.ts`

**Interfaces:**
- Consumes: `POST /api/sleep-tracking/process-audio` (multipart: `audio`, `bedtime`, `wakeTime`) from Task 4, returning a `SleepTracking` with `processingStatus: 'pending'`.

- [ ] **Step 1: Send the recording as a real multipart upload**

In `hooks/use-sleep-recording.ts`, replace the `processSleepRecording` function body (everything between the function signature's opening brace and its closing brace, i.e. the `try { ... } catch { ... }` for the *success* path — keep the existing `catch` fallback block as-is, since it's now a genuine network-failure fallback, not the default path):

Replace:
```typescript
async function processSleepRecording(recording: any): Promise<SleepAnalysis> {
    try {
        const authToken = ApiService.getInstance().getAuthToken();

        // Call the backend API for real AI analysis
        const response = await fetch(`${getApiUrl()}/api/sleep-tracking/process-audio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
                audioFilePath: recording.uri,
                bedtime: new Date(recording.startTime || Date.now() - recording.duration).toISOString(),
                wakeTime: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const sleepRecord = unwrapApiEnvelope<any>(await response.json());
```
with:
```typescript
async function processSleepRecording(recording: any): Promise<SleepAnalysis> {
    try {
        const authToken = ApiService.getInstance().getAuthToken();

        const formData = new FormData();
        formData.append('audio', {
            uri: recording.uri,
            type: 'audio/m4a',
            name: 'sleep_recording.m4a',
        } as any);
        formData.append('bedtime', new Date(recording.startTime || Date.now() - recording.duration).toISOString());
        formData.append('wakeTime', new Date().toISOString());

        // Call the backend API for real AI analysis — audio is now actually
        // uploaded (previously this sent recording.uri, a local device path,
        // as a JSON string field; the server never received any audio).
        const response = await fetch(`${getApiUrl()}/api/sleep-tracking/process-audio`, {
            method: 'POST',
            headers: {
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                // Don't set Content-Type - let fetch set it with the multipart boundary
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const sleepRecord = unwrapApiEnvelope<any>(await response.json());
```

- [ ] **Step 2: Reflect that analysis is now async, not immediate**

The response from `process-audio` now comes back with `processingStatus: 'pending'` and no analysis fields populated yet (they fill in later via the background job). Update the return-value construction immediately below the code from Step 1 — replace:
```typescript
        // Transform API response to match our SleepAnalysis interface
        return {
            snoringEvents: sleepRecord.snoringDetected ? [
                {
                    timestamp: new Date(sleepRecord.recordingStartTime),
                    duration: 30,
                    intensity: sleepRecord.snoringIntensity.toLowerCase(),
                }
            ] : [],
            sleepTalkingEvents: sleepRecord.sleepTalkingDetected ? [
                {
                    timestamp: new Date(sleepRecord.recordingStartTime),
                    transcript: 'Sleep talking detected',
                    confidence: 0.8,
                }
            ] : [],
            totalSleepDuration: recording.duration,
            sleepQuality: sleepRecord.sleepQualityScore || 5,
        };
```
with:
```typescript
        // Analysis runs async on the server now (it can take a while for a
        // full night's recording) — this just confirms the upload succeeded.
        // The real results populate sleepRecord.snoringDetected etc. later;
        // callers should re-fetch via getSleepInsights / findLatest once
        // processingStatus is 'completed'.
        return {
            snoringEvents: [],
            sleepTalkingEvents: [],
            totalSleepDuration: recording.duration,
            sleepQuality: 0,
        };
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p .` (from repo root)
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/use-sleep-recording.ts
git commit -m "fix: upload sleep recordings as real multipart files

Matches the backend's new multipart endpoint (previous task) — sends the
actual audio bytes instead of a local device path in JSON, and no longer
treats the response as a fully-analyzed result since processing is async now."
```

Note: on-device testing (record → stop → see it upload) isn't automatable in this environment — recommend testing on a real device before the next TestFlight build.

---

### Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check both apps**

Run: `cd api && npx tsc --noEmit`
Expected: no new errors vs. pre-task-1 baseline.

Run: `npx tsc --noEmit -p .` (from repo root, for the mobile app)
Expected: no new errors vs. pre-task-1 baseline.

- [ ] **Step 2: Full Docker image build**

Run (from repo root): `docker build -t three-three-api-test -f api/Dockerfile api`
Expected: all three stages (`builder`, `whisper-builder`, `production`) complete successfully.

- [ ] **Step 3: Re-run the voice-note and sleep smoke tests from Tasks 2 and 5 against this built image**

Run the image locally (`docker run --rm -p 3000:3000 --env-file api/.env.production three-three-api-test`, adjusting env vars for a local Postgres/Redis if needed) and repeat the curl-based smoke tests from Task 2 Step 4 and Task 5 Step 8 against `http://localhost:3000`.
Expected: both produce real, non-placeholder results as already verified per-task.

- [ ] **Step 4: Final commit**

If Steps 1-3 required any fixes, commit them now with a message describing what the end-to-end pass caught. If nothing needed fixing, no commit is needed for this task.
