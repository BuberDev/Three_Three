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

# wget explicitly, not just relying on busybox's built-in applet — the
# model-download script below uses `wget --no-config`, a flag busybox's
# minimal wget doesn't support ("wget: unrecognized option: no-config").
RUN apk add --no-cache build-base git cmake wget

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
