import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useVoiceRecording } from '../../hooks/use-voice-recording';
import { AudioRecording } from '../../lib/types';

interface VoiceRecorderProps {
    onComplete?: () => void;
    onCompleteWithAudio?: (audioRecording: AudioRecording) => Promise<boolean>; // Enterprise callback with duration
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onComplete,
    onCompleteWithAudio,
    size = 'large',
    disabled = false,
}) => {
    const {
        isRecording,
        duration,
        canRecord,
        recordAndUpload,
        recordOnly,
        isProcessingVoiceNote,
    } = useVoiceRecording();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    const pulseAnimation = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnimation, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnimation, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnimation.setValue(1);
        }
    }, [isRecording, pulseAnimation]);

    const handlePress = async () => {
        if (disabled || !canRecord) return;

        // Use custom upload callback if provided
        if (onCompleteWithAudio) {
            console.log('🎯 VoiceRecorder: Using onCompleteWithAudio callback');
            const wasRecording = isRecording; // Capture state before calling recordOnly
            console.log('🎯 Was recording before recordOnly:', wasRecording);

            const result = await recordOnly();
            console.log('🎯 RecordOnly result:', result, 'type:', typeof result);

            if (result && result !== 'recording-started' && typeof result === 'object') {
                console.log('🎙️ Recording completed, calling onCompleteWithAudio with:', result);
                // Recording completed, call custom upload with AudioRecording object
                const success = await onCompleteWithAudio(result);
                console.log('✅ Upload result:', success);
                if (success && onComplete) {
                    onComplete();
                }
            } else {
                console.log('⚠️ Not calling onCompleteWithAudio - result:', result);
            }
        } else {
            console.log('🎯 VoiceRecorder: Using default recordAndUpload');
            // Use default upload behavior
            const success = await recordAndUpload();
            if (success && !isRecording && onComplete) {
                onComplete();
            }
        }
    };

    const formatDuration = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const buttonSize = {
        small: 60,
        medium: 80,
        large: 120,
    }[size];

    const iconSize = {
        small: 24,
        medium: 32,
        large: 40,
    }[size];

    const getButtonContent = () => {
        const iconColor = (disabled || !canRecord) ? colors.textSecondary : colors.onAccent;

        if (isProcessingVoiceNote) {
            return <Ionicons name="hourglass" size={iconSize} color={iconColor} />;
        }

        if (isRecording) {
            return <Ionicons name="stop" size={iconSize} color={iconColor} />;
        }

        return <Ionicons name="mic" size={iconSize} color={iconColor} />;
    };

    const getGradientColors = (): [string, string] => {
        if (disabled || !canRecord) {
            return [colors.backgroundTertiary, colors.backgroundTertiary];
        }

        if (isRecording) {
            return [colors.error, colors.error];
        }

        if (isProcessingVoiceNote) {
            return [colors.secondary, colors.secondaryLight];
        }

        return [colors.primary, colors.primaryLight];
    };

    return (
        <View style={styles.container}>
            {isRecording && (
                <View style={[styles.recordingIndicator, { backgroundColor: colors.error + '1A' }]}>
                    <View style={[styles.recordingDot, { backgroundColor: colors.error }]} />
                    <Text style={[styles.recordingText, { color: colors.error }]}>
                        Nagrywanie {formatDuration(duration)}
                    </Text>
                </View>
            )}

            {isProcessingVoiceNote && (
                <Text style={[styles.processingText, { color: colors.textSecondary }]}>
                    Przetwarzanie notatki głosowej...
                </Text>
            )}

            <Animated.View
                style={[
                    styles.buttonContainer,
                    {
                        transform: [{ scale: pulseAnimation }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.recordButton,
                        {
                            width: buttonSize,
                            height: buttonSize,
                            borderRadius: buttonSize / 2,
                        },
                    ]}
                    onPress={handlePress}
                    disabled={disabled || !canRecord || isProcessingVoiceNote}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={getGradientColors()}
                        style={[
                            styles.gradient,
                            {
                                borderRadius: buttonSize / 2,
                            },
                        ]}
                    >
                        {getButtonContent()}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {!canRecord && (
                <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                    Włącz dostęp do mikrofonu, aby nagrywać
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    buttonContainer: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    recordButton: {
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    recordingText: {
        fontSize: 14,
        fontWeight: '600',
    },
    processingText: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 12,
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
