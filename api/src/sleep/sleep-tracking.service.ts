import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { CreateSleepTrackingDto } from './dto/create-sleep-tracking.dto';
import { UpdateSleepTrackingDto } from './dto/update-sleep-tracking.dto';
import { SleepTracking, SnoringIntensity } from './entities/sleep-tracking.entity';

@Injectable()
export class SleepTrackingService {
    constructor(
        @InjectRepository(SleepTracking)
        private readonly sleepTrackingRepository: Repository<SleepTracking>,
    ) { }

    async create(
        userId: string,
        createSleepTrackingDto: CreateSleepTrackingDto,
    ): Promise<SleepTracking> {
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

    async findById(id: string, userId: string): Promise<SleepTracking> {
        const sleepRecord = await this.sleepTrackingRepository.findOne({
            where: { id, userId },
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

    async processNocurnalAudio(
        userId: string,
        audioFilePath: string,
        bedtime: Date,
        wakeTime: Date,
    ): Promise<SleepTracking> {
        // This would integrate with audio processing service
        // For now, creating a basic sleep record
        const sleepDurationHours = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60) * 10) / 10; // hours

        const sleepRecord = await this.create(userId, {
            sleepDate: new Date().toISOString().split('T')[0],
            recordingStartTime: bedtime,
            recordingEndTime: wakeTime,
            sleepDurationHours,
            audioFiles: [{ url: audioFilePath, duration: sleepDurationHours * 60, segment: 1, size: 0 }],
            snoringDetected: true,
            snoringIntensity: SnoringIntensity.LIGHT, // would be detected from audio
            sleepTalkingDetected: false,
            sleepTalkingFrequency: 0,
            sleepQualityScore: 7,
            awakeningsCount: 0,
            analysisMetadata: {
                sleepEfficiency: Math.min(100, (sleepDurationHours / 8) * 100), // assuming 8h target
            },
        });

        return sleepRecord;
    }
}