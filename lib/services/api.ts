import RNFS from 'react-native-fs';
import {
    ApiResponse,
    DailyEntry,
    Task,
    User,
    UserSettings,
    VoiceNote,
    VoiceNoteResponse
} from '../types';
import { getApiUrl } from '../utils/config';
import { AppError, AuthError, ErrorHandler, NetworkError, ServerError, ValidationError } from '../utils/errors';

export function unwrapApiEnvelope<T>(payload: unknown): T {
    let current = payload;
    let depth = 0;

    while (
        current &&
        typeof current === 'object' &&
        !Array.isArray(current) &&
        'success' in current &&
        'data' in current &&
        typeof (current as { success?: unknown }).success === 'boolean' &&
        depth < 5
    ) {
        current = (current as { data: unknown }).data;
        depth += 1;
    }

    return current as T;
}

export class ApiService {
    private static instance: ApiService;
    private authToken: string | null = null;
    private backendAvailable: boolean | null = null;
    private lastBackendCheck: number = 0;
    private readonly BACKEND_CHECK_INTERVAL = 30000; // 30 seconds
    private hasLoggedBackendUnavailable = false;

    private constructor() { }

    private get baseURL(): string {
        return `${getApiUrl()}/api`;
    }

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

    public async makeRequest<T>(
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

                // Extract the actual error message - server returns { error: { message: "..." } }
                const actualMessage = errorData.error?.message || errorData.message;

                let error: AppError;
                switch (response.status) {
                    case 401:
                        error = new AuthError(actualMessage || 'Unauthorized');
                        break;
                    case 400:
                        error = new ValidationError(actualMessage || 'Bad request', errorData.error?.field || errorData.field);
                        break;
                    default:
                        error = new ServerError(actualMessage || `HTTP ${response.status}: ${response.statusText}`);
                }

                errorHandler.handleError(error);
                return {
                    success: false,
                    error: error.message,
                };
            }

            if (response.status === 204) {
                return {
                    success: true,
                    data: undefined as T,
                };
            }

            const data = unwrapApiEnvelope<T>(await response.json());
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

    public async uploadVoiceNote(audioUri: string, duration?: number, title?: string, tags?: string[]): Promise<ApiResponse<VoiceNoteResponse>> {
        try {
            if (!await this.checkBackendAvailability()) {
                throw new NetworkError('Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.');
            }

            console.log('📄 Audio URI to upload:', audioUri);

            // Check if file exists and get its info
            const audioPath = audioUri.replace('file://', '');
            const fileExists = await RNFS.exists(audioPath);
            const fileStat = fileExists ? await RNFS.stat(audioPath) : null;
            const fileInfo = {
                exists: fileExists,
                size: fileStat?.size,
                isDirectory: fileStat ? fileStat.isDirectory() : false,
                modificationTime: fileStat?.mtime ? new Date(fileStat.mtime).getTime() : undefined,
            };
            console.log('📋 File info:', {
                exists: fileInfo.exists,
                size: fileInfo.exists ? (fileInfo as any).size : undefined,
                isDirectory: fileInfo.isDirectory,
                modificationTime: fileInfo.exists ? (fileInfo as any).modificationTime : undefined
            });

            if (!fileInfo.exists) {
                throw new Error('Audio file does not exist at provided URI');
            }

            if (fileInfo.exists && (fileInfo as any).size === 0) {
                throw new Error('Audio file is empty (0 bytes)');
            }

            const formData = new FormData();

            // Get file extension to determine proper MIME type
            const fileExtension = audioUri.split('.').pop()?.toLowerCase();
            let mimeType = 'audio/m4a'; // Default for expo-audio recordings

            switch (fileExtension) {
                case 'm4a':
                    mimeType = 'audio/m4a';
                    break;
                case 'aac':
                    mimeType = 'audio/aac';
                    break;
                case 'mp3':
                    mimeType = 'audio/mpeg';
                    break;
                case 'wav':
                    mimeType = 'audio/wav';
                    break;
                case 'mp4':
                    mimeType = 'audio/mp4';
                    break;
                default:
                    mimeType = 'audio/m4a';
            }

            console.log('🎵 File details:', {
                extension: fileExtension,
                detectedMimeType: mimeType,
                fileName: `voice_recording.${fileExtension || 'm4a'}`
            });

            // React Native file upload - using the URI directly but with proper validation
            formData.append('audio', {
                uri: audioUri,
                type: mimeType,
                name: `voice_recording.${fileExtension || 'm4a'}`,
            } as any);

            console.log('📦 FormData structure check:', {
                audioUri,
                hasUri: !!audioUri,
                uriLength: audioUri?.length || 0,
                fileSize: fileInfo.exists && (fileInfo as any).size ? (fileInfo as any).size : 0
            });

            if (duration !== undefined) formData.append('duration', duration.toString());
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
                console.log('🚀 Making POST request to:', `${this.baseURL}/voice-notes`);
                console.log('🔑 Auth token available:', !!this.authToken);
                console.log('📦 FormData prepared with audio file');

                const response = await fetch(`${this.baseURL}/voice-notes`, {
                    method: 'POST',
                    headers: {
                        Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
                        // Don't set Content-Type - let fetch set it with boundary
                    },
                    body: formData,
                    signal: controller.signal, // Add timeout signal
                });

                console.log('📡 Response status:', response.status, response.statusText);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.error('❌ Upload request failed:', response.status, response.statusText);
                    const errorData = await response.json().catch((e) => {
                        console.error('❌ Failed to parse error response:', e);
                        return {};
                    });
                    console.error('❌ Error details:', errorData);
                    return {
                        success: false,
                        error: errorData.message || `Upload failed: ${response.statusText}`,
                    };
                }

                const data = unwrapApiEnvelope<VoiceNoteResponse>(await response.json());
                console.log('✅ Voice note API response received successfully');
                return {
                    success: true,
                    data,
                };
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error('❌ Fetch error during upload:', fetchError);

                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                    console.error('🕐 Voice note upload timed out');
                    return {
                        success: false,
                        error: 'Upload timed out. The recording is being processed in the background.',
                    };
                }

