import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EventType } from '../events/entities/event.entity';
import { EventsService } from '../events/events.service';
import { CompleteHabitDto } from './dto/complete-habit.dto';
import { CreateHabitDto } from './dto/create-habit.dto';
import { GetHabitsDto, GetHabitStatsDto } from './dto/get-habits.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitCompletion } from './entities/habit-completion.entity';
import { Habit, HabitStatus } from './entities/habit.entity';

export interface HabitStats {
    totalHabits: number;
    activeHabits: number;
    totalCompletions: number;
    averageCompletionRate: number;
    currentActiveStreak: number;
    longestStreak: number;
    completedToday: number;
    pendingToday: number;
    categoryBreakdown: Record<string, number>;
    weeklyProgress: Array<{
        date: string;
        completions: number;
        totalHabits: number;
    }>;
}

@Injectable()
export class HabitsService {
    constructor(
        @InjectRepository(Habit)
        private readonly habitRepository: Repository<Habit>,
        @InjectRepository(HabitCompletion)
        private readonly completionRepository: Repository<HabitCompletion>,
        private readonly eventsService: EventsService,
    ) { }

    async create(userId: string, createHabitDto: CreateHabitDto): Promise<Habit> {
        // Validate target days for weekly/monthly habits
        if (createHabitDto.frequency !== 'daily' && !createHabitDto.targetDays) {
            throw new BadRequestException(
                'Target days required for weekly/monthly habits'
            );
        }

        const habit = this.habitRepository.create({
            ...createHabitDto,
            userId,
        });

        const savedHabit = await this.habitRepository.save(habit);

        // Emit event
        await this.eventsService.emit(EventType.HABIT_CREATED, {
            habitId: savedHabit.id,
            userId,
            name: savedHabit.name,
            category: savedHabit.category,
            frequency: savedHabit.frequency,
        });

        return savedHabit;
    }

