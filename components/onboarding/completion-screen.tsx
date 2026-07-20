import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignSystem } from '../../constants/theme';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const { height } = Dimensions.get('window');

interface CompletionScreenProps {
    onComplete: () => void;
    userName: string;
}

export default function CompletionScreen({ onComplete, userName }: Readonly<CompletionScreenProps>) {
    const insets = useSafeAreaInsets();

    React.useEffect(() => {
        // Auto-complete after 3 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <ThemedView style={styles.container}>
            <LinearGradient
                colors={DesignSystem.gradients.primaryVertical.colors as [string, string]}
                style={styles.gradient}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[
                        styles.content,
                        {
                            paddingTop: insets.top + 24,
                            paddingBottom: insets.bottom + 84,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Success Animation */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                            style={styles.iconBackground}
                        >
                            <Ionicons
                                name="checkmark-circle"
                                size={80}
                                color="#ffffff"
                            />
                        </LinearGradient>
                    </View>

                    {/* Welcome Message */}
                    <View style={styles.textContainer}>
                        <ThemedText style={styles.title}>
                            Gotowe, zaczynamy
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            {userName ? `${userName}, konfiguracja zakończona.` : 'Konfiguracja zakończona.'} Możesz już korzystać z analizy notatek, zadań i swoich wzorców dnia.
                        </ThemedText>

                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="mic" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Nagrywaj notatki głosowe</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="analytics" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Otrzymuj dzienne wnioski</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="heart" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Śledź samopoczucie i nawyki</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="lock-closed" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Zachowaj kontrolę nad danymi</Text>
                            </View>
                        </View>

                        <ThemedText style={styles.startingText}>
                            Za chwilę przejdziesz do aplikacji...
                        </ThemedText>
                    </View>
                </ScrollView>

                {/* Background Decoration */}
                <View pointerEvents="none" style={styles.backgroundDecoration}>
                    <View style={[styles.circle, styles.circle1]} />
                    <View style={[styles.circle, styles.circle2]} />
                    <View style={[styles.circle, styles.circle3]} />
                </View>
            </LinearGradient>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        position: 'relative',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        zIndex: 1,
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    featureList: {
        width: '100%',
        marginBottom: 30,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 10,
    },
    featureText: {
        fontSize: 16,
        color: '#ffffff',
        marginLeft: 12,
    },
    startingText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
    },
    backgroundDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    circle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 1000,
    },
    circle1: {
        width: 200,
        height: 200,
        top: -100,
        right: -100,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: -75,
        left: -75,
    },
    circle3: {
        width: 100,
        height: 100,
        top: height * 0.2,
        left: -50,
    },
});
