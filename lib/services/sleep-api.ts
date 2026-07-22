import { API_BASE_URL } from '@/lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unwrapApiEnvelope } from './api';

export interface SleepRecord {
    id: string;
    userId: string;
    sleepDate: string;
    recordingStartTime: string;
    recordingEndTime: string;
    sleepDurationHours: number;
    sleepQualityScore: number;
    sleepEfficiency: number;
    restfulnessScore: number;
    snoringDetected: boolean;
    snoringIntensity: 'none' | 'light' | 'moderate' | 'heavy';
    sleepTalkingDetected: boolean;
    sleepTalkingFrequency: number;
    awakeningsCount: number;
    audioFiles: Array<{
        url: string;
        duration: number;
        segment: number;
        size: number;
    }>;
    analysisMetadata?: {
        sleepEfficiency: number;
        deepSleepPercentage?: number;
        lightSleepPercentage?: number;
        remSleepPercentage?: number;
        averageHeartRate?: number;
        movementEvents?: number;
        temperatureVariation?: number;
        noiseLevel?: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface SleepStats {
    averageDuration: number;
    averageQuality: number;
    averageEfficiency: number;
    snoringNights: number;
    sleepTalkingNights: number;
    totalRecords: number;
}

export interface CreateSleepRecordDto {
    sleepDate: string;
    recordingStartTime?: string;
    recordingEndTime?: string;
    sleepDurationHours?: number;
    sleepQualityScore?: number;
    snoringDetected?: boolean;
    snoringIntensity?: 'none' | 'light' | 'moderate' | 'heavy';
    sleepTalkingDetected?: boolean;
    sleepTalkingFrequency?: number;
    awakeningsCount?: number;
    audioFiles?: Array<{
        url: string;
        duration: number;
        segment: number;
        size: number;
    }>;
    analysisMetadata?: {
        deepSleepPercentage?: number;
        lightSleepPercentage?: number;
        remSleepPercentage?: number;
        noiseLevel?: number;
        roomTemperature?: number;
        environmentalFactors?: string[];
        sleepEfficiency?: number;
        timeToFallAsleep?: number;
        longestAwakePeriod?: number;
        averageHeartRate?: number;
        oxygenSaturation?: number;
    };
}

class SleepApiService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `${API_BASE_URL}/sleep-tracking`;
    }

    private async getAuthHeaders() {
        const token = await AsyncStorage.getItem('@access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }
        // The backend's global TransformInterceptor wraps every response as
        // { success, data, timestamp } — unwrap it here so callers get the
        // actual SleepRecord/SleepStats instead of the envelope. Every field
        // on the record used to read as undefined (NaN durations, "Invalid
        // Date", blank numbers) because this was returning the raw envelope.
        const json = await response.json();
        return unwrapApiEnvelope<T>(json);
    }

    /**
     * Create a new sleep record
     */
    async createSleepRecord(data: CreateSleepRecordDto): Promise<SleepRecord> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse(response);
    }

    /**
     * Get all sleep records for the user
     */
    async getSleepRecords(options?: {
        limit?: number;
        offset?: number;
    }): Promise<SleepRecord[]> {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());

