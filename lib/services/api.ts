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

    private async checkBackendAvailability(): Promise<boolean> {
        const now = Date.now();
        if (this.backendAvailable !== null && now - this.lastBackendCheck < this.BACKEND_CHECK_INTERVAL) {
            return this.backendAvailable;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const wasAvailable = this.backendAvailable;
            this.backendAvailable = response.ok;

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

    public async uploadVoiceNote(audioUri: string, userId: string): Promise<ApiResponse<VoiceNoteResponse>> {
        try {
            const formData = new FormData();

            // Create file object from URI
            const audioBlob = await fetch(audioUri).then(r => r.blob());
            formData.append('audio', audioBlob as any, 'recording.m4a');
            formData.append('userId', userId);

            const response = await fetch(`${this.baseURL}/voice/notes`, {
                method: 'POST',
                headers: {
                    Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.message || `Upload failed: ${response.statusText}`,
                };
            }

            const data = await response.json();
            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('Voice note upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload error',
            };
        }
    }

    public async getVoiceNotes(userId: string, limit?: number): Promise<ApiResponse<VoiceNote[]>> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());

        return this.makeRequest(`/voice/notes?${params.toString()}`);
    }

    public async deleteVoiceNote(noteId: string): Promise<ApiResponse<void>> {
        return this.makeRequest(`/voice/notes/${noteId}`, {
            method: 'DELETE',
        });
    }

    // Daily entries methods
    public async getDailyEntry(date: string): Promise<ApiResponse<DailyEntry>> {
        return this.makeRequest(`/daily/${date}`);
    }

    public async getLatestDailySummary(): Promise<ApiResponse<DailyEntry>> {
        return this.makeRequest('/daily/summary/latest');
    }

    // User settings methods
    public async getUserSettings(): Promise<ApiResponse<UserSettings>> {
        return this.makeRequest('/user/settings');
    }

    public async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
        return this.makeRequest('/user/settings', {
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
    public async uploadVoiceNoteWithContext(audioUri: string, userId: string, context?: string): Promise<ApiResponse<VoiceNoteResponse & { extractedActivities?: any[] }>> {
        const formData = new FormData();
        formData.append('audio', {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'voice_note.m4a',
        } as any);
        formData.append('userId', userId);
        if (context) {
            formData.append('context', context);
        }

        return this.makeRequest('/voice-notes/upload-with-context', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
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
        return this.makeRequest(`/metrics/daily?userId=${userId}&date=${date}`);
    }

    public async getWeeklyInsights(userId: string): Promise<ApiResponse<any>> {
        return this.makeRequest(`/insights/weekly?userId=${userId}`);
    }

    public async getProgressMetrics(userId: string): Promise<ApiResponse<any>> {
        return this.makeRequest(`/metrics/progress?userId=${userId}`);
    }

    public async generatePersonalizedRecommendations(userId: string): Promise<ApiResponse<any[]>> {
        return this.makeRequest(`/recommendations/generate?userId=${userId}`, {
            method: 'POST',
        });
    }

    public async generateDailySummary(userId: string, date: string): Promise<ApiResponse<DailyEntry>> {
        return this.makeRequest('/daily-entries/generate', {
            method: 'POST',
            body: JSON.stringify({ userId, date }),
        });
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
}

// Export singleton instance
export const apiService = ApiService.getInstance();