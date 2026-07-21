# Real audio transcription & sleep analysis — design

Status: approved (2026-07-21)

## Problem

Two features present as working but are fake underneath:

1. **Voice notes.** `VoiceProcessingService.transcribeAudio()` returns a hardcoded
   placeholder string (`"Placeholder transcription for {filename}..."`) for every
   single recording. Every downstream step — task extraction, tags, sentiment,
   embeddings — runs on this fiction, not on what the user actually said.

2. **Sleep tracking.** Two independent breaks:
   - The audio file never reaches the server at all. The mobile client sends
     `audioFilePath: recording.uri` — a local device path — as a JSON field, not
     an uploaded file. The server has no way to read it.
   - Even if it did, `sleep-analysis.service.ts`'s `segmentAudio()` never reads
     real audio (`audioData: new ArrayBuffer(0), // Placeholder`), and
     `analyzeAudioSegment()` / `transcribeSleepTalking()` generate results from
     `Math.random()` and a hardcoded list of 6 Polish placeholder phrases. The
     real Whisper call is commented out in the source.

## Goals

- Real, local (self-hosted, no external paid API) speech-to-text for both voice
  notes and sleep-talking segments, via **whisper.cpp** running on the existing VPS.
- Real, audio-derived (not random) heuristic detection of snoring/movement in
  sleep recordings, based on actual decoded volume per time segment.
- Sleep recordings actually uploaded to and processed by the server.

## Non-goals (explicitly deferred)

- An ML-trained snore/movement classifier — heuristic volume/duration thresholds
  only, on real but simple audio statistics. Revisit as its own project if the
  heuristic proves too inaccurate in practice.
- A persistent, always-loaded whisper.cpp server process — using on-demand
  subprocess invocation per job instead, since processing already runs async
  via the existing Bull queue and per-call model-load overhead (a few seconds)
  doesn't block the user.
- Chunked/streaming upload for multi-hour sleep recordings — uploading the
  whole night's file at once when recording stops, same as voice notes.

## Architecture

### New shared component: `AudioTranscriptionService`

New NestJS module (`api/src/audio-transcription/`), used by both voice notes
and sleep processing:

- `transcribe(audioFilePath: string, language = 'pl'): Promise<string>` —
  converts input audio to 16kHz mono WAV via FFmpeg (whisper.cpp's required
  input format), invokes the vendored whisper.cpp binary via
  `child_process.execFile`, returns the transcript text.
- `analyzeVolumeSegments(audioFilePath: string, segmentSeconds = 30): Promise<{startTime, endTime, avgVolumeDb}[]>` —
  uses FFmpeg's `astats`/`volumedetect` filter (or PCM decode + RMS) to compute
  real average volume per time window across the whole file. Used by sleep
  analysis; not needed for voice notes (which are short and analyzed whole).

whisper.cpp is built into the API's Docker image: `api/Dockerfile` gains a
build stage that clones/builds whisper.cpp and bakes in a multilingual model
(`base` or `small` size — sized for the existing modest VPS, which already
runs Ollama + this API; language set explicitly to Polish, matching the app's
primary language, not the English-only model variants). No model download at
container runtime.

### Voice notes (small change, low risk)

`VoiceProcessingService.transcribeAudio()` calls
`AudioTranscriptionService.transcribe()` instead of returning the placeholder.
Nothing else changes — voice notes already upload the real file via multipart
(`VoiceNotesController.create()` + `FileInterceptor`) and already process
asynchronously via the existing `voice-processing` Bull queue and
`VoiceProcessingProcessor`. This is a one-function swap.

### Sleep tracking (two real gaps to close)

**1. Upload transport.** `SleepTrackingController` gains multipart file upload
for the audio, mirroring `VoiceNotesController.create()`:
`@Post('process-audio')` adds `@UseInterceptors(FileInterceptor('audio'))`;
the uploaded file is saved under `uploads/sleep-recordings/` (mirroring voice
notes' storage convention) and its server path is what gets passed to
analysis — not a client-supplied path. Mobile side:
`hooks/use-sleep-recording.ts`'s `processSleepRecording()` switches from a
JSON body with `audioFilePath` to a multipart `FormData` upload (audio file +
`bedtime`/`wakeTime`), matching `ApiService.uploadVoiceNote()`'s existing
pattern.

**2. Async processing + real analysis.** A full night's audio can take a
while to segment and selectively transcribe, so this moves off the request
path onto a new Bull queue (`sleep-processing`) + `SleepProcessingProcessor`,
structurally mirroring `VoiceProcessingProcessor`:
- Endpoint saves the file, creates a `SleepTracking` row in a pending state,
  enqueues a job, returns immediately.
- Processor calls `AudioTranscriptionService.analyzeVolumeSegments()` for real
  per-segment volume data (replacing the `Math.random()` placeholder), applies
  volume/duration thresholds to flag snoring vs. movement vs. likely-speech
  segments, sends only the likely-speech segments (trimmed via FFmpeg) through
  `AudioTranscriptionService.transcribe()` for a real transcript, saves
  `SleepEvent` rows with that real data, then updates the `SleepTracking`
  record to completed with a quality score derived from real event
  counts/durations (formula-based, not random).
- Mobile side mirrors the existing voice-note "processing in the background"
  UX (`isProcessingVoiceNote`-style flag + periodic refresh) instead of
  expecting a synchronous fully-analyzed result from `stopSleepRecording()`.

`SleepTracking` has no processing-status field today (confirmed — unlike
`VoiceNote`'s `ProcessingStatus` enum). Add an equivalent enum column
(`pending` / `processing` / `completed` / `failed`) plus a migration.

### Error handling

FFmpeg/whisper.cpp failures (corrupt audio, unreadable format, binary crash)
are caught per-job and fall back to the existing `createBasicSleepRecord` /
basic-record patterns already present in the codebase — those become genuine
failure fallbacks now, not the default path they are today. Existing Bull
retry/timeout config is reused as-is for the new queue, matching
`voice-processing`'s configuration for consistency.

### Testing / verification

No test suite exists in this repo (established fact); this doesn't introduce
one. Verification instead:
- `tsc --noEmit` on both `api/` and the mobile app for type safety.
- A small real test audio file (a short recorded clip) pushed through the new
  `AudioTranscriptionService.transcribe()` directly and via `curl` against the
  running endpoints, confirming a real, non-placeholder transcript comes back.
- Full on-device mobile recording flow (record → stop → upload → see results)
  isn't automatable here (no touch automation available) — mobile-side changes
  are verified via type-checking and code review, with on-device testing
  recommended before the next TestFlight build is considered final.

## Sequencing

1. FFmpeg + whisper.cpp Docker build setup, shared `AudioTranscriptionService`.
2. Wire voice notes to it (isolated, low-risk).
3. Sleep: multipart upload transport fix + processing-status field if needed.
4. Sleep: new Bull queue/processor with real FFmpeg-based volume segmentation.
5. Sleep: wire likely-speech segments to real transcription.
6. Mobile client: sleep upload as multipart, async-processing UX.
7. Verification pass (type-check both apps, real small-audio smoke test).
