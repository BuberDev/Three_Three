import {
    ApiResponse,
    DailyEntry,
    Task,
    User,
    UserSettings,
    VoiceNote,
    VoiceNoteResponse
} from '../types';
import { AppError, AuthError, ErrorHandler, NetworkError, ServerError, ValidationError } from '../utils/errors';

export class ApiService {
    private static instance: ApiService;
    private readonly baseURL: string = __DEV__ ? 'http://localhost:3000/api' : 'https://your-api.com/api';
    private authToken: string | null = null;
    private backendAvailable: boolean | null = null;
    private lastBackendCheck: number = 0;
    private readonly BACKEND_CHECK_INTERVAL = 30000; // 30 seconds
    private hasLoggedBackendUnavailable = false;

    private constructor() { }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    public setAuthToken(token: string): void {
        this.authToken = token;
    }

    public getAuthToken(): string | null {
        return this.authToken;
    }

    private async checkBackendAvailability(): Promise<boolean> {
        const now = Date.now();
        if (this.backendAvailable !== null && now - this.lastBackendCheck < this.BACKEND_CHECK_INTERVAL) {
            return this.backendAvailable;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            // Use simple GET to base API path since /health doesn't exist
            const response = await fetch(`${this.baseURL.replace('/api', '')}`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const wasAvailable = this.backendAvailable;
            this.backendAvailable = response.status !== 0; // Any response means server is up

            // Log when backend becomes available again
            if (this.backendAvailable && wasAvailable === false) {
                console.log('✅ Backend API is now available');
                this.hasLoggedBackendUnavailable = false;
            }
        } catch {
            const wasAvailable = this.backendAvailable;
            this.backendAvailable = false;

            // Only log once when backend becomes unavailable
            if (__DEV__ && !this.hasLoggedBackendUnavailable && wasAvailable !== false) {
                console.warn('⚠️ Backend API is not available (this is normal during development if server is not running)');
                this.hasLoggedBackendUnavailable = true;
            }
        }

        this.lastBackendCheck = now;
        return this.backendAvailable;
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const errorHandler = ErrorHandler.getInstance();

        try {
            const url = `${this.baseURL}${endpoint}`;
            const headers = new Headers({
                'Content-Type': 'application/json',
            });

            // Add additional headers
            if (options.headers) {
                const additionalHeaders = options.headers as Record<string, string>;
                for (const [key, value] of Object.entries(additionalHeaders)) {
                    headers.set(key, value);
                }
            }

            if (this.authToken) {
                headers.set('Authorization', `Bearer ${this.authToken}`);
            }

            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                let error: AppError;
                switch (response.status) {
                    case 401:
                        error = new AuthError(errorData.message || 'Unauthorized');
                        break;
                    case 400:
                        error = new ValidationError(errorData.message || 'Bad request', errorData.field);
                        break;
                    default:
                        error = new ServerError(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                errorHandler.handleError(error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            const data = await response.json();
            return {
                success: true,
                data,
            };
        } catch (error) {
            let appError: AppError;
            if (error instanceof AppError) {
                appError = error;
            } else {
                const message = error instanceof Error ? error.message : 'Network error';
                appError = new NetworkError(message);
            }

            // Only log network errors if backend should be available
            if (!__DEV__ || await this.checkBackendAvailability()) {
                errorHandler.handleError(appError);
            }

            return {
                success: false,
                error: appError.message,
            };
        }
    }

    // Auth methods
    public async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    public async register(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    public async uploadVoiceNote(audioUri: string, title?: string, tags?: string[]): Promise<ApiResponse<VoiceNoteResponse>> {
        try {
            if (!await this.checkBackendAvailability()) {
                throw new NetworkError('Backend server is not available');
            }

            const formData = new FormData();

            // React Native file upload structure
            formData.append('audio', {
                uri: audioUri,
                type: 'audio/m4a',
                name: 'voice_recording.m4a',
            } as any);

            if (title) formData.append('title', title);
            if (tags && tags.length > 0) {
                formData.append('tags', JSON.stringify(tags));
            }

            // Add AbortController with 30-second timeout for voice processing
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.warn('⚠️ Voice note upload timed out after 60 seconds');
                controller.abort();
            }, 30000); // 30 seconds timeout

            try {
                const response = await fetch(`${this.baseURL}/voice-notes`, {
                    method: 'POST',
                    headers: {
                        Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
                        // Don't set Content-Type - let fetch set it with boundary
                    },
                    body: formData,
                    signal: controller.signal, // Add timeout signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    return {
                        success: false,
                        error: errorData.message || `Upload failed: ${response.statusText}`,
                    };
                }

                const data = await response.json();
                console.log('✅ Voice note API response received successfully');
                return {
                    success: true,
                    data,
                };
            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                    console.error('🕐 Voice note upload timed out');
                    return {
                        success: false,
                        error: 'Upload timed out. The recording is being processed in the background.',
                    };
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('❌ Voice note upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload error',
            };
        }
    }

    public async getVoiceNotes(userId: string, limit?: number): Promise<ApiResponse<VoiceNote[]>> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());

        return this.makeRequest(`/voice-notes?${params.toString()}`);
    }

    public async deleteVoiceNote(noteId: string): Promise<ApiResponse<void>> {
        return this.makeRequest(`/voice-notes/${noteId}`, {
            method: 'DELETE',
        });
    }

    // Daily entries methods
    public async getDailyEntry(date: string): Promise<ApiResponse<DailyEntry>> {
        return this.makeRequest(`/daily/${date}`);
    }

    public async getLatestDailySummary(): Promise<ApiResponse<DailyEntry>> {
        // TODO: Implement when backend has this endpoint
        throw new Error('Daily summary endpoint not implemented yet');
    }

    // User settings methods
    public async getUserSettings(): Promise<ApiResponse<UserSettings>> {
        return this.makeRequest('/users/me/settings');
    }

    public async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
        return this.makeRequest('/users/me/settings', {
            method: 'PATCH',
            body: JSON.stringify(settings),
        });
    }

    // Tasks methods
    public async getTasks(completed?: boolean): Promise<ApiResponse<Task[]>> {
        const params = new URLSearchParams();
        if (completed !== undefined) params.append('completed', completed.toString());

        return this.makeRequest(`/tasks?${params.toString()}`);
    }

    public async updateTask(taskId: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
        return this.makeRequest(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    public async deleteTask(taskId: string): Promise<ApiResponse<void>> {
        return this.makeRequest(`/tasks/${taskId}`, {
            method: 'DELETE',
        });
    }

    // Activity tracking methods
    public async uploadVoiceNoteWithContext(audioUri: string, context?: string, title?: string): Promise<ApiResponse<VoiceNoteResponse & { extractedActivities?: any[] }>> {
        try {
            if (!await this.checkBackendAvailability()) {
                throw new NetworkError('Backend server is not available');
            }

            const formData = new FormData();
            formData.append('audio', {
                uri: audioUri,
                type: 'audio/m4a',
                name: 'voice_recording_with_context.m4a',
            } as any);

            if (context) {
                formData.append('metadata', JSON.stringify({ context }));
            }
            if (title) {
                formData.append('title', title);
            }

            return this.makeRequest('/voice-notes', {
                method: 'POST',
                body: formData,
                // Don't set Content-Type - let fetch handle multipart boundary
            });
        } catch (error) {
            console.error('🚨 Voice note upload with context failed:', error);
            return {
                success: false,
                error: ErrorHandler.handleError(error).message,
            };
        }
    }

    public async getActivities(userId: string): Promise<ApiResponse<any[]>> {
        return this.makeRequest(`/activities?userId=${userId}`);
    }

    public async createActivity(activity: any): Promise<ApiResponse<any>> {
        return this.makeRequest('/activities', {
            method: 'POST',
            body: JSON.stringify(activity),
        });
    }

    public async getDailyMetrics(userId: string, date: string): Promise<ApiResponse<any>> {
        // TODO: Map to existing analytics endpoint when needed
        throw new Error('Daily metrics endpoint not implemented yet');
    }

    public async getWeeklyInsights(userId: string): Promise<ApiResponse<any>> {
        // TODO: Map to existing analytics endpoint when needed  
        throw new Error('Weekly insights endpoint not implemented yet');
    }

    public async getProgressMetrics(userId: string): Promise<ApiResponse<any>> {
        // TODO: Map to existing analytics endpoint when needed
        throw new Error('Progress metrics endpoint not implemented yet');
    }

    public async generatePersonalizedRecommendations(userId: string): Promise<ApiResponse<any[]>> {
        // TODO: Implement when backend has this endpoint
        throw new Error('Personalized recommendations endpoint not implemented yet');
    }

    public async generateDailySummary(userId: string, date: string): Promise<ApiResponse<DailyEntry>> {
        // TODO: Map to existing analytics endpoint when needed
        throw new Error('Daily summary generation endpoint not implemented yet');
    }

    // Health check
    public async healthCheck(): Promise<boolean> {
        try {
            const response = await this.makeRequest('/health');
            return response.success;
        } catch {
            return false;
        }
    }

    // Offline queue management
    private offlineQueue: Array<{
        endpoint: string;
        options: RequestInit;
        timestamp: number;
    }> = [];

    public addToOfflineQueue(endpoint: string, options: RequestInit): void {
        this.offlineQueue.push({
            endpoint,
            options,
            timestamp: Date.now(),
        });
    }

    public async processOfflineQueue(): Promise<void> {
        if (this.offlineQueue.length === 0) return;

        const isOnline = await this.healthCheck();
        if (!isOnline) return;

        const queueCopy = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const item of queueCopy) {
            try {
                await this.makeRequest(item.endpoint, item.options);
                console.log('Processed offline queue item:', item.endpoint);
            } catch (error) {
                console.error('Failed to process offline queue item:', error);
                // Re-add to queue if it's not too old (e.g., less than 24 hours)
                if (Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
                    this.offlineQueue.push(item);
                }
            }
        }
    }

    public getOfflineQueueSize(): number {
        return this.offlineQueue.length;
    }

    // ========== ENTERPRISE VOICE RECORDING FEATURES ==========

    /**
     * Upload daily report voice note with enterprise-grade categorization
     */
    public async uploadDailyReportVoice(audioUri: string, reportType: 'morning' | 'evening' | 'summary'): Promise<ApiResponse<VoiceNoteResponse>> {
        const title = `Daily ${reportType} report - ${new Date().toLocaleDateString()}`;
        const metadata = {
            category: 'daily-report',
            reportType,
            timestamp: new Date().toISOString(),
            context: `User's daily ${reportType} voice report`
        };

        return this.uploadVoiceNoteWithContext(audioUri, JSON.stringify(metadata), title);
    }

    /**
     * Upload sleep experience voice note with enterprise categorization
     */
    public async uploadSleepReportVoice(audioUri: string, sleepType: 'dream' | 'insomnia' | 'morning-reflection' | 'sleep-quality'): Promise<ApiResponse<VoiceNoteResponse>> {
        const title = `Sleep ${sleepType} report - ${new Date().toLocaleDateString()}`;
        const metadata = {
            category: 'sleep-report',
            sleepType,
            timestamp: new Date().toISOString(),
            context: `User's sleep-related voice note about ${sleepType}`
        };

        return this.uploadVoiceNoteWithContext(audioUri, JSON.stringify(metadata), title);
    }

    /**
     * Upload general life experience voice note
     */
    public async uploadLifeExperienceVoice(audioUri: string, category: 'reflection' | 'gratitude' | 'emotion' | 'achievement' | 'challenge'): Promise<ApiResponse<VoiceNoteResponse>> {
        const title = `Life ${category} - ${new Date().toLocaleDateString()}`;
        const metadata = {
            category: 'life-experience',
            experienceType: category,
            timestamp: new Date().toISOString(),
            context: `User's personal voice note about ${category}`
        };

        return this.uploadVoiceNoteWithContext(audioUri, JSON.stringify(metadata), title);
    }
}

// Export singleton instance
export const apiService = ApiService.getInstance();