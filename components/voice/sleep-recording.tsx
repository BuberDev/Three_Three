import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSleepRecording } from '../../hooks/use-sleep-recording';
import { useThemeColor } from '../../hooks/use-theme-color';

interface SleepRecordingComponentProps {
    onSleepSessionComplete?: (analysis: any) => void;
}

export const SleepRecordingComponent: React.FC<SleepRecordingComponentProps> = ({
    onSleepSessionComplete,
}) => {
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const surfaceColor = useThemeColor({}, 'surface');
    const whiteColor = '#FFFFFF'; // Static white
    const greyColor = useThemeColor({}, 'textTertiary');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundSecondaryColor = useThemeColor({}, 'backgroundSecondary');
    const borderColor = useThemeColor({}, 'border');
    const lightGreyColor = useThemeColor({}, 'borderLight');
    const successColor = useThemeColor({}, 'success');
    const errorColor = useThemeColor({}, 'error');
    const {
        sleepConfig,
        updateSleepConfig,
        isRecordingEnabled,
        startSleepRecording,
        stopSleepRecording,
        getCurrentSleepSession,
    } = useSleepRecording();

    const [currentSession, setCurrentSession] = useState<any>(null);

    const handleToggleSleepRecording = async () => {
        if (!sleepConfig.enabled) {
            // Enable sleep recording
            updateSleepConfig({ enabled: true });

            Alert.alert(
                'Sleep Recording Enabled',
                'Your device will automatically start recording during sleep hours (10 PM - 6 AM) to monitor snoring and sleep talking. Recording happens in airplane mode to save battery.',
                [{ text: 'OK' }]
            );
        } else {
            // Disable sleep recording
            updateSleepConfig({ enabled: false });

            if (isRecordingEnabled) {
                const analysis = await stopSleepRecording();
                if (analysis && onSleepSessionComplete) {
                    onSleepSessionComplete(analysis);
                }
            }
        }
    };

    const handleStartManualRecording = async () => {
        const success = await startSleepRecording();
        if (success) {
            Alert.alert(
                'Sleep Recording Started',
                'Your sleep session is now being recorded. The app will monitor for snoring and sleep talking throughout the night.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleStopManualRecording = async () => {
        const analysis = await stopSleepRecording();
        if (analysis) {
            setCurrentSession(analysis);
            Alert.alert(
                'Sleep Session Complete',
                `Sleep Quality: ${analysis.sleepQuality}/10\nSnoring Events: ${analysis.snoringEvents.length}\nSleep Duration: ${(analysis.totalSleepDuration / (1000 * 60 * 60)).toFixed(1)} hours`,
                [{ text: 'View Details' }, { text: 'OK' }]
            );

            if (onSleepSessionComplete) {
                onSleepSessionComplete(analysis);
            }
        }
    };

    const handleSensitivityChange = (sensitivity: 'low' | 'medium' | 'high') => {
        updateSleepConfig({ sensitivity });
    };

    return (
        <View style={[styles.container, { backgroundColor: surfaceColor }]}>
            <View style={styles.header}>
                <Ionicons
                    name="moon"
                    size={24}
                    color={primaryColor}
                />
                <Text style={[styles.title, { color: textColor }]}>Sleep Monitoring</Text>
            </View>

            <View style={styles.configSection}>
                <View style={styles.configRow}>
                    <Text style={[styles.configLabel, { color: textColor }]}>Enable Sleep Recording</Text>
                    <Switch
                        value={sleepConfig.enabled}
                        onValueChange={handleToggleSleepRecording}
                        trackColor={{ false: '#E5E7EB', true: primaryColor }}
                        thumbColor={sleepConfig.enabled ? '#FFFFFF' : '#D1D5DB'}
                    />
                </View>

                <View style={[styles.configRow, { borderBottomColor: lightGreyColor }]}>
                    <Text style={[styles.configLabel, { color: textColor }]}>Airplane Mode</Text>
                    <Switch
                        value={sleepConfig.airplaneMode}
                        onValueChange={(value) => updateSleepConfig({ airplaneMode: value })}
                        trackColor={{ false: '#E5E7EB', true: primaryColor }}
                        thumbColor={sleepConfig.airplaneMode ? '#FFFFFF' : '#D1D5DB'}
                    />
                </View>

                <View style={styles.sensitivitySection}>
                    <Text style={[styles.configLabel, { color: textColor }]}>Detection Sensitivity</Text>
                    <View style={styles.sensitivityButtons}>
                        {(['low', 'medium', 'high'] as const).map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.sensitivityButton,
                                    { borderColor: greyColor },
                                    sleepConfig.sensitivity === level && {
                                        backgroundColor: primaryColor,
                                        borderColor: primaryColor
                                    }
                                ]}
                                onPress={() => handleSensitivityChange(level)}
                            >
                                <Text style={[
                                    styles.sensitivityButtonText,
                                    { color: greyColor },
                                    sleepConfig.sensitivity === level && { color: whiteColor }
                                ]}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.statusSection}>
                {isRecordingEnabled ? (
                    <View style={[styles.recordingStatus, { backgroundColor: `${successColor}20` }]}>
                        <View style={[styles.recordingIndicator, { backgroundColor: successColor }]} />
                        <Text style={[styles.recordingText, { color: successColor }]}>Recording sleep session...</Text>
                        <TouchableOpacity
                            style={[styles.stopButton, { backgroundColor: errorColor }]}
                            onPress={handleStopManualRecording}
                        >
                            <Text style={[styles.stopButtonText, { color: whiteColor }]}>Stop Recording</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.startButton,
                            { backgroundColor: primaryColor },
                            !sleepConfig.enabled && { backgroundColor: greyColor }
                        ]}
                        onPress={handleStartManualRecording}
                        disabled={!sleepConfig.enabled}
                    >
                        <Ionicons name="bed" size={20} color={whiteColor} />
                        <Text style={[styles.startButtonText, { color: whiteColor }]}>Start Sleep Recording</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.infoSection}>
                <Text style={[styles.infoTitle, { color: textColor }]}>How it works:</Text>
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    • Recording starts automatically at 10 PM{'\n'}
                    • Monitors for snoring and sleep talking{'\n'}
                    • Runs in airplane mode to save battery{'\n'}
                    • Processes audio locally for privacy{'\n'}
                    • Stops automatically at 6 AM
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 12,
    },
    configSection: {
        marginBottom: 24,
    },
    configRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    configLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    sensitivitySection: {
        marginTop: 16,
    },
    sensitivityButtons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    sensitivityButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    sensitivityButtonActive: {
        // backgroundColor and borderColor will be set inline
    },
    sensitivityButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    sensitivityButtonTextActive: {
        // color will be set inline
    },
    statusSection: {
        marginBottom: 24,
    },
    recordingStatus: {
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 8,
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    recordingText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    stopButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    stopButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 8,
    },
    startButtonDisabled: {
        // backgroundColor will be set inline
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoSection: {},
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
});