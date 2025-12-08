import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IntroScreenProps {
    onContinue: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onContinue }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['#4CAF50', '#45A049', '#388E3C']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="mic" size={80} color="white" />
                    </View>

                    <Text style={styles.title}>
                        Zapisuj swój dzień w sposób naturalny – głosem.
                    </Text>

                    <Text style={styles.subtitle}>
                        Jedna krótka notatka, a my zamienimy ją w zadania, priorytety i podsumowania.
                    </Text>

                    <View style={styles.features}>
                        <View style={styles.featureItem}>
                            <Ionicons name="flash" size={24} color="white" />
                            <Text style={styles.featureText}>Natychmiastowy zapis myśli</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons name="list" size={24} color="white" />
                            <Text style={styles.featureText}>Automatyczne zadania</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <Ionicons name="analytics" size={24} color="white" />
                            <Text style={styles.featureText}>Inteligentne podsumowania</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={onContinue}>
                        <Text style={styles.buttonText}>Rozpocznij</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginTop: 40,
        lineHeight: 36,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 26,
        marginTop: 20,
    },
    features: {
        width: '100%',
        marginTop: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    featureText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 16,
        flex: 1,
    },
    button: {
        backgroundColor: 'white',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 30,
        marginTop: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});