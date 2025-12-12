import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useVoiceRecording } from '../../hooks/use-voice-recording';

interface VoiceRecorderProps {
    onComplete?: () => void;
    onCompleteWithAudio?: (audioUri: string) => Promise<boolean>; // New Enterprise callback
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
            const result = await recordOnly();
            if (result && result !== 'recording-started' && !isRecording) {
                // Recording completed, call custom upload
                const success = await onCompleteWithAudio(result);
                if (success && onComplete) {
                    onComplete();
                }
            }
        } else {
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
        if (isProcessingVoiceNote) {
            return <Ionicons name="hourglass" size={iconSize} color="white" />;
        }

        if (isRecording) {
            return <Ionicons name="stop" size={iconSize} color="white" />;
        }

        return <Ionicons name="mic" size={iconSize} color="white" />;
    };

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        if (disabled || !canRecord) {
            return [Colors.light.tabIconDefault, Colors.light.tabIconDefault] as const;
        }

        if (isRecording) {
            return ['#FF6B6B', '#FF5252'] as const;
        }

        if (isProcessingVoiceNote) {
            return ['#FFA726', '#FF9800'] as const;
        }

        return ['#4CAF50', '#45A049'] as const;
    };

    return (
        <View style={styles.container}>
            {isRecording && (
                <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>
                        Recording {formatDuration(duration)}
                    </Text>
                </View>
            )}

            {isProcessingVoiceNote && (
                <Text style={styles.processingText}>
                    Processing your voice note...
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
                <Text style={styles.permissionText}>
                    Microphone permission required
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
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 20,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        marginRight: 8,
    },
    recordingText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    processingText: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        marginBottom: 16,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
        marginTop: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});