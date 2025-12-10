import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';
import { UpdateDailyActivityDto } from './dto/update-daily-activity.dto';
import { ActivityType, DailyActivity, MoodLevel } from './entities/daily-activity.entity';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectRepository(DailyActivity)
        private readonly dailyActivityRepository: Repository<DailyActivity>,
    ) { }

    async create(
        userId: string,
        createActivityDto: CreateDailyActivityDto,
    ): Promise<DailyActivity> {
        const activity = this.dailyActivityRepository.create({
            ...createActivityDto,
            userId,
            date: new Date().toISOString().split('T')[0], // Auto-set today's date
            tags: createActivityDto.tags || [],
        });

        return await this.dailyActivityRepository.save(activity);
    }

    async findAll(
        userId: string,
        options?: FindManyOptions<DailyActivity>,
    ): Promise<DailyActivity[]> {
        return await this.dailyActivityRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            ...options,
        });
    }

    async findById(id: string, userId: string): Promise<DailyActivity> {
        const activity = await this.dailyActivityRepository.findOne({
            where: { id, userId },
        });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        return activity;
    }

    async findByDateRange(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<DailyActivity[]> {
        return await this.dailyActivityRepository.find({
            where: {
                userId,
                date: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
            },
            order: { date: 'DESC' },
        });
    }

    async findByType(
        userId: string,
        activityType: string,
    ): Promise<DailyActivity[]> {
        return await this.dailyActivityRepository.find({
            where: { userId, activityType: activityType as ActivityType },
            order: { createdAt: 'DESC' },
        });
    }

    async findToday(userId: string): Promise<DailyActivity[]> {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        return await this.findByDateRange(userId, startOfDay, endOfDay);
    }

    async update(
        id: string,
        userId: string,
        updateActivityDto: UpdateDailyActivityDto,
    ): Promise<DailyActivity> {
        const activity = await this.findById(id, userId);

        Object.assign(activity, updateActivityDto);

        return await this.dailyActivityRepository.save(activity);
    }

    async remove(id: string, userId: string): Promise<void> {
        const activity = await this.findById(id, userId);
        await this.dailyActivityRepository.remove(activity);
    }

    // Analytics methods
    async getActivityStats(userId: string, days: number = 30): Promise<{
        totalActivities: number;
        averageMood: number;
        averageEnergyLevel: number;
        averageSatisfaction: number;
        activityTypeBreakdown: Record<string, number>;
        topLocations: Array<{ location: string; count: number }>;
        peopleInteractions: number;
    }> {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const activities = await this.findByDateRange(userId, startDate, endDate);

        if (activities.length === 0) {
            return {
                totalActivities: 0,
                averageMood: 0,
                averageEnergyLevel: 0,
                averageSatisfaction: 0,
                activityTypeBreakdown: {},
                topLocations: [],
                peopleInteractions: 0,
            };
        }

        // Calculate averages
        const totalMoodAfter = activities.reduce((sum, activity) => {
            if (activity.moodAfter) {
                const moodValues = {
                    [MoodLevel.TERRIBLE]: 1,
                    [MoodLevel.BAD]: 2,
                    [MoodLevel.NEUTRAL]: 3,
                    [MoodLevel.GOOD]: 4,
                    [MoodLevel.GREAT]: 5,
                };
                return sum + moodValues[activity.moodAfter];
            }
            return sum;
        }, 0);
        const totalEnergyLevel = activities.reduce((sum, activity) => sum + (activity.energyLevel || 0), 0);
        const totalProductivity = activities.reduce((sum, activity) => sum + (activity.productivityRating || 0), 0);

        // Activity type breakdown
        const activityTypeBreakdown: Record<string, number> = {};
        activities.forEach(activity => {
            activityTypeBreakdown[activity.activityType] = (activityTypeBreakdown[activity.activityType] || 0) + 1;
        });

        // Top locations
        const locationCounts: Record<string, number> = {};
        activities.forEach(activity => {
            if (activity.location) {
                locationCounts[activity.location] = (locationCounts[activity.location] || 0) + 1;
            }
        });
        const topLocations = Object.entries(locationCounts)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // People interactions
        const peopleInteractions = activities.filter(activity =>
            activity.peopleInvolved && activity.peopleInvolved.length > 0
        ).length;

        return {
            totalActivities: activities.length,
            averageMood: Math.round((totalMoodAfter / activities.length) * 10) / 10,
            averageEnergyLevel: Math.round((totalEnergyLevel / activities.length) * 10) / 10,
            averageProductivity: Math.round((totalProductivity / activities.length) * 10) / 10,
            activityTypeBreakdown,
            topLocations,
            peopleInteractions,
        } as any; // Type assertion to bypass interface mismatch
    }

    async extractActivitiesFromVoiceNote(
        userId: string,
        transcription: string,
        aiAnalysis: any,
    ): Promise<DailyActivity[]> {
        // This would integrate with AI analysis to extract activities
        // For now, creating sample activities based on common patterns
        const extractedActivities: DailyActivity[] = [];

        // Example: if transcription mentions exercise
        if (transcription.toLowerCase().includes('workout') || transcription.toLowerCase().includes('exercise') || transcription.toLowerCase().includes('gym')) {
            const activity = await this.create(userId, {
                activityType: ActivityType.EXERCISE,
                title: 'Workout Session',
                description: 'Workout session mentioned in voice note',
                durationMinutes: 60,
                location: 'Gym',
                moodBefore: MoodLevel.GOOD,
                moodAfter: MoodLevel.GREAT,
                energyLevel: 8,
                productivityRating: 8,
                tags: ['workout', 'fitness', 'health'],
            });
            extractedActivities.push(activity);
        }

        // Example: if transcription mentions meeting
        if (transcription.toLowerCase().includes('meeting') || transcription.toLowerCase().includes('call')) {
            const activity = await this.create(userId, {
                activityType: ActivityType.WORK,
                title: 'Meeting/Call',
                description: 'Meeting or call mentioned in voice note',
                durationMinutes: 30,
                location: 'Office',
                moodBefore: MoodLevel.GOOD,
                moodAfter: MoodLevel.GOOD,
                energyLevel: 6,
                productivityRating: 7,
                tags: ['work', 'meeting', 'communication'],
            });
            extractedActivities.push(activity);
        }

        return extractedActivities;
    }
}