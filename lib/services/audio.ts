import AudioRecorderPlayer, {
    AudioEncoderAndroidType,
    AudioSet,
    AudioSourceAndroidType,
    AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';

import { RecordingState } from '../types';
import { SleepRecordingAnalysis } from '../types/sleep';
import { ApiService } from './api';

const HIGH_QUALITY_SET: AudioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVFormatIDKeyIOS: 'aac',
    AVNumberOfChannelsKeyIOS: 1,
};

const LOW_QUALITY_SET: AudioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.low,
    AVFormatIDKeyIOS: 'aac',
    AVNumberOfChannelsKeyIOS: 1,
};

/**
 * Enterprise Audio Service
 * Manages audio recording and playback with react-native-audio-recorder-player
 */
export class AudioService {
    private static instance: AudioService;
    private isInitialized = false;
    private isCurrentlyRecording = false;
    private isCurrentlyPlaying = false;
    private currentRecordingUri: string | null = null;
    private listeners: Array<(state: RecordingState) => void> = [];
    private recordingState: RecordingState = {
        isRecording: false,
        duration: 0,
        uri: null,
    };
    private recordingStartTime: number | null = null;
    private cacheDir: string;

    constructor() {
        this.cacheDir = `${RNFS.CachesDirectoryPath}/audio/`;
        this.initialize();
    }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    /**
     * Initialize the audio service with proper permissions
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const granted = await this.requestRecordingPermission();

            if (!granted) {
                throw new Error('Audio recording permission not granted');
            }

            this.isInitialized = true;
            console.log('Audio service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio service:', error);
            throw error;
        }
    }

    private async requestRecordingPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        // iOS prompts automatically the first time the recorder is started.
        return true;
    }

    /**
     * Check if recording permissions are granted
     */
    public async hasRecordingPermissions(): Promise<boolean> {
        try {
            if (Platform.OS === 'android') {
                return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            }
            return true;
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

            const uri = await AudioRecorderPlayer.startRecorder(undefined, HIGH_QUALITY_SET);
            this.isCurrentlyRecording = true;
            this.currentRecordingUri = uri;

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
        if (!this.isCurrentlyRecording) {
            throw new Error('No active recording');
        }

        try {
            const uri = await AudioRecorderPlayer.stopRecorder();

            // Calculate duration manually, consistent with the previous implementation
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
            this.isCurrentlyRecording = false;
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

            await AudioRecorderPlayer.startPlayer(playableUri);
            this.isCurrentlyPlaying = true;
            AudioRecorderPlayer.addPlaybackEndListener(() => {
                this.isCurrentlyPlaying = false;
                AudioRecorderPlayer.removePlaybackEndListener();
            });

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
            const dirExists = await RNFS.exists(this.cacheDir);
            if (!dirExists) {
                await RNFS.mkdir(this.cacheDir);
            }

            // Check if file already exists in cache
            const fileExists = await RNFS.exists(localPath);
            if (fileExists) {
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

            const { promise } = RNFS.downloadFile({
                fromUrl: remoteUri,
                toFile: localPath,
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const downloadResult = await promise;

            if (downloadResult.statusCode !== 200) {
                throw new Error(`Failed to download audio file: ${downloadResult.statusCode}`);
            }

            console.log('Audio file downloaded successfully:', localPath);
            return localPath;
        } catch (error) {
            console.error('Failed to download authenticated audio:', error);
            throw error;
        }
    }

    /**
     * Stop audio playback
     */
    public stopAudio(): void {
        return this.stopPlayback();
    }

    /**
     * Stop audio playback
     */
    public stopPlayback(): void {
        if (this.isCurrentlyPlaying) {
            AudioRecorderPlayer.stopPlayer();
            AudioRecorderPlayer.removePlaybackEndListener();
            this.isCurrentlyPlaying = false;
            console.log('Audio playback stopped');
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
        return this.isCurrentlyPlaying;
    }

    /**
     * Get current recording duration in milliseconds
     */
    public getRecordingDuration(): number {
        if (this.isCurrentlyRecording && this.recordingState.isRecording && this.recordingStartTime) {
            return Date.now() - this.recordingStartTime; // Live duration during recording
        }
        return this.recordingState.duration; // Stored duration after recording
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        if (this.isCurrentlyPlaying) {
            AudioRecorderPlayer.stopPlayer();
            this.isCurrentlyPlaying = false;
        }
        if (this.isCurrentlyRecording) {
            AudioRecorderPlayer.stopRecorder();
            this.isCurrentlyRecording = false;
        }
        console.log('Audio service cleaned up');
    }

    /**
     * Delete recording file
     */
    public async deleteRecording(uri: string): Promise<void> {
        try {
            const path = uri.replace('file://', '');
            const fileExists = await RNFS.exists(path);
            if (fileExists) {
                await RNFS.unlink(path);
            }
            console.log('Recording deleted:', uri);
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

            const uri = await AudioRecorderPlayer.startRecorder(undefined, LOW_QUALITY_SET);
            this.isCurrentlyRecording = true;
            this.currentRecordingUri = uri;

            // Start recording timestamp for duration tracking
            this.recordingStartTime = Date.now();

            // Update recording state
            this.recordingState = {
                isRecording: true,
                duration: 0,
                uri: null,
            };
            this.notifyListeners();

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
        if (!this.isCurrentlyRecording) {
            throw new Error('No active nocturnal recording');
        }

        try {
            const uri = await AudioRecorderPlayer.stopRecorder();
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
            this.isCurrentlyRecording = false;
            this.recordingStartTime = null;
        }
    }

    /**
     * Get current sleep analysis data
     */
    public getCurrentSleepAnalysis(): SleepRecordingAnalysis | null {
        if (!this.isCurrentlyRecording) return null;

        const duration = this.getRecordingDuration();

        return {
            id: 'current',
            uri: this.currentRecordingUri || '',
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
            const dirExists = await RNFS.exists(this.cacheDir);
            if (dirExists) {
                await RNFS.unlink(this.cacheDir);
                console.log('Audio cache cleared successfully');
            }
        } catch (error) {
            console.error('Failed to clear audio cache:', error);
        }
    }
}
