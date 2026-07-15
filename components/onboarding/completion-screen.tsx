import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const { height } = Dimensions.get('window');

interface CompletionScreenProps {
    onComplete: () => void;
    userName: string;
}

export default function CompletionScreen({ onComplete, userName }: Readonly<CompletionScreenProps>) {
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
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.content}>
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
                            Welcome to Your Voice Journal!
                        </ThemedText>

                        <ThemedText style={styles.subtitle}>
                            {userName ? `Hi ${userName}!` : 'Hello!'} You&apos;re all set to start your journey of self-reflection and growth.
                        </ThemedText>

                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <Ionicons name="mic" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Record voice notes anywhere</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="analytics" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Get daily insights</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="heart" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Track your well-being</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="lock-closed" size={20} color="#ffffff" />
                                <Text style={styles.featureText}>Privacy-first approach</Text>
                            </View>
                        </View>

                        <ThemedText style={styles.startingText}>
                            Starting in 3 seconds...
                        </ThemedText>
                    </View>
                </View>

                {/* Background Decoration */}
                <View style={styles.backgroundDecoration}>
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
        flex: 1,
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