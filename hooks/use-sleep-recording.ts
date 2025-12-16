import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { AudioService } from '../lib/services/audio';
import { useAppStore } from '../stores/app-store';

const SLEEP_RECORDING_TASK = 'sleep-recording';
const SLEEP_MONITORING_TASK = 'sleep-monitoring';

interface SleepRecordingConfig {
    startTime: Date;
    endTime: Date;
    enabled: boolean;
    airplaneMode: boolean;
    sensitivity: 'low' | 'medium' | 'high';
}

interface SleepAnalysis {
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
}

TaskManager.defineTask(SLEEP_RECORDING_TASK, async () => {
    try {
        const audioService = AudioService.getInstance();
        const isNightTime = isCurrentlyNightTime();

        if (isNightTime) {
            // Continue or start recording
            await audioService.startNocturnalRecording();
        } else {
            // Stop recording and process
            const recording = await audioService.stopNocturnalRecording();
            if (recording) {
                await processSleepRecording(recording);
            }
        }

        return { data: null, error: null }; // Success
    } catch (error) {
        console.error('Sleep recording task error:', error);
        return { data: null, error: error }; // Failure
    }
});

export const useSleepRecording = () => {
    const audioService = AudioService.getInstance();
    const { uploadSleepRecording, setError } = useAppStore();

    const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
    const [currentRecording, setCurrentRecording] = useState<any>(null);
    const [sleepConfig, setSleepConfig] = useState<SleepRecordingConfig>({
        startTime: new Date(new Date().setHours(22, 0, 0, 0)), // 10 PM
        endTime: new Date(new Date().setHours(6, 0, 0, 0)), // 6 AM
        enabled: false,
        airplaneMode: true,
        sensitivity: 'medium',
    });

    // Initialize background tasks
    useEffect(() => {
        const registerBackgroundTasks = async () => {
            try {
                // Background tasks are already registered via TaskManager.defineTask above
                console.log('Background sleep recording task registered');
            } catch (error) {
                console.error('Failed to register background task:', error);
                setError('Failed to set up sleep recording');
            }
        };

        registerBackgroundTasks();

        return () => {
            // Cleanup if needed
            TaskManager.unregisterTaskAsync(SLEEP_RECORDING_TASK);
        };
    }, []);

    // Monitor app state for sleep mode
    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                if (sleepConfig.enabled && isCurrentlyNightTime()) {
                    startSleepRecording();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [sleepConfig.enabled]);

    const updateSleepConfig = useCallback((config: Partial<SleepRecordingConfig>) => {
        setSleepConfig(prev => ({ ...prev, ...config }));
    }, []);

    const startSleepRecording = useCallback(async (): Promise<boolean> => {
        try {
            if (!sleepConfig.enabled) {
                setError('Sleep recording is not enabled');
                return false;
            }

            // Enable airplane mode for battery conservation
            if (sleepConfig.airplaneMode) {
                // Note: This would require native module for actual airplane mode
                console.log('Sleep recording starting in airplane mode');
            }

            const recording = await audioService.startNocturnalRecording({
                sensitivity: sleepConfig.sensitivity,
            });

            setCurrentRecording(recording);
            setIsRecordingEnabled(true);

            return true;
        } catch (error) {
            console.error('Failed to start sleep recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to start sleep recording');
            return false;
        }
    }, [sleepConfig, audioService, setError]);

    const stopSleepRecording = useCallback(async (): Promise<SleepAnalysis | null> => {
        try {
            const recording = await audioService.stopNocturnalRecording();
            setIsRecordingEnabled(false);
            setCurrentRecording(null);

            if (!recording) {
                return null;
            }

            // Process the recording for sleep analysis
            const sleepAnalysis = await processSleepRecording(recording);

            // Upload to server for further analysis
            await uploadSleepRecording(sleepAnalysis);

            return sleepAnalysis;
        } catch (error) {
            console.error('Failed to stop sleep recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to stop sleep recording');
            return null;
        }
    }, [audioService, uploadSleepRecording, setError]);

    const getCurrentSleepSession = useCallback(async (): Promise<{
        duration: number;
        snoringEvents: number;
        sleepTalkingEvents: number;
        quality: number;
    } | null> => {
        if (!currentRecording) {
            return null;
        }

        try {
            const sessionData = await audioService.getCurrentSleepAnalysis();
            return {
                duration: sessionData?.totalSleepDuration ?? 0,
                snoringEvents: sessionData?.snoringEvents.length ?? 0,
                sleepTalkingEvents: sessionData?.sleepTalkingEvents.length ?? 0,
                quality: sessionData?.sleepQuality ?? 0
            };
        } catch (error) {
            console.error('Failed to get current sleep session:', error);
            return null;
        }
    }, [currentRecording, audioService]);

    // Schedule automatic sleep recording
    const scheduleNightlyRecording = useCallback(async () => {
        if (!sleepConfig.enabled) {
            return;
        }

        const now = new Date();
        const tonight = new Date(sleepConfig.startTime);
        tonight.setDate(now.getDate());

        if (tonight < now) {
            tonight.setDate(tonight.getDate() + 1);
        }

        // This would use a scheduling service in production
        console.log(`Sleep recording scheduled for ${tonight.toISOString()}`);
    }, [sleepConfig]);

    return {
        // Configuration
        sleepConfig,
        updateSleepConfig,

        // Recording control
        isRecordingEnabled,
        startSleepRecording,
        stopSleepRecording,
        scheduleNightlyRecording,

        // Session data
        currentRecording,
        getCurrentSleepSession,
    };
};

// Helper functions
function isCurrentlyNightTime(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 22 || hour <= 6;
}

async function processSleepRecording(recording: any): Promise<SleepAnalysis> {
    // This would contain the actual audio processing logic
    // For now, return mock data
    return {
        snoringEvents: [
            {
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                duration: 120,
                intensity: 'moderate',
            }
        ],
        sleepTalkingEvents: [],
        totalSleepDuration: 7.5 * 60 * 60 * 1000, // 7.5 hours
        sleepQuality: 8.2,
    };
}