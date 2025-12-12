import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventType } from '../types';
import { ApiService } from './api';
import { EventService } from './event';

interface QueuedRequest {
    id: string;
    endpoint: string;
    method: string;
    data: any;
    timestamp: number;
    retryCount: number;
    priority: number;
    userId?: string;
}

interface OfflineQueueState {
    requests: QueuedRequest[];
    isProcessing: boolean;
    lastSyncTimestamp: number;
}

export class OfflineQueueService {
    private static instance: OfflineQueueService;
    private readonly STORAGE_KEY = 'offline_queue';
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAYS = [1000, 5000, 15000]; // Progressive delays
    private isProcessing = false;
    private processingInterval?: ReturnType<typeof setInterval>;

    private constructor() { }

    public static getInstance(): OfflineQueueService {
        if (!OfflineQueueService.instance) {
            OfflineQueueService.instance = new OfflineQueueService();
        }
        return OfflineQueueService.instance;
    }

    public async initialize(): Promise<void> {
        await this.loadQueueFromStorage();
        this.startPeriodicProcessing();
    }

    public async enqueue(
        endpoint: string,
        method: string,
        data: any,
        priority: number = 5,
        userId?: string
    ): Promise<string> {
        const request: QueuedRequest = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            endpoint,
            method,
            data,
            timestamp: Date.now(),
            retryCount: 0,
            priority,
            userId
        };

        const queue = await this.getQueue();
        queue.requests.push(request);
        await this.saveQueueToStorage(queue);

        // Attempt immediate processing if online
        this.processQueue();