        const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * Get the latest sleep record
     */
    async getLatestSleepRecord(): Promise<SleepRecord | null> {
        const response = await fetch(`${this.baseUrl}/latest`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        if (response.status === 404) {
            return null;
        }

        return this.handleResponse(response);
    }

    /**
     * Get sleep statistics
     */
    async getSleepStats(days: number = 30): Promise<SleepStats> {
        const response = await fetch(`${this.baseUrl}/stats?days=${days}`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * Get sleep records by date range
     */
    async getSleepRecordsByDateRange(
        startDate: string,
        endDate: string
    ): Promise<SleepRecord[]> {
        const params = new URLSearchParams({
            startDate,
            endDate,
        });

        const response = await fetch(`${this.baseUrl}/date-range?${params.toString()}`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * Get specific sleep record by ID
     */
    async getSleepRecord(id: string): Promise<SleepRecord> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse(response);
    }

    /**
     * Update sleep record
     */
    async updateSleepRecord(
        id: string,
        data: Partial<CreateSleepRecordDto>
    ): Promise<SleepRecord> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse(response);
    }

    /**
     * Delete sleep record
     */
    async deleteSleepRecord(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }
    }

    /**
     * Get sleep trends and insights
     */
    async getSleepTrends(days: number = 90): Promise<{
        qualityTrend: Array<{ date: string; quality: number }>;
        durationTrend: Array<{ date: string; duration: number }>;
        efficiencyTrend: Array<{ date: string; efficiency: number }>;
        snoringTrend: Array<{ date: string; intensity: string }>;
        weeklyAverages: {
            avgDuration: number;
            avgQuality: number;
            avgEfficiency: number;
            snoringNights: number;
        };
        insights: Array<{
            type: 'positive' | 'warning' | 'info';
            title: string;
            description: string;
        }>;
    }> {
        const records = await this.getSleepRecordsByDateRange(
            new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            new Date().toISOString()
        );

        // Process trends
        const qualityTrend = records.map(record => ({
            date: record.sleepDate,
            quality: record.sleepQualityScore || 0
        })).reverse();

        const durationTrend = records.map(record => ({
            date: record.sleepDate,
            duration: record.sleepDurationHours || 0
        })).reverse();

        const efficiencyTrend = records.map(record => ({
            date: record.sleepDate,
            efficiency: record.sleepEfficiency || 0
        })).reverse();

        const snoringTrend = records.map(record => ({
            date: record.sleepDate,
            intensity: record.snoringIntensity || 'none'
        })).reverse();

        // Calculate weekly averages
        const recentWeek = records.slice(0, 7);
        const weeklyAverages = {
            avgDuration: recentWeek.reduce((sum, r) => sum + (r.sleepDurationHours || 0), 0) / recentWeek.length,
            avgQuality: recentWeek.reduce((sum, r) => sum + (r.sleepQualityScore || 0), 0) / recentWeek.length,
            avgEfficiency: recentWeek.reduce((sum, r) => sum + (r.sleepEfficiency || 0), 0) / recentWeek.length,
            snoringNights: recentWeek.filter(r => r.snoringDetected).length,
        };

        // Generate insights
        const insights = [];

        // Quality insights
        if (weeklyAverages.avgQuality > 8) {
            insights.push({
                type: 'positive' as const,
                title: 'Excellent Sleep Quality',
                description: `Your average sleep quality this week is ${weeklyAverages.avgQuality.toFixed(1)}/10. Keep up the great sleep habits!`
            });
        } else if (weeklyAverages.avgQuality < 6) {
            insights.push({
                type: 'warning' as const,
                title: 'Sleep Quality Needs Attention',
                description: `Your sleep quality has been below 6/10. Consider improving your sleep environment or bedtime routine.`
            });
        }

        // Duration insights
        if (weeklyAverages.avgDuration < 6) {
            insights.push({
                type: 'warning' as const,
                title: 'Insufficient Sleep Duration',
                description: 'You\'re averaging less than 6 hours of sleep. Adults need 7-9 hours for optimal health.'
            });
        } else if (weeklyAverages.avgDuration >= 7 && weeklyAverages.avgDuration <= 9) {
            insights.push({
                type: 'positive' as const,
                title: 'Optimal Sleep Duration',
                description: `Great! You're getting ${weeklyAverages.avgDuration.toFixed(1)} hours of sleep on average, which is in the healthy range.`
            });
        }

        // Snoring insights
        if (weeklyAverages.snoringNights >= 5) {
            insights.push({
                type: 'warning' as const,
                title: 'Frequent Snoring Detected',
                description: 'Snoring detected on most nights. Consider consulting a healthcare provider about sleep apnea.'
            });
        }

        return {
            qualityTrend,
            durationTrend,
            efficiencyTrend,
            snoringTrend,
            weeklyAverages,
            insights
        };
    }
}

export const sleepApiService = new SleepApiService();