                // Network or other fetch errors
                console.error('❌ Network/fetch error:', fetchError);
                return {
                    success: false,
                    error: fetchError instanceof Error ? fetchError.message : 'Network error during upload',
                };
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

    public async getAudioFile(filename: string): Promise<string | null> {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const response = await fetch(`${this.baseURL}/voice-notes/audio/${filename}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'audio/*',
                },
            });

            if (!response.ok) {
                console.error('❌ Audio file request failed:', response.status);
                return null;
            }

            // Download audio as blob and create local URI
            const blob = await response.blob();

            // In React Native, we can create a temporary file
            const tempUri = `${RNFS.DocumentDirectoryPath}/temp_audio_${Date.now()}.m4a`;

            // Convert blob to base64 and write to file
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onloadend = async () => {
                    try {
                        const base64 = reader.result as string;
                        const base64Data = base64.split(',')[1]; // Remove data:audio/... prefix

                        await RNFS.writeFile(tempUri, base64Data, 'base64');

                        console.log('📱 Audio file cached locally:', tempUri);
                        resolve(tempUri);
                    } catch (error) {
                        console.error('❌ Failed to cache audio file:', error);
                        resolve(null);
                    }
                };
                reader.readAsDataURL(blob);
            });

        } catch (error) {
            console.error('❌ Failed to fetch audio file:', error);
            return null;
        }
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

    public async createTask(task: Omit<Task, 'id'>): Promise<ApiResponse<Task>> {
        return this.makeRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                priority: task.priority,
                dueDate: task.dueDate,
                category: task.category,
                source: 'manual'
            }),
        });
    }

    public async updateTask(taskId: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
        // Transform frontend Task structure to API DTO structure
        const updateData: any = { ...updates };

        // Convert completed boolean to status enum
        if ('completed' in updates) {
            updateData.status = updates.completed ? 'completed' : 'todo';
            delete updateData.completed;
        }

        // Remove fields that API doesn't accept
        delete updateData.id;
        delete updateData.extractedFromVoiceNoteId;

        return this.makeRequest(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData),
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
                throw new NetworkError('Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.');
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
                error: ErrorHandler.getInstance().handleError(error as Error).message,
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
        return this.makeRequest(`/analytics/daily/${date}`);
    }

    public async getWeeklyInsights(userId: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        return this.makeRequest(`/analytics/weekly?${params.toString()}`);
    }

    public async getProgressMetrics(userId: string): Promise<ApiResponse<any>> {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);

        return this.getWeeklyInsights(
            userId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
        );
    }

    public async generatePersonalizedRecommendations(userId: string): Promise<ApiResponse<any[]>> {
        return this.makeRequest('/analytics/insights/dashboard');
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
