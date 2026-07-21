import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { randomUUID as uuidv4 } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { CreateSleepTrackingDto } from './dto/create-sleep-tracking.dto';
import { UpdateSleepTrackingDto } from './dto/update-sleep-tracking.dto';
import { SleepEvent } from './entities/sleep-event.entity';
import { SleepProcessingStatus, SleepTracking, SnoringIntensity } from './entities/sleep-tracking.entity';
import { SleepAnalysisService } from './services/sleep-analysis.service';
import { SleepCorrelationService } from './services/sleep-correlation.service';

@Injectable()
export class SleepTrackingService {
    private readonly logger = new Logger(SleepTrackingService.name);

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

    async create(
        userId: string,
        createSleepTrackingDto: CreateSleepTrackingDto,
    ): Promise<SleepTracking> {
        // Check if a record already exists for this user and date
        const existingRecord = await this.sleepTrackingRepository.findOne({
            where: {
                userId,
                sleepDate: createSleepTrackingDto.sleepDate,
            },
        });

        if (existingRecord) {
            // Update existing record
            await this.sleepTrackingRepository.update(existingRecord.id, createSleepTrackingDto);
            return await this.sleepTrackingRepository.findOne({
                where: { id: existingRecord.id },
            });
        }

        // Create new record
        const sleepRecord = this.sleepTrackingRepository.create({
            ...createSleepTrackingDto,
            userId,
        });

        return await this.sleepTrackingRepository.save(sleepRecord);
    }

    async findAll(
        userId: string,
        options?: FindManyOptions<SleepTracking>,
    ): Promise<SleepTracking[]> {
        return await this.sleepTrackingRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            ...options,
        });
    }

    async findById(id: string, userId?: string): Promise<SleepTracking> {
        const sleepRecord = await this.sleepTrackingRepository.findOne({
            where: userId ? { id, userId } : { id },
        });

        if (!sleepRecord) {
            throw new NotFoundException('Sleep record not found');
        }

        return sleepRecord;
    }

    async findByDateRange(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<SleepTracking[]> {
        return await this.sleepTrackingRepository.find({
            where: {
                userId,
                sleepDate: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
            },
            order: { sleepDate: 'DESC' },
        });
    }

    async findLatest(userId: string): Promise<SleepTracking | null> {
        return await this.sleepTrackingRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async update(
        id: string,
        userId: string,
        updateSleepTrackingDto: UpdateSleepTrackingDto,
    ): Promise<SleepTracking> {
        const sleepRecord = await this.findById(id, userId);

        Object.assign(sleepRecord, updateSleepTrackingDto);

        return await this.sleepTrackingRepository.save(sleepRecord);
    }

    async remove(id: string, userId: string): Promise<void> {
        const sleepRecord = await this.findById(id, userId);
        await this.sleepTrackingRepository.remove(sleepRecord);
    }

    // Analytics methods
    async getSleepStats(userId: string, days: number = 30): Promise<{
        averageDuration: number;
        averageQuality: number;
        averageEfficiency: number;
        snoringNights: number;
        sleepTalkingNights: number;
        totalRecords: number;
    }> {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const records = await this.findByDateRange(userId, startDate, endDate);

        if (records.length === 0) {
            return {
                averageDuration: 0,
                averageQuality: 0,
                averageEfficiency: 0,
                snoringNights: 0,
                sleepTalkingNights: 0,
                totalRecords: 0,
            };
        }

        const totalDuration = records.reduce((sum, record) => sum + (record.sleepDurationHours || 0), 0);
        const totalQuality = records.reduce((sum, record) => sum + (record.sleepQualityScore || 0), 0);
        const totalEfficiency = records.reduce((sum, record) => sum + (record.sleepEfficiency || 0), 0);
        const snoringNights = records.filter(record => record.snoringIntensity !== SnoringIntensity.NONE).length;
        const sleepTalkingNights = records.filter(record => record.sleepTalkingDetected).length;

        return {
            averageDuration: Math.round(totalDuration / records.length),
            averageQuality: Math.round((totalQuality / records.length) * 10) / 10,
            averageEfficiency: Math.round((totalEfficiency / records.length) * 10) / 10,
            snoringNights,
            sleepTalkingNights,
            totalRecords: records.length,
        };
    }

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
        sleepRecord.processingStatus = SleepProcessingStatus.PENDING;

        this.sleepProcessingQueue.add('process-sleep-audio', {
            sleepTrackingId: sleepRecord.id,
            audioFilePath: filePath,
        }).catch((error) => {
            this.logger.error(`Failed to queue sleep recording ${sleepRecord.id} for processing:`, error);
        });

        return sleepRecord;
    }

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

    /**
     * Get comprehensive sleep insights with AI correlations
     */
    async getSleepInsights(userId: string, sleepTrackingId: string) {
        try {
            this.logger.log(`Generating sleep insights for tracking: ${sleepTrackingId}`);

            const insights = await this.sleepCorrelationService.generateSleepInsights(
                userId,
                sleepTrackingId,
            );

            return insights;
        } catch (error) {
            this.logger.error(`Sleep insights generation failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Fallback method for basic sleep record creation — used when real
     * analysis fails (called by SleepProcessingProcessor).
     */
    async createBasicSleepRecord(
        userId: string,
        audioFilePath: string,
        bedtime: string,
        wakeTime: string,
    ): Promise<SleepTracking> {
        const sleepDurationHours = Math.round(
            (new Date(wakeTime).getTime() - new Date(bedtime).getTime()) / (1000 * 60 * 60) * 10
        ) / 10;

        return this.create(userId, {
            sleepDate: new Date().toISOString().split('T')[0],
            recordingStartTime: bedtime,
            recordingEndTime: wakeTime,
            sleepDurationHours,
            audioFiles: [{
                url: audioFilePath,
                duration: sleepDurationHours * 60,
                segment: 1,
                size: 0
            }],
            snoringDetected: false,
            snoringIntensity: SnoringIntensity.NONE,
            sleepTalkingDetected: false,
            sleepTalkingFrequency: 0,
            sleepQualityScore: Math.max(1, Math.min(10, sleepDurationHours * 1.2)), // Basic duration-based score
            awakeningsCount: 0,
            sleepEfficiency: Math.min(100, (sleepDurationHours / 8) * 100),
            analysisMetadata: {
                fallbackMode: true,
                reason: 'AI analysis failed, using basic calculation',
            },
        });
    }
}