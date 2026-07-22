import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { AudioService } from '../lib/services/audio';
import { ApiService } from '../lib/services/api';
import { getApiUrl } from '../lib/utils/config';
import { useAppStore } from '../stores/app-store';

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

export const useSleepRecording = () => {
    const audioService = AudioService.getInstance();
    const { setError } = useAppStore();

    const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
    const [currentRecording, setCurrentRecording] = useState<any>(null);
    const [sleepConfig, setSleepConfig] = useState<SleepRecordingConfig>({
        startTime: new Date(new Date().setHours(22, 0, 0, 0)), // 10 PM
        endTime: new Date(new Date().setHours(6, 0, 0, 0)), // 6 AM
        enabled: false,
        airplaneMode: true,
        sensitivity: 'medium',
    });

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
        console.log('Updating sleep config with:', config);
        setSleepConfig(prev => {
            const newConfig = { ...prev, ...config };
            console.log('New sleep config:', newConfig);
            return newConfig;
        });
    }, []);

    const startSleepRecording = useCallback(async (forceStart = false): Promise<boolean> => {
        try {
            console.log('startSleepRecording called with config:', sleepConfig, 'forceStart:', forceStart);

            // Initialize audio service first
            await audioService.initialize();

            if (!forceStart && !sleepConfig.enabled) {
                console.log('Sleep recording is not enabled in config');
                setError('Sleep recording is not enabled');
                return false;
            }

            // Enable airplane mode for battery conservation
            if (sleepConfig.airplaneMode) {
                // Note: This would require native module for actual airplane mode
                console.log('Sleep recording starting in airplane mode');
            }

            console.log('Starting nocturnal recording...');
            const recording = await audioService.startNocturnalRecording({
                sensitivity: sleepConfig.sensitivity,
            });

            console.log('Nocturnal recording started:', recording);
            setCurrentRecording(recording);
            setIsRecordingEnabled(true);

            return true;
        } catch (error) {
            console.error('Failed to start sleep recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to start sleep recording');
            setIsRecordingEnabled(false);
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

            // Process the recording for sleep analysis — the backend persists
            // the resulting SleepTracking record itself, no separate upload step needed.
            const sleepAnalysis = await processSleepRecording(recording);

            return sleepAnalysis;
        } catch (error) {
            console.error('Failed to stop sleep recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to stop sleep recording');
            return null;
        }
    }, [audioService, setError]);

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
    const authToken = ApiService.getInstance().getAuthToken();

    const formData = new FormData();
    formData.append('audio', {
        uri: recording.uri,
        type: 'audio/m4a',
        name: 'sleep_recording.m4a',
    } as any);
    formData.append('bedtime', new Date(recording.startTime || Date.now() - recording.duration).toISOString());
    formData.append('wakeTime', new Date().toISOString());

    // Call the backend API for real AI analysis — audio is now actually
    // uploaded (previously this sent recording.uri, a local device path,
    // as a JSON string field; the server never received any audio).
    //
    // Deliberately no catch-and-fake-success fallback here: a full night's
    // recording can be a large multipart upload (100+ MB), and it used to
    // silently fail (bad network, dropped connection, server error) while
    // returning a fabricated local quality score that was never persisted.
    // The caller (stopSleepRecording) showed a "success" alert either way,
    // so failed uploads looked identical to real ones and nothing was ever
    // saved server-side. Throwing here lets stopSleepRecording's existing
    // catch surface the real error instead.
    const response = await fetch(`${getApiUrl()}/api/sleep-tracking/process-audio`, {
        method: 'POST',
        headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            // Don't set Content-Type - let fetch set it with the multipart boundary
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    await response.json();

    // Analysis runs async on the server now (it can take a while for a
    // full night's recording) — this just confirms the upload succeeded.
    // The real results populate sleepRecord.snoringDetected etc. later;
    // callers should re-fetch via getSleepInsights / findLatest once
    // processingStatus is 'completed'.
    return {
        snoringEvents: [],
        sleepTalkingEvents: [],
        totalSleepDuration: recording.duration,
        sleepQuality: 0,
    };
}