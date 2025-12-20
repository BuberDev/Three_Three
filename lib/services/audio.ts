import {
    AudioModule,
    createAudioPlayer,
    getRecordingPermissionsAsync,
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

import { RecordingState } from '../types';
import { SleepRecordingAnalysis } from '../types/sleep';
import { ApiService } from './api';

/**
 * Enterprise Audio Service
 * Manages audio recording and playbook with expo-audio
 */
export class AudioService {
    private static instance: AudioService;
    private player: InstanceType<typeof AudioModule.AudioPlayer> | null = null;
    private recorder: InstanceType<typeof AudioModule.AudioRecorder> | null = null;
    private isInitialized = false;
    private listeners: Array<(state: RecordingState) => void> = [];
    private recordingState: RecordingState = {
        isRecording: false,
        duration: 0,
        uri: null,
    };
    private recordingStartTime: number | null = null;
    private cacheDir: string;

    constructor() {
        this.cacheDir = `${FileSystem.cacheDirectory}audio/`;
        this.initialize();
    }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    /**
     * Initialize the audio service with proper permissions and mode
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Request recording permissions
            const { status } = await requestRecordingPermissionsAsync();

            if (status !== 'granted') {
                throw new Error('Audio recording permission not granted');
            }

            // Configure audio mode for both recording and playbook
            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            this.isInitialized = true;
            console.log('Audio service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio service:', error);
            throw error;
        }
    }

    /**
     * Check if recording permissions are granted
     */
    public async hasRecordingPermissions(): Promise<boolean> {
        try {
            const { status } = await getRecordingPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Error checking recording permissions:', error);
            return false;
        }
    }

    /**
     * Start voice recording with high quality settings
     */
    public async startVoiceRecording(): Promise<void> {
        return this.startRecording();
    }

    /**
     * Start recording with high quality settings
     */
    public async startRecording(): Promise<void> {
        try {
            await this.initialize();

            if (!await this.hasRecordingPermissions()) {
                throw new Error('Recording permissions not granted');
            }

            // Create new recorder instance with high quality settings
            this.recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);

            // Prepare and start recording
            await this.recorder.prepareToRecordAsync();
            this.recorder.record();

            // Track recording start time
            this.recordingStartTime = Date.now();

            // Update state and notify listeners
            this.recordingState = {
                isRecording: true,
                duration: 0,
                uri: null,
            };
            this.notifyListeners();

            console.log('Voice recording started');
        } catch (error) {
            console.error('Failed to start voice recording:', error);
            throw error;
        }
    }

    /**
     * Stop voice recording and return the file URI
     */
    public async stopVoiceRecording(): Promise<string> {
        return this.stopRecording();
    }

    /**
     * Stop recording and return the file URI
     */
    public async stopRecording(): Promise<string> {
        if (!this.recorder) {
            throw new Error('No active recording');
        }

        try {
            await this.recorder.stop();
            const uri = this.recorder.uri;

            // Calculate duration manually since expo-audio currentTime is unreliable
            const duration = this.recordingStartTime
                ? Date.now() - this.recordingStartTime
                : 0;

            if (!uri) {
                throw new Error('Recording failed - no URI available');
            }

            // Update state and notify listeners
            this.recordingState = {
                isRecording: false,
                duration: duration,
                uri: uri,
            };
            this.notifyListeners();

            console.log('Voice recording stopped, URI:', uri, 'Duration:', duration, 'ms');
            return uri;
        } catch (error) {
            console.error('Failed to stop voice recording:', error);
            throw error;
        } finally {
            this.recorder = null;
            this.recordingStartTime = null;
        }
    }

    /**
     * Play audio from URI
     */
    public async playAudio(uri: string): Promise<void> {
        return this.playRecording(uri);
    }

    /**
     * Play recording from URI - handles both local files and authenticated remote URLs
     */
    public async playRecording(uri: string): Promise<void> {
        try {
            await this.initialize();

            let playableUri = uri;

            // If this is a backend URL requiring authentication, download it first
            if (uri.includes('/api/voice-notes/audio/')) {
                playableUri = await this.downloadAuthenticatedAudio(uri);
            }

            // Create player with the audio source (local file or already accessible URI)
            this.player = createAudioPlayer({ uri: playableUri });

            // Start playback
            this.player.play();

            console.log('Audio playback started for URI:', playableUri);
        } catch (error) {
            console.error('Failed to play audio:', error);
            throw error;
        }
    }

    /**
     * Download authenticated audio file and cache locally
     */
    private async downloadAuthenticatedAudio(remoteUri: string): Promise<string> {
        try {
            // Extract filename from URL for caching
            const filename = remoteUri.split('/').pop() || `audio_${Date.now()}.m4a`;
            const localPath = `${this.cacheDir}${filename}`;

            // Create cache directory if it doesn't exist
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
            }

            // Check if file already exists in cache
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
                console.log('Using cached audio file:', localPath);
                return localPath;
            }

            // Download the authenticated file
            const apiService = ApiService.getInstance();
            const authToken = apiService.getAuthToken();

            if (!authToken) {
                throw new Error('Authentication token not available for audio download');
            }

            console.log('Downloading authenticated audio file:', remoteUri);

            const downloadResult = await FileSystem.downloadAsync(
                remoteUri,
                localPath,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );

            if (downloadResult.status !== 200) {
                throw new Error(`Failed to download audio file: ${downloadResult.status}`);
            }

            console.log('Audio file downloaded successfully:', localPath);
            return localPath;
        } catch (error) {
            console.error('Failed to download authenticated audio:', error);
            throw error;
        }
    }

    /**
     * Stop audio playbook
     */
    public stopAudio(): void {
        return this.stopPlayback();
    }

    /**
     * Stop audio playback
     */
    public stopPlayback(): void {
        if (this.player) {
            this.player.pause();
            this.player.remove();
            this.player = null;
            console.log('Audio playbook stopped');
        }
    }

    /**
     * Check if currently recording
     */
    public isRecording(): boolean {
        return this.recordingState.isRecording;
    }

    /**
     * Check if currently playing
     */
    public isPlaying(): boolean {
        return this.player?.playing || false;
    }

    /**
     * Get current recording duration in milliseconds
     */
    public getRecordingDuration(): number {
        if (this.recorder && this.recordingState.isRecording && this.recordingStartTime) {
            return Date.now() - this.recordingStartTime; // Live duration during recording
        }
        return this.recordingState.duration; // Stored duration after recording
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        if (this.player) {
            this.player.remove();
            this.player = null;
        }
        if (this.recorder) {
            this.recorder = null;
        }
        console.log('Audio service cleaned up');
    }

    /**
     * Delete recording file
     */
    public async deleteRecording(uri: string): Promise<void> {
        try {
            // For now, just log - would require file system operations
            console.log('Recording deletion requested for:', uri);
            // TODO: Implement actual file deletion using expo-file-system
        } catch (error) {
            console.error('Failed to delete recording:', error);
            throw error;
        }
    }

    /**
     * Add listener for recording state changes
     */
    public addListener(callback: (state: any) => void): void {
        this.listeners.push(callback);
        console.log('Listener added');
    }

    /**
     * Remove listener for recording state changes
     */
    public removeListener(callback: (state: any) => void): void {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
        console.log('Listener removed');
    }

    /**
     * Notify all listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(callback => {
            try {
                callback(this.recordingState);
            } catch (error) {
                console.error('Error calling listener:', error);
            }
        });
    }

    // Sleep recording specific methods

    /**
     * Start nocturnal recording for sleep analysis
     */
    public async startNocturnalRecording(options?: { sensitivity?: string }): Promise<void> {
        try {
            await this.initialize();

            if (!await this.hasRecordingPermissions()) {
                throw new Error('Recording permissions not granted');
            }

            // Create recorder with optimized settings for long recordings
            const sleepRecordingOptions = {
                ...RecordingPresets.LOW_QUALITY, // Use lower quality for long recordings
            };

            this.recorder = new AudioModule.AudioRecorder(sleepRecordingOptions);
            await this.recorder.prepareToRecordAsync();

            // Start recording timestamp for duration tracking
            this.recordingStartTime = Date.now();

            // Update recording state
            this.recordingState = {
                isRecording: true,
                duration: 0,
                uri: null,
            };
            this.notifyListeners();

            // Start recording (will continue until stopped)
            this.recorder.record();

            console.log('Nocturnal recording started for sleep analysis', options);
        } catch (error) {
            console.error('Failed to start nocturnal recording:', error);
            throw error;
        }
    }

    /**
     * Stop nocturnal recording and return analysis data
     */
    public async stopNocturnalRecording(): Promise<SleepRecordingAnalysis> {
        if (!this.recorder) {
            throw new Error('No active nocturnal recording');
        }

        try {
            await this.recorder.stop();
            const uri = this.recorder.uri;
            const duration = this.getRecordingDuration();

            if (!uri) {
                throw new Error('Nocturnal recording failed - no URI available');
            }

            // Update recording state
            this.recordingState = {
                isRecording: false,
                duration: duration,
                uri: uri,
            };
            this.notifyListeners();

            // Create analysis object
            const analysis: SleepRecordingAnalysis = {
                id: Date.now().toString(),
                uri,
                duration,
                timestamp: new Date(),
                audioLevels: [], // Would be populated by actual analysis
                disturbanceEvents: [], // Would be populated by actual analysis
                qualityScore: 0, // Would be calculated by actual analysis
                // Additional compatibility properties
                totalSleepDuration: duration,
                snoringEvents: [],
                sleepTalkingEvents: [],
                sleepQuality: 0,
            };

            console.log('Nocturnal recording completed with analysis');
            return analysis;
        } catch (error) {
            console.error('Failed to stop nocturnal recording:', error);
            throw error;
        } finally {
            this.recorder = null;
            this.recordingStartTime = null;
        }
    }

    /**
     * Get current sleep analysis data
     */
    public getCurrentSleepAnalysis(): SleepRecordingAnalysis | null {
        if (!this.recorder) return null;

        const duration = this.getRecordingDuration();

        return {
            id: 'current',
            uri: this.recorder.uri || '',
            duration,
            timestamp: new Date(),
            audioLevels: [],
            disturbanceEvents: [],
            qualityScore: 0,
            // Additional compatibility properties
            totalSleepDuration: duration,
            snoringEvents: [],
            sleepTalkingEvents: [],
            sleepQuality: 0,
        };
    }

    /**
     * Clear cached audio files
     */
    public async clearAudioCache(): Promise<void> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
            if (dirInfo.exists) {
                await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
                console.log('Audio cache cleared successfully');
            }
        } catch (error) {
            console.error('Failed to clear audio cache:', error);
        }
    }
}