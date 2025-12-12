import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AudioRecording, RecordingState } from '../types';

export class AudioService {
    private static instance: AudioService;
    private recorder: Audio.Recording | null = null;
    private player: Audio.Sound | null = null;
    private recordingState: RecordingState = {
        isRecording: false,
        duration: 0,
        uri: null,
        isPaused: false
    };
    private isInitialized: boolean = false;
    private durationInterval: ReturnType<typeof setInterval> | null = null;
    private listeners: ((state: RecordingState) => void)[] = [];
    private startTime: number = 0;

    private constructor() { }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    public async initialize(): Promise<void> {
        try {
            // Request audio permissions using Audio from expo-av
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Audio permissions not granted');
            }

            // Set audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            this.isInitialized = true;
            console.log('Audio service initialized successfully');
        } catch (error) {
            console.error('Audio service initialization failed:', error);
            throw error;
        }
    }

    public async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Permission request failed:', error);
            return false;
        }
    }

    public getRecordingState(): RecordingState {
        return { ...this.recordingState };
    }

    public async startRecording(): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (this.recordingState.isRecording) {
                throw new Error('Recording is already in progress');
            }

            // Create new recording with high quality settings
            this.recorder = new Audio.Recording();
            await this.recorder.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

            // Start recording
            await this.recorder.startAsync();

            this.startTime = Date.now();
            this.recordingState = {
                isRecording: true,
                duration: 0,
                uri: null,
                isPaused: false
            };

            this.startDurationTracking();
            this.notifyListeners();

            console.log('Recording started');
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    public async stopRecording(): Promise<string | null> {
        try {
            if (!this.recorder || !this.recordingState.isRecording) {
                throw new Error('No recording in progress');
            }

            // Stop the recorder and get the URI
            await this.recorder.stopAndUnloadAsync();
            const uri = this.recorder.getURI();

            this.recordingState = {
                isRecording: false,
                duration: this.recordingState.duration,
                uri: uri,
                isPaused: false
            };

            this.stopDurationTracking();
            this.notifyListeners();

            console.log('Recording stopped, file saved at:', uri);
            return uri;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            throw error;
        }
    }

    public async pauseRecording(): Promise<void> {
        console.warn('Pause recording not supported in expo-av API');
        throw new Error('Pause recording not supported');
    }

    public async resumeRecording(): Promise<void> {
        console.warn('Resume recording not supported in expo-av API');
        throw new Error('Resume recording not supported');
    }

    public async playRecording(uri: string): Promise<void> {
        try {
            if (this.player) {
                await this.player.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync({ uri });
            this.player = sound;
            await this.player.playAsync();

            console.log('Playing recording from:', uri);
        } catch (error) {
            console.error('Failed to play recording:', error);
            throw error;
        }
    }

    public async stopPlayback(): Promise<void> {
        try {
            if (this.player) {
                await this.player.stopAsync();
                console.log('Playback stopped');
            }
        } catch (error) {
            console.error('Failed to stop playback:', error);
            throw error;
        }
    }

    public addListener(callback: (state: RecordingState) => void): void {
        this.listeners.push(callback);
    }

    public removeListener(callback: (state: RecordingState) => void): void {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    private startDurationTracking(): void {
        this.stopDurationTracking();
        this.durationInterval = setInterval(() => {
            if (this.recordingState.isRecording && !this.recordingState.isPaused) {
                this.recordingState = {
                    ...this.recordingState,
                    duration: (Date.now() - this.startTime) / 1000
                };
                this.notifyListeners();
            }
        }, 100);
    }

    private stopDurationTracking(): void {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener({ ...this.recordingState });
            } catch (error) {
                console.error('Error in audio service listener:', error);
            }
        });
    }

    public async saveRecording(recording: AudioRecording): Promise<void> {
        try {
            if (!recording.uri) {
                throw new Error('No recording URI provided');
            }

            // Create recordings directory if it doesn't exist
            const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
            const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
            }

            // Generate filename with timestamp
            const timestamp = new Date().getTime();
            const filename = `recording_${timestamp}.m4a`;
            const destinationUri = `${recordingsDir}${filename}`;

            // Copy the recording to the permanent location
            await FileSystem.copyAsync({
                from: recording.uri,
                to: destinationUri
            });

            console.log('Recording saved to:', destinationUri);
        } catch (error) {
            console.error('Failed to save recording:', error);
            throw error;
        }
    }

    public async getRecordings(): Promise<AudioRecording[]> {
        try {
            const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
            const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

            if (!dirInfo.exists) {
                return [];
            }

            const recordings = await FileSystem.readDirectoryAsync(recordingsDir);
            const recordingFiles: AudioRecording[] = [];

            for (const filename of recordings) {
                const uri = `${recordingsDir}${filename}`;
                const fileInfo = await FileSystem.getInfoAsync(uri);

                if (fileInfo.exists && !fileInfo.isDirectory) {
                    recordingFiles.push({
                        uri,
                        name: filename.replace(/\.[^/.]+$/, ''), // Remove extension
                        duration: 0, // Duration would need to be calculated
                        createdAt: new Date(fileInfo.modificationTime || Date.now())
                    });
                }
            }

            // Sort by creation date, newest first
            return recordingFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            console.error('Failed to get recordings:', error);
            return [];
        }
    }

    public async deleteRecording(uri: string): Promise<void> {
        try {
            await FileSystem.deleteAsync(uri);
            console.log('Recording deleted:', uri);
        } catch (error) {
            console.error('Failed to delete recording:', error);
            throw error;
        }
    }

    public async cleanup(): Promise<void> {
        this.stopDurationTracking();

        if (this.player) {
            await this.player.unloadAsync();
            this.player = null;
        }

        this.listeners = [];
        this.recordingState = {
            isRecording: false,
            duration: 0,
            uri: null,
            isPaused: false
        };

        console.log('Audio service cleaned up');
    }

    private startDurationTracking(): void {
        this.stopDurationTracking();
        this.durationInterval = setInterval(() => {
            if (this.recordingState.isRecording && !this.recordingState.isPaused) {
                this.recordingState = {
                    ...this.recordingState,
                    duration: (Date.now() - this.startTime) / 1000
                };
                this.notifyListeners();
            }
        }, 100);
    }

    private stopDurationTracking(): void {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener({ ...this.recordingState });
            } catch (error) {
                console.error('Error in audio service listener:', error);
            }
        });
    }

    // Sleep recording methods
    public async startNocturnalRecording(config?: {
        startTime?: Date;
        endTime?: Date;
        sensitivity?: 'low' | 'medium' | 'high';
    }): Promise<string | null> {
        try {
            console.log('Starting nocturnal sleep recording with config:', config);

            // Use existing startRecording method with enhanced settings for sleep
            await this.startRecording();

            // Store config for later use
            if (config) {
                this.sleepRecordingConfig = config;
            }

            // Return placeholder URI since startRecording doesn't return URI
            return `sleep_recording_${Date.now()}.m4a`;
        } catch (error) {
            console.error('Failed to start nocturnal recording:', error);
            throw error;
        }
    }

    public async stopNocturnalRecording(): Promise<{
        uri: string;
        duration: number;
        analysis?: any;
    } | null> {
        try {
            console.log('Stopping nocturnal sleep recording');

            const uri = await this.stopRecording();
            if (!uri) return null;

            const duration = this.recordingState.duration;

            // Basic sleep analysis placeholder
            const analysis = {
                snoringEvents: [],
                sleepTalkingEvents: [],
                totalSleepDuration: duration,
                sleepQuality: Math.floor(Math.random() * 10) + 1, // Placeholder
                recordedAt: new Date().toISOString()
            };

            return {
                uri,
                duration,
                analysis
            };
        } catch (error) {
            console.error('Failed to stop nocturnal recording:', error);
            throw error;
        }
    }

    public async getCurrentSleepAnalysis(): Promise<{
        snoringEvents: Array<{
            timestamp: Date;
            duration: number;
            intensity: 'light' | 'moderate' | 'heavy';
        }>;
        sleepTalkingEvents: Array<{
            timestamp: Date;
            transcript: string;
            confidence: number;
        }>;
        totalSleepDuration: number;
        sleepQuality: number;
    } | null> {
        try {
            console.log('Getting current sleep analysis');

            // Return current session analysis or null if not recording
            if (!this.recordingState.isRecording) {
                return null;
            }

            // Placeholder analysis - in real implementation this would analyze the audio
            return {
                snoringEvents: [],
                sleepTalkingEvents: [],
                totalSleepDuration: this.recordingState.duration,
                sleepQuality: 7 // Placeholder
            };
        } catch (error) {
            console.error('Failed to get sleep analysis:', error);
            return null;
        }
    }

    // Private properties for sleep recording
    private sleepRecordingConfig?: {
        startTime?: Date;
        endTime?: Date;
        sensitivity?: 'low' | 'medium' | 'high';
    };
}

export default AudioService;