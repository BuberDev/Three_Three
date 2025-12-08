import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AudioRecording, RecordingState } from '../types';

export class AudioService {
    private static instance: AudioService;
    private recording: Audio.Recording | null = null;
    private playbackObject: Audio.Sound | null = null;
    private recordingState: RecordingState = {
        isRecording: false,
        duration: 0,
    };
    private listeners: ((state: RecordingState) => void)[] = [];

    private constructor() { }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    public async initialize(): Promise<void> {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });
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

    public async startRecording(): Promise<void> {
        try {
            // Stop any existing playback
            if (this.playbackObject) {
                await this.playbackObject.unloadAsync();
                this.playbackObject = null;
            }

            // Check permissions
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Audio recording permission not granted');
            }

            // Configure recording options
            const recordingOptions: Audio.RecordingOptions = {
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.outputFormat,
                    audioEncoder: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.audioEncoder,
                    sampleRate: 44100,
                    numberOfChannels: 2,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.m4a',
                    audioQuality: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios.audioQuality,
                    sampleRate: 44100,
                    numberOfChannels: 2,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/webm',
                    bitsPerSecond: 128000,
                },
            };

            // Create and start recording
            this.recording = new Audio.Recording();
            await this.recording.prepareToRecordAsync(recordingOptions);

            // Set up status update listener
            this.recording.setOnRecordingStatusUpdate((status) => {
                if (status.isRecording) {
                    this.updateRecordingState({
                        isRecording: true,
                        duration: status.durationMillis || 0,
                    });
                }
            });

            await this.recording.startAsync();

            this.updateRecordingState({
                isRecording: true,
                duration: 0,
            });

            console.log('Recording started');
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    public async stopRecording(): Promise<AudioRecording | null> {
        try {
            if (!this.recording) {
                console.warn('No recording in progress');
                return null;
            }

            await this.recording.stopAndUnloadAsync();
            const uri = this.recording.getURI();

            if (!uri) {
                throw new Error('Recording URI not available');
            }

            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(uri);

            const audioRecording: AudioRecording = {
                uri,
                duration: this.recordingState.duration,
                size: fileInfo.exists && !fileInfo.isDirectory && 'size' in fileInfo ? fileInfo.size : 0,
            };

            // Reset state
            this.recording = null;
            this.updateRecordingState({
                isRecording: false,
                duration: 0,
                uri,
            });

            console.log('Recording stopped:', audioRecording);
            return audioRecording;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.recording = null;
            this.updateRecordingState({
                isRecording: false,
                duration: 0,
            });
            throw error;
        }
    }

    public async playRecording(uri: string): Promise<void> {
        try {
            // Stop any existing playback
            if (this.playbackObject) {
                await this.playbackObject.unloadAsync();
            }

            // Load and play the recording
            const { sound } = await Audio.Sound.createAsync({ uri });
            this.playbackObject = sound;

            await sound.playAsync();

            // Set up completion listener
            sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) {
                    this.stopPlayback();
                }
            });

            console.log('Playback started');
        } catch (error) {
            console.error('Failed to play recording:', error);
            throw error;
        }
    }

    public async stopPlayback(): Promise<void> {
        try {
            if (this.playbackObject) {
                await this.playbackObject.unloadAsync();
                this.playbackObject = null;
                console.log('Playback stopped');
            }
        } catch (error) {
            console.error('Failed to stop playback:', error);
        }
    }

    public async deleteRecording(uri: string): Promise<void> {
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            console.log('Recording deleted:', uri);
        } catch (error) {
            console.error('Failed to delete recording:', error);
            throw error;
        }
    }

    public getRecordingState(): RecordingState {
        return { ...this.recordingState };
    }

    public addListener(listener: (state: RecordingState) => void): void {
        this.listeners.push(listener);
    }

    public removeListener(listener: (state: RecordingState) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    private updateRecordingState(newState: Partial<RecordingState>): void {
        this.recordingState = { ...this.recordingState, ...newState };
        for (const listener of this.listeners) {
            listener(this.recordingState);
        }
    }

    public async cleanup(): Promise<void> {
        try {
            if (this.recording) {
                await this.recording.stopAndUnloadAsync();
                this.recording = null;
            }

            if (this.playbackObject) {
                await this.playbackObject.unloadAsync();
                this.playbackObject = null;
            }

            this.listeners = [];
            this.recordingState = { isRecording: false, duration: 0 };
        } catch (error) {
            console.error('Audio service cleanup failed:', error);
        }
    }
}