import {
    CompleteHabitDto,
    CreateHabitDto,
    Habit,
    HabitCategory,
    HabitCompletion,
    HabitFrequency,
    HabitStats,
    HabitStatus,
    UpdateHabitDto,
} from '../types';
import { ApiService, unwrapApiEnvelope } from './api';
import { NotificationService } from './notification-service';

export interface GetHabitsFilters {
    status?: HabitStatus;
    category?: HabitCategory;
    frequency?: HabitFrequency;
    page?: number;
    limit?: number;
}

export interface GetHabitsResponse {
    habits: Habit[];
    total: number;
    page: number;
    totalPages: number;
}

export interface GetHabitStatsFilters {
    startDate?: string;
    endDate?: string;
}

export class HabitsService {
    private static instance: HabitsService;
    private apiService: ApiService;
    private notificationService: NotificationService;

    private constructor() {
        this.apiService = ApiService.getInstance();
        this.notificationService = NotificationService.getInstance();
    }

    public static getInstance(): HabitsService {
        if (!HabitsService.instance) {
            HabitsService.instance = new HabitsService();
        }
        return HabitsService.instance;
    }

    /**
     * Create a new habit
     */
    async createHabit(createHabitDto: CreateHabitDto): Promise<Habit> {
        try {
            const response = await this.apiService.makeRequest<Habit>('/habits', {
                method: 'POST',
                body: JSON.stringify(createHabitDto),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to create habit');
            }

            const habit = this.transformHabitDates(unwrapApiEnvelope<Habit>(response.data));

            // Schedule reminder if enabled
            if (habit.reminderSettings?.enabled && habit.reminderSettings.time) {
                await this.notificationService.scheduleHabitReminder(
                    habit.name,
                    {
                        time: habit.reminderSettings.time,
                        days: habit.reminderSettings.days
                    }
                );
            }

            return habit;
        } catch (error) {
            console.error('❌ Failed to create habit:', error);
            throw error;
        }
    }

    /**
     * Get all habits with filtering
     */
    async getHabits(filters: GetHabitsFilters = {}): Promise<GetHabitsResponse> {
        try {
            const queryParams = new URLSearchParams();

            if (filters.status) queryParams.set('status', filters.status);
            if (filters.category) queryParams.set('category', filters.category);
            if (filters.frequency) queryParams.set('frequency', filters.frequency);
            if (filters.page) queryParams.set('page', filters.page.toString());
            if (filters.limit) queryParams.set('limit', filters.limit.toString());

            const url = `/habits${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await this.apiService.makeRequest<GetHabitsResponse>(url);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch habits');
            }

            const apiData = unwrapApiEnvelope<GetHabitsResponse>(response.data);
            if (!apiData || !Array.isArray(apiData.habits)) {
                console.warn('⚠️ Invalid habits response structure:', response.data);
                return {
                    habits: [],
                    total: 0,
                    page: 1,
                    totalPages: 0,
                };
            }

            // Transform dates for all habits
            const habits = apiData.habits.map((habit: any) => this.transformHabitDates(habit));

            return {
                ...apiData,
                habits,
            };
        } catch (error) {
            console.error('❌ Failed to fetch habits:', error);
            throw error;
        }
    }

    /**
     * Get a specific habit by ID
     */
    async getHabit(habitId: string): Promise<Habit> {
        try {
            const response = await this.apiService.makeRequest<Habit>(`/habits/${habitId}`);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Habit not found');
            }

            return this.transformHabitDates(unwrapApiEnvelope<Habit>(response.data));
        } catch (error) {
            console.error('❌ Failed to fetch habit:', error);
            throw error;
        }
    }

    /**
     * Update a habit
     */
    async updateHabit(habitId: string, updateHabitDto: UpdateHabitDto): Promise<Habit> {
        try {
            const response = await this.apiService.makeRequest<Habit>(`/habits/${habitId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateHabitDto),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to update habit');
            }

            const habit = this.transformHabitDates(unwrapApiEnvelope<Habit>(response.data));

            // Cancel existing reminders for this habit
            await this.notificationService.cancelHabitReminders(habit.name);

            // Schedule new reminder if enabled
            if (habit.reminderSettings?.enabled && habit.reminderSettings.time) {
                await this.notificationService.scheduleHabitReminder(
                    habit.name,
                    {
                        time: habit.reminderSettings.time,
                        days: habit.reminderSettings.days
                    }
                );
            }

            return habit;
        } catch (error) {
            console.error('❌ Failed to update habit:', error);
            throw error;
        }
    }