    async findAll(userId: string, filters: GetHabitsDto): Promise<{
        habits: Habit[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const { status, category, frequency, page = 1, limit = 50 } = filters;

        const queryBuilder = this.habitRepository
            .createQueryBuilder('habit')
            .where('habit.userId = :userId', { userId });

        if (status) {
            queryBuilder.andWhere('habit.status = :status', { status });
        }

        if (category) {
            queryBuilder.andWhere('habit.category = :category', { category });
        }

        if (frequency) {
            queryBuilder.andWhere('habit.frequency = :frequency', { frequency });
        }

        const total = await queryBuilder.getCount();
        const habits = await queryBuilder
            .orderBy('habit.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            habits,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(userId: string, id: string): Promise<Habit> {
        const habit = await this.habitRepository.findOne({
            where: { id, userId },
        });

        if (!habit) {
            throw new NotFoundException('Habit not found');
        }

        return habit;
    }

    async update(
        userId: string,
        id: string,
        updateHabitDto: UpdateHabitDto,
    ): Promise<Habit> {
        const habit = await this.findOne(userId, id);

        // Validate target days for weekly/monthly habits
        if (updateHabitDto.frequency && updateHabitDto.frequency !== 'daily' && !updateHabitDto.targetDays && !habit.targetDays) {
            throw new BadRequestException(
                'Target days required for weekly/monthly habits'
            );
        }

        Object.assign(habit, updateHabitDto);
        const savedHabit = await this.habitRepository.save(habit);

        // Emit event
        await this.eventsService.emit(EventType.HABIT_UPDATED, {
            habitId: savedHabit.id,
            userId,
            changes: updateHabitDto,
        });

        return savedHabit;
    }

    async remove(userId: string, id: string): Promise<void> {
        const habit = await this.findOne(userId, id);

        await this.habitRepository.remove(habit);

        // Emit event
        await this.eventsService.emit(EventType.HABIT_DELETED, {
            habitId: id,
            userId,
            name: habit.name,
        });
    }

    async completeHabit(
        userId: string,
        habitId: string,
        completeHabitDto: CompleteHabitDto,
    ): Promise<{ habit: Habit; completion: HabitCompletion }> {
        const habit = await this.findOne(userId, habitId);

        // Parse completion date or use today
        const completedAt = completeHabitDto.completedAt
            ? new Date(completeHabitDto.completedAt)
            : new Date();

        // Check if already completed on this date
        const existingCompletion = await this.completionRepository.findOne({
            where: {
                habitId,
                userId,
                completedAt,
            },
        });

        if (existingCompletion) {
            throw new BadRequestException('Habit already completed on this date');
        }

        // Create completion record
        const completion = this.completionRepository.create({
            habitId,
            userId,
            completedAt,
            notes: completeHabitDto.notes,
            rating: completeHabitDto.rating,
            metadata: completeHabitDto.metadata,
        });

        await this.completionRepository.save(completion);

        // Update habit statistics
        await this.updateHabitStatistics(habit);

        // Emit event
        await this.eventsService.emit(EventType.HABIT_COMPLETED, {
            habitId,
            userId,
            completedAt,
            currentStreak: habit.currentStreak,
            totalCompletions: habit.totalCompletions,
        });

        return { habit, completion };
    }

    async uncompleteHabit(
        userId: string,
        habitId: string,
        date?: string,
    ): Promise<Habit> {
        const habit = await this.findOne(userId, habitId);
        const completedAt = date ? new Date(date) : new Date();

        const completion = await this.completionRepository.findOne({
            where: {
                habitId,
                userId,
                completedAt,
            },
        });

        if (!completion) {
            throw new NotFoundException('Completion not found for this date');
        }

        await this.completionRepository.remove(completion);

        // Update habit statistics
        await this.updateHabitStatistics(habit);

        // Emit event
        await this.eventsService.emit(EventType.HABIT_UNCOMPLETED, {
            habitId,
            userId,
            completedAt,
        });

        return habit;
    }

    async getHabitCompletions(
        userId: string,
        habitId: string,
        startDate?: string,
        endDate?: string,
    ): Promise<HabitCompletion[]> {
        const habit = await this.findOne(userId, habitId);

        const queryBuilder = this.completionRepository
            .createQueryBuilder('completion')
            .where('completion.habitId = :habitId', { habitId })
            .andWhere('completion.userId = :userId', { userId });

        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date('1970-01-01');
            const end = endDate ? new Date(endDate) : new Date();
            queryBuilder.andWhere('completion.completedAt BETWEEN :start AND :end', {
                start,
                end,
            });
        }

        return queryBuilder
            .orderBy('completion.completedAt', 'DESC')
            .getMany();
    }

    async getHabitStats(
        userId: string,
        filters: GetHabitStatsDto,
    ): Promise<HabitStats> {
        const { startDate, endDate } = filters;

        // Get user's habits
        const habits = await this.habitRepository.find({
            where: { userId, status: HabitStatus.ACTIVE },
        });

        const totalHabits = habits.length;
        const activeHabits = habits.filter(h => h.status === HabitStatus.ACTIVE).length;

        // Calculate date range
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Get completions in date range
        const completions = await this.completionRepository.find({
            where: {
                userId,
                completedAt: Between(start, end),
            },
            relations: ['habit'],
        });

        const totalCompletions = completions.length;

        // Calculate completion rate
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const expectedCompletions = totalHabits * daysDiff;
        const averageCompletionRate = expectedCompletions > 0
            ? Math.round((totalCompletions / expectedCompletions) * 100)
            : 0;

        // Get current streaks
        const currentActiveStreak = Math.max(...habits.map(h => h.currentStreak), 0);
        const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);

        // Today's statistics
        const today = new Date();
        const todayCompletions = completions.filter(c => {
            const completedDate = new Date(c.completedAt);
            return completedDate.toDateString() === today.toDateString();
        });

        const completedToday = todayCompletions.length;
        const pendingToday = activeHabits - completedToday;

        // Category breakdown
        const categoryBreakdown = habits.reduce((acc, habit) => {
            acc[habit.category] = (acc[habit.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Weekly progress
        const weeklyProgress = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayCompletions = completions.filter(c => {
                const completedDate = new Date(c.completedAt);
                return completedDate.toDateString() === date.toDateString();
            }).length;

            weeklyProgress.push({
                date: dateStr,
                completions: dayCompletions,
                totalHabits: activeHabits,
            });
        }

        return {
            totalHabits,
            activeHabits,
            totalCompletions,
            averageCompletionRate,
            currentActiveStreak,
            longestStreak,
            completedToday,
            pendingToday,
            categoryBreakdown,
            weeklyProgress,
        };
    }

    private async updateHabitStatistics(habit: Habit): Promise<void> {
        // Get all completions for this habit
        const completions = await this.completionRepository.find({
            where: { habitId: habit.id },
            order: { completedAt: 'DESC' },
        });

        habit.totalCompletions = completions.length;

        if (completions.length === 0) {
            habit.currentStreak = 0;
            habit.longestStreak = 0;
            habit.lastCompletedAt = null;
        } else {
            habit.lastCompletedAt = completions[0].completedAt;

            // Calculate current streak
            let currentStreak = 0;
            const today = new Date();

            // Sort completions by date (newest first)
            const sortedCompletions = completions.sort((a, b) =>
                new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            );

            // Check if completed today or yesterday to start counting
            const latestCompletion = new Date(sortedCompletions[0].completedAt);
            const daysDiff = Math.floor((today.getTime() - latestCompletion.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 1) {
                currentStreak = 1;

                // Count consecutive days backwards
                for (let i = 1; i < sortedCompletions.length; i++) {
                    const current = new Date(sortedCompletions[i - 1].completedAt);
                    const previous = new Date(sortedCompletions[i].completedAt);
                    const diff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            habit.currentStreak = currentStreak;

            // Calculate longest streak
            let longestStreak = 0;
            let tempStreak = 1;

            for (let i = 1; i < sortedCompletions.length; i++) {
                const current = new Date(sortedCompletions[i - 1].completedAt);
                const previous = new Date(sortedCompletions[i].completedAt);
                const diff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

                if (diff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }

            habit.longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
        }

        await this.habitRepository.save(habit);
    }
}