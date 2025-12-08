import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventsService } from '../events.service';

@Processor('event-processing')
@Injectable()
export class EventProcessingProcessor {
    private readonly logger = new Logger(EventProcessingProcessor.name);

    constructor(private readonly eventsService: EventsService) { }

    @Process('process-event')
    async processEvent(job: Job<{ eventId: string }>) {
        const { eventId } = job.data;

        this.logger.log(`Processing event: ${eventId}`);

        try {
            const event = await this.eventsService.findById(eventId);
            if (event) {
                await this.eventsService.processEvent(event);
                this.logger.log(`Event processed successfully: ${eventId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to process event ${eventId}:`, error);
            throw error;
        }
    }
}