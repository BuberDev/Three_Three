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
