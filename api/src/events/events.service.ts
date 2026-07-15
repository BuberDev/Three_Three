import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { randomUUID as uuidv4 } from 'crypto';
import { FindManyOptions, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import {
    Event,
    EventStatus,
    EventType,
} from './entities/event.entity';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
        @InjectQueue('event-processing')
        private readonly eventProcessingQueue: Queue,
    ) { }

    async emit(
        type: EventType | string,
        payload: Record<string, any>,
        options?: {
            userId?: string;
            correlationId?: string;
            sourceService?: string;
            metadata?: Record<string, any>;
            immediate?: boolean;
        },
    ): Promise<Event> {
        const event = this.eventRepository.create({
            type: type as EventType,
            userId: options?.userId,
            payload,
            correlationId: options?.correlationId || uuidv4(),
            sourceService: options?.sourceService || 'api',
            metadata: options?.metadata || {},
            status: EventStatus.PENDING,
        });

        const savedEvent = await this.eventRepository.save(event);

        // Queue for processing unless immediate processing is requested
        if (options?.immediate) {
            await this.processEvent(savedEvent);
        } else {
            await this.eventProcessingQueue.add('process-event', {
                eventId: savedEvent.id,
            });
        }

        this.logger.log(`Event emitted: ${type} [${savedEvent.id}]`);
        return savedEvent;
    }

    async create(createEventDto: CreateEventDto): Promise<Event> {
        const event = this.eventRepository.create({
            ...createEventDto,
            correlationId: createEventDto.correlationId || uuidv4(),
            status: EventStatus.PENDING,
        });

        const savedEvent = await this.eventRepository.save(event);

        // Queue for processing
        await this.eventProcessingQueue.add('process-event', {
            eventId: savedEvent.id,
        });

        return savedEvent;
    }

    async findAll(
        userId?: string,
        options?: FindManyOptions<Event>,
    ): Promise<Event[]> {
        const whereCondition = userId ? { userId } : {};

        return this.eventRepository.find({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            ...options,
        });
    }

    async findById(id: string): Promise<Event | null> {
        return this.eventRepository.findOne({
            where: { id },
            relations: ['user'],
        });
    }

    async findByCorrelationId(correlationId: string): Promise<Event[]> {
        return this.eventRepository.find({
            where: { correlationId },
            order: { createdAt: 'ASC' },
        });
    }

    async updateStatus(
        id: string,
        status: EventStatus,
        error?: string,
    ): Promise<void> {
        const updateData: Partial<Event> = { status };

        if (status === EventStatus.PROCESSING) {
            updateData.processingStartedAt = new Date();
        }

        if (status === EventStatus.PROCESSED) {
            updateData.processingCompletedAt = new Date();
        }

        if (status === EventStatus.FAILED && error) {
            updateData.processingError = error;
        }

        await this.eventRepository.update(id, updateData);
    }

    async incrementRetryCount(id: string): Promise<void> {
        await this.eventRepository.increment(
            { id },
            'retryCount',
            1,
        );

        // Set next retry time (exponential backoff)
        const event = await this.findById(id);
        if (event) {
            const backoffMinutes = Math.pow(2, event.retryCount) * 5; // 5, 10, 20 minutes
            const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

            await this.eventRepository.update(id, {
                status: EventStatus.RETRYING,
                nextRetryAt,
            });
        }
    }

    async processEvent(event: Event): Promise<void> {
        this.logger.log(`Processing event: ${event.type} [${event.id}]`);

        try {
            await this.updateStatus(event.id, EventStatus.PROCESSING);

            // Process different event types
            switch (event.type) {
                case EventType.USER_REGISTERED:
                    await this.handleUserRegistered(event);
                    break;
                case EventType.VOICE_NOTE_PROCESSED:
                    await this.handleVoiceNoteProcessed(event);
                    break;
                case EventType.TASK_COMPLETED:
                    await this.handleTaskCompleted(event);
                    break;
                case EventType.DAILY_ENTRY_CREATED:
                    await this.handleDailyEntryCreated(event);
                    break;
                case EventType.HABIT_COMPLETED:
                    await this.handleHabitCompleted(event);
                    break;
                default:
                    this.logger.warn(`Unhandled event type: ${event.type}`);
            }

            await this.updateStatus(event.id, EventStatus.PROCESSED);
            this.logger.log(`Event processed successfully: ${event.type} [${event.id}]`);
        } catch (error) {
            this.logger.error(
                `Event processing failed: ${event.type} [${event.id}]`,
                error.stack,
            );

            await this.updateStatus(event.id, EventStatus.FAILED, error.message);

            // Schedule retry if eligible
            if (event.retryCount < 3) {
                await this.incrementRetryCount(event.id);
            }

            throw error;
        }
    }

    private async handleUserRegistered(event: Event): Promise<void> {
        // Handle user registration events
        // E.g., send welcome email, create default settings, etc.
        this.logger.log(`User registered: ${event.payload.userId}`);
    }

    private async handleVoiceNoteProcessed(event: Event): Promise<void> {
        // Handle voice note processing completion
        // E.g., trigger personalization updates, generate insights
        const { voiceNoteId, userId, insights } = event.payload;

        // Trigger personalization engine update
        await this.emit(EventType.PERSONALIZATION_UPDATED, {
            userId,
            source: 'voice_note',
            sourceId: voiceNoteId,
            insights,
        });
    }

    private async handleTaskCompleted(event: Event): Promise<void> {
        // Handle task completion
        // E.g., check for goal achievements, update streaks
        const { taskId, userId } = event.payload;

        this.logger.log(`Task completed: ${taskId} by user: ${userId}`);
    }

    private async handleDailyEntryCreated(event: Event): Promise<void> {
        // Handle daily entry creation
        // E.g., analyze patterns, trigger insights
        const { dailyEntryId, userId } = event.payload;

        this.logger.log(`Daily entry created: ${dailyEntryId} by user: ${userId}`);
    }

    private async handleHabitCompleted(event: Event): Promise<void> {
        // Handle habit completion events
        // E.g., check for streak milestones, trigger achievements, send congratulations
        const { habitId, userId, currentStreak, totalCompletions } = event.payload;

        this.logger.log(
            `Habit completed: ${habitId} by user: ${userId} (streak: ${currentStreak}, total: ${totalCompletions})`
        );

        // Check for streak milestones (e.g., 7, 30, 100 days)
        const milestones = [7, 14, 30, 60, 100, 200, 365];
        if (milestones.includes(currentStreak)) {
            await this.emit(EventType.HABIT_STREAK_MILESTONE, {
                habitId,
                userId,
                milestone: currentStreak,
                totalCompletions,
            });
        }
    }

    async getEventStats(userId?: string): Promise<{
        total: number;
        pending: number;
        processing: number;
        processed: number;
        failed: number;
        retrying: number;
    }> {
        const queryBuilder = this.eventRepository.createQueryBuilder('event');

        if (userId) {
            queryBuilder.where('event.userId = :userId', { userId });
        }

        const stats = await queryBuilder
            .select('event.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.status')
            .getRawMany();

        const result = {
            total: 0,
            pending: 0,
            processing: 0,
            processed: 0,
            failed: 0,
            retrying: 0,
        };

        stats.forEach((stat) => {
            const count = parseInt(stat.count, 10);
            result.total += count;
            result[stat.status as keyof typeof result] = count;
        });

        return result;
    }

    async getFailedEvents(limit = 50): Promise<Event[]> {
        return this.eventRepository.find({
            where: { status: EventStatus.FAILED },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async getRetryableEvents(): Promise<Event[]> {
        return this.eventRepository
            .createQueryBuilder('event')
            .where('event.status = :status', { status: EventStatus.RETRYING })
            .andWhere('event.retryCount < :maxRetries', { maxRetries: 3 })
            .andWhere('(event.nextRetryAt IS NULL OR event.nextRetryAt <= :now)', {
                now: new Date(),
            })
            .orderBy('event.nextRetryAt', 'ASC')
            .getMany();
    }
}
