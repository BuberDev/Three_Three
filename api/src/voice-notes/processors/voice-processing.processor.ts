import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventsService } from '../../events/events.service';
import { ProcessingStatus } from '../entities/voice-note.entity';
import { VoiceNotesService } from '../voice-notes.service';
import { VoiceProcessingService } from '../voice-processing.service';

interface VoiceProcessingJob {
    voiceNoteId: string;
}

@Processor('voice-processing')
export class VoiceProcessingProcessor {
    private readonly logger = new Logger(VoiceProcessingProcessor.name);

    constructor(
        private readonly voiceNotesService: VoiceNotesService,
        private readonly voiceProcessingService: VoiceProcessingService,
        private readonly eventsService: EventsService,
    ) { }

    @Process('process-voice-note')
    async processVoiceNote(job: Job<VoiceProcessingJob>) {
        const { voiceNoteId } = job.data;
        this.logger.log(`Processing voice note: ${voiceNoteId}`);

        try {
            // Update status to processing
            await this.voiceNotesService.updateProcessingStatus(
                voiceNoteId,
                ProcessingStatus.PROCESSING,
            );

            // Get voice note with file path
            const voiceNote = await this.voiceNotesService.findById(
                voiceNoteId,
                // We need a way to get voice note without user context for processing
                // This is a technical debt - should be refactored
                voiceNoteId, // Temporary workaround
            );

            // Process the audio file
            const results = await this.voiceProcessingService.processVoiceNote(
                voiceNote.audioFilePath,
            );

            // Update voice note with results
            await this.voiceNotesService.updateProcessingResults(voiceNoteId, results);

            // Update status to completed
            await this.voiceNotesService.updateProcessingStatus(
                voiceNoteId,
                ProcessingStatus.COMPLETED,
            );

            // Emit event for successful processing
            await this.eventsService.emit('voice_note_processed', {
                voiceNoteId,
                userId: voiceNote.userId,
                processingDuration: job.processedOn ? Date.now() - job.processedOn : null,
                transcription: results.transcription,
                insights: results.insights,
            });

            this.logger.log(`Successfully processed voice note: ${voiceNoteId}`);
        } catch (error) {
            this.logger.error(
                `Failed to process voice note ${voiceNoteId}:`,
                error.stack,
            );

            // Update status to failed
            await this.voiceNotesService.updateProcessingStatus(
                voiceNoteId,
                ProcessingStatus.FAILED,
                error.message,
            );

            // Emit event for failed processing
            await this.eventsService.emit('voice_note_processing_failed', {
                voiceNoteId,
                error: error.message,
                stack: error.stack,
            });

            throw error;
        }
    }

    @Process('reprocess-voice-note')
    async reprocessVoiceNote(job: Job<VoiceProcessingJob>) {
        const { voiceNoteId } = job.data;
        this.logger.log(`Reprocessing voice note: ${voiceNoteId}`);

        // Reset processing status and retry
        await this.voiceNotesService.updateProcessingStatus(
            voiceNoteId,
            ProcessingStatus.PENDING,
        );

        // Re-queue for processing
        return this.processVoiceNote(job);
    }
}