        return request.id;
    }

    public async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const queue = await this.getQueue();
            const sortedRequests = queue.requests.sort((a, b) => {
                // Sort by priority (higher first), then by timestamp (older first)
                if (a.priority !== b.priority) return b.priority - a.priority;
                return a.timestamp - b.timestamp;
            });

            const apiService = ApiService.getInstance();
            const eventService = EventService.getInstance();
            const processedIds: string[] = [];
            const failedRequests: QueuedRequest[] = [];

            for (const request of sortedRequests) {
                try {
                    const response = await this.executeRequest(apiService, request);

                    if (response.success) {
                        processedIds.push(request.id);

                        // Log successful sync event
                        if (request.userId) {
                            await eventService.dispatchEvent(
                                EventType.OFFLINE_SYNC_SUCCESS,
                                request.userId,
                                { requestId: request.id, endpoint: request.endpoint }
                            );
                        }
                    } else {
                        // Handle failure
                        request.retryCount++;
                        if (request.retryCount <= this.MAX_RETRIES) {
                            failedRequests.push(request);

                            // Schedule retry with exponential backoff
                            const delay = this.RETRY_DELAYS[Math.min(request.retryCount - 1, this.RETRY_DELAYS.length - 1)];
                            setTimeout(() => this.processQueue(), delay);
                        } else {
                            // Max retries exceeded - log failure event
                            if (request.userId) {
                                await eventService.dispatchEvent(
                                    EventType.OFFLINE_SYNC_FAILED,
                                    request.userId,
                                    { requestId: request.id, endpoint: request.endpoint, error: response.error }
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error processing queued request:', error);
                    request.retryCount++;
                    if (request.retryCount <= this.MAX_RETRIES) {
                        failedRequests.push(request);
                    }
                }
            }

            // Update queue - remove processed requests, keep failed ones for retry
            const updatedQueue: OfflineQueueState = {
                requests: failedRequests,
                isProcessing: false,
                lastSyncTimestamp: Date.now()
            };

            await this.saveQueueToStorage(updatedQueue);

        } finally {
            this.isProcessing = false;
        }
    }

    public async getQueueStatus(): Promise<{
        pendingCount: number;
        lastSync: Date | null;
        isProcessing: boolean;
    }> {
        const queue = await this.getQueue();
        return {
            pendingCount: queue.requests.length,
            lastSync: queue.lastSyncTimestamp ? new Date(queue.lastSyncTimestamp) : null,
            isProcessing: this.isProcessing
        };
    }

    public async clearQueue(): Promise<void> {
        const emptyQueue: OfflineQueueState = {
            requests: [],
            isProcessing: false,
            lastSyncTimestamp: Date.now()
        };
        await this.saveQueueToStorage(emptyQueue);
    }

    private async executeRequest(apiService: ApiService, request: QueuedRequest): Promise<any> {
        // Map queued requests to actual API calls
        switch (request.endpoint) {
            case '/voice-notes':
                return apiService.uploadVoiceNote(request.data.audioUri, request.data.userId);
            default:
                // For extensibility - could implement more endpoint mappings
                throw new Error(`Unsupported endpoint: ${request.endpoint}`);
        }
    }

    private async getQueue(): Promise<OfflineQueueState> {
        try {
            const queueData = await AsyncStorage.getItem(this.STORAGE_KEY);
            if (queueData) {
                return JSON.parse(queueData);
            }
        } catch (error) {
            console.error('Error loading queue from storage:', error);
        }

        return {
            requests: [],
            isProcessing: false,
            lastSyncTimestamp: 0
        };
    }

    private async loadQueueFromStorage(): Promise<void> {
        // Initial load is handled by getQueue()
    }

    private async saveQueueToStorage(queue: OfflineQueueState): Promise<void> {
        try {
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('Error saving queue to storage:', error);
        }
    }

    private startPeriodicProcessing(): void {
        // Process queue every 30 seconds when online
        this.processingInterval = setInterval(() => {
            this.processQueue();
        }, 30000);
    }

    public stopPeriodicProcessing(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
    }

    // Conflict resolution strategies
    public async resolveConflict(
        localData: any,
        serverData: any,
        strategy: 'local' | 'server' | 'merge' = 'server'
    ): Promise<any> {
        switch (strategy) {
            case 'local':
                return localData;
            case 'server':
                return serverData;
            case 'merge':
                return this.mergeConflictingData(localData, serverData);
            default:
                return serverData;
        }
    }

    private mergeConflictingData(localData: any, serverData: any): any {
        // Simple merge strategy - prefer newer data based on updatedAt
        if (localData.updatedAt && serverData.updatedAt) {
            return new Date(localData.updatedAt) > new Date(serverData.updatedAt) ? localData : serverData;
        }
        return { ...serverData, ...localData };
    }

    // Sleep recording specific methods
    public async enqueueSleepRecording(
        audioUri: string,
        sleepAnalysis: any,
        userId: string,
        bedtime: Date,
        wakeTime: Date
    ): Promise<string> {
        return this.enqueue(
            'sleep-tracking',
            'POST',
            {
                audioUri,
                bedtime: bedtime.toISOString(),
                wakeTime: wakeTime.toISOString(),
                totalSleep: Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60)), // minutes
                sleepEfficiency: sleepAnalysis.sleepEfficiency || 80,
                sleepQuality: sleepAnalysis.sleepQuality || 7,
                snoringIntensity: sleepAnalysis.snoringEvents?.length > 0 ? 'MODERATE' : 'NONE',
                sleepTalkingDetected: sleepAnalysis.sleepTalkingEvents?.length > 0,
                sleepTalkingFrequency: sleepAnalysis.sleepTalkingEvents?.length || 0,
                restfulnessScore: sleepAnalysis.restfulnessScore || 7,
                audioFileUrl: audioUri,
                insights: [
                    `Sleep session from ${bedtime.toLocaleString()} to ${wakeTime.toLocaleString()}`,
                    `Detected ${sleepAnalysis.snoringEvents?.length || 0} snoring events`,
                    `Sleep talking episodes: ${sleepAnalysis.sleepTalkingEvents?.length || 0}`
                ]
            },
            9, // High priority for sleep data
            userId
        );
    }

    public async enqueueVoiceNoteWithContext(
        audioUri: string,
        userId: string,
        context?: string,
        isJournalEntry: boolean = false
    ): Promise<string> {
        const endpoint = isJournalEntry ? 'journal' : 'voice-notes';

        return this.enqueue(
            endpoint,
            'POST',
            {
                audioUri,
                context,
                metadata: {
                    recordedAt: new Date().toISOString(),
                    isJournalEntry,
                    deviceInfo: 'mobile_app'
                }
            },
            isJournalEntry ? 7 : 5, // Journal entries get slightly higher priority
            userId
        );
    }

    public async enqueueDailyActivity(
        activityData: any,
        userId: string
    ): Promise<string> {
        return this.enqueue(
            'activities',
            'POST',
            activityData,
            6, // Medium-high priority for activity tracking
            userId
        );
    }

    // Batch upload for multiple sleep events
    public async enqueueBatchSleepEvents(
        sleepEvents: Array<{
            audioUri: string;
            analysis: any;
            bedtime: Date;
            wakeTime: Date;
        }>,
        userId: string
    ): Promise<string[]> {
        const queueIds = [];

        for (const event of sleepEvents) {
            const queueId = await this.enqueueSleepRecording(
                event.audioUri,
                event.analysis,
                userId,
                event.bedtime,
                event.wakeTime
            );
            queueIds.push(queueId);
        }

        return queueIds;
    }
}