    /**
     * Delete a habit
     */
    async deleteHabit(habitId: string): Promise<void> {
        try {
            // Get habit first to access its name for reminder cancellation
            const habit = await this.getHabit(habitId);

            const response = await this.apiService.makeRequest(`/habits/${habitId}`, {
                method: 'DELETE',
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to delete habit');
            }

            // Cancel any existing reminders for this habit
            await this.notificationService.cancelHabitReminders(habit.name);
        } catch (error) {
            console.error('❌ Failed to delete habit:', error);
            throw error;
        }
    }

    /**
     * Mark habit as completed
     */
    async completeHabit(habitId: string, completeHabitDto: CompleteHabitDto = {}): Promise<{
        habit: Habit;
        completion: HabitCompletion;
    }> {
        try {
            const response = await this.apiService.makeRequest<{
                habit: Habit;
                completion: HabitCompletion;
            }>(`/habits/${habitId}/complete`, {
                method: 'POST',
                body: JSON.stringify(completeHabitDto),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to complete habit');
            }

            const responseData = response.data as any;
            const actualData = unwrapApiEnvelope<{
                habit?: Habit;
                completion?: HabitCompletion;
            }>(responseData);
            const habitData = actualData?.habit;
            const completionData = actualData?.completion;

            if (!habitData) {
                console.log('Response data structure:', JSON.stringify(responseData, null, 2));
                console.log('Actual data level:', JSON.stringify(actualData, null, 2));
                throw new Error('No habit data received from server');
            }

            if (!completionData) {
                console.log('Response data structure:', JSON.stringify(responseData, null, 2));
                throw new Error('No completion data received from server');
            }

            return {
                habit: this.transformHabitDates(habitData),
                completion: this.transformCompletionDates(completionData),
            };
        } catch (error) {
            console.error('❌ Failed to complete habit:', error);
            throw error;
        }
    }

    /**
     * Remove habit completion
     */
    async uncompleteHabit(habitId: string, date?: string): Promise<Habit> {
        try {
            const url = `/habits/${habitId}/complete${date ? `?date=${date}` : ''}`;
            const response = await this.apiService.makeRequest<Habit>(url, {
                method: 'DELETE',
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to uncomplete habit');
            }

            return this.transformHabitDates(unwrapApiEnvelope<Habit>(response.data));
        } catch (error) {
            console.error('❌ Failed to uncomplete habit:', error);
            throw error;
        }
    }

    /**
     * Get habit completion history
     */
    async getHabitCompletions(
        habitId: string,
        startDate?: string,
        endDate?: string,
    ): Promise<HabitCompletion[]> {
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.set('startDate', startDate);
            if (endDate) queryParams.set('endDate', endDate);

            const url = `/habits/${habitId}/completions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await this.apiService.makeRequest<HabitCompletion[]>(url);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch habit completions');
            }

            return unwrapApiEnvelope<HabitCompletion[]>(response.data)
                .map((completion: any) => this.transformCompletionDates(completion));
        } catch (error) {
            console.error('❌ Failed to fetch habit completions:', error);
            throw error;
        }
    }

    /**
     * Get habit statistics
     */
    async getHabitStats(filters: GetHabitStatsFilters = {}): Promise<HabitStats> {
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.set('startDate', filters.startDate);
            if (filters.endDate) queryParams.set('endDate', filters.endDate);

            const url = `/habits/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await this.apiService.makeRequest<HabitStats>(url);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch habit statistics');
            }

            return unwrapApiEnvelope<HabitStats>(response.data);
        } catch (error) {
            console.error('❌ Failed to fetch habit statistics:', error);
            throw error;
        }
    }

    /**
     * Transform habit date strings to Date objects with null safety
     * @param habit - The habit object to transform (can be null/undefined)
     * @returns Transformed habit with proper Date objects
     */
    private transformHabitDates(habit: any): Habit {
        if (!habit) {
            throw new Error('Habit object is required for date transformation');
        }

        return {
            ...habit,
            createdAt: habit.createdAt ? new Date(habit.createdAt) : new Date(),
            updatedAt: habit.updatedAt ? new Date(habit.updatedAt) : new Date(),
            lastCompletedAt: habit.lastCompletedAt ? new Date(habit.lastCompletedAt) : undefined,
        };
    }

    /**
     * Transform completion date strings to Date objects with null safety
     * @param completion - The completion object to transform (can be null/undefined)
     * @returns Transformed completion with proper Date objects
     */
    private transformCompletionDates(completion: any): HabitCompletion {
        if (!completion) {
            throw new Error('Completion object is required for date transformation');
        }

        return {
            ...completion,
            completedAt: completion.completedAt ? new Date(completion.completedAt) : new Date(),
            createdAt: completion.createdAt ? new Date(completion.createdAt) : new Date(),
            updatedAt: completion.updatedAt ? new Date(completion.updatedAt) : new Date(),
        };
    }

    /**
     * Check if habit is completed today (client-side helper)
     */
    static isHabitCompletedToday(habit: Habit): boolean {
        if (!habit.lastCompletedAt) return false;

        const today = new Date();
        const lastCompleted = new Date(habit.lastCompletedAt);

        return (
            today.getFullYear() === lastCompleted.getFullYear() &&
            today.getMonth() === lastCompleted.getMonth() &&
            today.getDate() === lastCompleted.getDate()
        );
    }

    /**
     * Calculate completion rate (client-side helper)
     */
    static calculateCompletionRate(habit: Habit): number {
        const daysSinceCreated = Math.floor(
            (new Date().getTime() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreated === 0) return 0;
        return Math.round((habit.totalCompletions / daysSinceCreated) * 100);
    }
}
