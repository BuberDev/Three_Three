import { useCallback, useEffect, useState } from 'react';
import { AudioService } from '../lib/services/audio';
import { AudioRecording, RecordingState } from '../lib/types';
import { useAppStore } from '../stores/app-store';

export const useVoiceRecording = () => {
    const audioService = AudioService.getInstance();
    const {
        currentRecording,
        updateRecordingState,
        uploadVoiceNote,
        isProcessingVoiceNote,
        setError
    } = useAppStore();

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        // Initialize audio service and check permissions
        const initAudio = async () => {
            try {
                await audioService.initialize();
                const permission = await audioService.requestPermissions();
                setHasPermission(permission);
            } catch (error) {
                console.error('Failed to initialize audio:', error);
                setError('Failed to initialize audio recording');
                setHasPermission(false);
            }
        };

        initAudio();

        // Set up recording state listener
        const handleRecordingStateChange = (state: RecordingState) => {
            updateRecordingState(state);
        };

        audioService.addListener(handleRecordingStateChange);

        return () => {
            audioService.removeListener(handleRecordingStateChange);
        };
    }, [audioService, updateRecordingState, setError]);

    const startRecording = useCallback(async (): Promise<boolean> => {
        if (!hasPermission) {
            const permission = await audioService.requestPermissions();
            setHasPermission(permission);
            if (!permission) {
                setError('Microphone permission is required to record voice notes');
                return false;
            }
        }

        try {
            await audioService.startRecording();
            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to start recording');
            return false;
        }
    }, [hasPermission, audioService, setError]);

    const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
        try {
            const recording = await audioService.stopRecording();
            return recording;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to stop recording');
            return null;
        }
    }, [audioService, setError]);

    const playRecording = useCallback(async (uri: string): Promise<void> => {
        try {
            await audioService.playRecording(uri);
        } catch (error) {
            console.error('Failed to play recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to play recording');
        }
    }, [audioService, setError]);

    const stopPlayback = useCallback(async (): Promise<void> => {
        try {
            await audioService.stopPlayback();
        } catch (error) {
            console.error('Failed to stop playback:', error);
        }
    }, [audioService]);

    const deleteRecording = useCallback(async (uri: string): Promise<void> => {
        try {
            await audioService.deleteRecording(uri);
        } catch (error) {
            console.error('Failed to delete recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete recording');
        }
    }, [audioService, setError]);

    const processAndUpload = useCallback(async (audioRecording: AudioRecording): Promise<boolean> => {
        try {
            const success = await uploadVoiceNote(audioRecording.uri);
            if (success) {
                // Delete the local recording after successful upload
                await deleteRecording(audioRecording.uri);
            }
            return success;
        } catch (error) {
            console.error('Failed to process and upload recording:', error);
            setError(error instanceof Error ? error.message : 'Failed to process voice note');
            return false;
        }
    }, [uploadVoiceNote, deleteRecording, setError]);

    const recordAndUpload = useCallback(async (): Promise<boolean> => {
        if (currentRecording.isRecording) {
            // Stop recording and upload
            const recording = await stopRecording();
            if (recording) {
                return await processAndUpload(recording);
            }
            return false;
        } else {
            // Start recording
            return await startRecording();
        }
    }, [currentRecording.isRecording, startRecording, stopRecording, processAndUpload]);

    return {
        // State
        currentRecording,
        hasPermission,
        isProcessingVoiceNote,

        // Actions
        startRecording,
        stopRecording,
        playRecording,
        stopPlayback,
        deleteRecording,
        processAndUpload,
        recordAndUpload,

        // Computed
        isRecording: currentRecording.isRecording,
        duration: currentRecording.duration,
        canRecord: hasPermission === true,
    };
};