import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

interface ConsentScreenProps {
    onContinue: (consents: { voiceProcessing: boolean; personalization: boolean }) => void;
    onBack: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onContinue, onBack }) => {
    const [voiceProcessingConsent, setVoiceProcessingConsent] = useState(false);
    const [personalizationConsent, setPersonalizationConsent] = useState(false);

    const handleContinue = () => {
        onContinue({
            voiceProcessing: voiceProcessingConsent,
            personalization: personalizationConsent
        });
    };

    const canContinue = voiceProcessingConsent; // Voice processing is required

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleContainer}>
                    <Ionicons name="shield-checkmark" size={48} color="#4CAF50" />
                    <Text style={styles.title}>Twoje dane. Twoje decyzje.</Text>
                    <Text style={styles.subtitle}>
                        Wyjaśniamy dokładnie, jak przetwarzamy Twoje dane.
                    </Text>
                </View>

                <View style={styles.consentsContainer}>
                    <View style={styles.consentItem}>
                        <View style={styles.consentHeader}>
                            <View style={styles.consentInfo}>
                                <Text style={styles.consentTitle}>
                                    Analiza notatek głosowych
                                </Text>
                                <Text style={styles.consentDescription}>
                                    Zgadzam się na analizę moich notatek głosowych w celu automatycznego tworzenia zadań i podsumowań.
                                </Text>
                                <View style={styles.requiredBadge}>
                                    <Text style={styles.requiredText}>Wymagane</Text>
                                </View>
                            </View>
                            <Switch
                                value={voiceProcessingConsent}
                                onValueChange={setVoiceProcessingConsent}
                                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                thumbColor={voiceProcessingConsent ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    </View>

                    <View style={styles.consentItem}>
                        <View style={styles.consentHeader}>
                            <View style={styles.consentInfo}>
                                <Text style={styles.consentTitle}>
                                    Personalizacja doświadczenia
                                </Text>
                                <Text style={styles.consentDescription}>
                                    Zgadzam się na wykorzystywanie danych do personalizacji rekomendacji i dostosowania aplikacji do moich potrzeb.
                                </Text>
                                <View style={styles.optionalBadge}>
                                    <Text style={styles.optionalText}>Opcjonalne</Text>
                                </View>
                            </View>
                            <Switch
                                value={personalizationConsent}
                                onValueChange={setPersonalizationConsent}
                                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                                thumbColor={personalizationConsent ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Twoja prywatność jest ważna</Text>
                    <View style={styles.infoList}>
                        <View style={styles.infoItem}>
                            <Ionicons name="lock-closed" size={16} color="#4CAF50" />
                            <Text style={styles.infoText}>Dane są szyfrowane i bezpieczne</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="time" size={16} color="#4CAF50" />
                            <Text style={styles.infoText}>Nagrania usuwane po 90 dniach</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="hand-left" size={16} color="#4CAF50" />
                            <Text style={styles.infoText}>Możesz wycofać zgodę w każdej chwili</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={[styles.continueButton, !canContinue && styles.disabledButton]}
                    onPress={handleContinue}
                    disabled={!canContinue}
                >
                    <Text style={[styles.continueButtonText, !canContinue && styles.disabledButtonText]}>
                        Kontynuuj
                    </Text>
                </TouchableOpacity>

                {!voiceProcessingConsent && (
                    <Text style={styles.warningText}>
                        Analiza notatek głosowych jest wymagana do działania aplikacji
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        zIndex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    titleContainer: {
        alignItems: 'center',
        paddingTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 22,
    },
    consentsContainer: {
        marginBottom: 24,
    },
    consentItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    consentHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    consentInfo: {
        flex: 1,
        marginRight: 16,
    },
    consentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    consentDescription: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        lineHeight: 20,
        marginBottom: 8,
    },
    requiredBadge: {
        backgroundColor: '#FFE5E5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    requiredText: {
        fontSize: 12,
        color: '#D32F2F',
        fontWeight: '600',
    },
    optionalBadge: {
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    optionalText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    infoSection: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 12,
    },
    infoList: {
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 14,
        color: Colors.light.text,
        marginLeft: 8,
        flex: 1,
    },
    footerContainer: {
        backgroundColor: Colors.light.background,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButtonText: {
        color: Colors.light.tabIconDefault,
    },
    warningText: {
        fontSize: 12,
        color: '#D32F2F',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 16,
    },
});