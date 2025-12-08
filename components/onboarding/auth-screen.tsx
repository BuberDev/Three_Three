import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

interface AuthScreenProps {
    onContinue: (authData: { email: string; authProvider: string }) => void;
    onBack: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onContinue, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAppleAuth = async () => {
        setIsLoading(true);
        try {
            // In real implementation, use expo-apple-authentication
            // For demo, simulate Apple sign-in
            setTimeout(() => {
                onContinue({
                    email: 'user@icloud.com',
                    authProvider: 'apple'
                });
                setIsLoading(false);
            }, 1000);
        } catch {
            setIsLoading(false);
            Alert.alert('Błąd', 'Nie udało się zalogować przez Apple');
        }
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            // In real implementation, use expo-auth-session with Google
            // For demo, simulate Google sign-in
            setTimeout(() => {
                onContinue({
                    email: 'user@gmail.com',
                    authProvider: 'google'
                });
                setIsLoading(false);
            }, 1000);
        } catch {
            setIsLoading(false);
            Alert.alert('Błąd', 'Nie udało się zalogować przez Google');
        }
    };

    const handleEmailAuth = () => {
        // For demo, use a simple email
        onContinue({
            email: 'user@example.com',
            authProvider: 'email'
        });
    };

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
                <Text style={styles.title}>Utwórz konto</Text>
                <Text style={styles.subtitle}>
                    Twoje dane są bezpieczne. Synchronizujemy je tylko po to, by usprawnić Twoją codzienność.
                </Text>

                <View style={styles.authButtons}>
                    <TouchableOpacity
                        style={[styles.authButton, styles.appleButton]}
                        onPress={handleAppleAuth}
                        disabled={isLoading}
                    >
                        <Ionicons name="logo-apple" size={24} color="white" />
                        <Text style={styles.appleButtonText}>Kontynuuj z Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.authButton, styles.googleButton]}
                        onPress={handleGoogleAuth}
                        disabled={isLoading}
                    >
                        <Ionicons name="logo-google" size={24} color="#4285F4" />
                        <Text style={styles.googleButtonText}>Kontynuuj z Google</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>lub</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={[styles.authButton, styles.emailButton]}
                        onPress={handleEmailAuth}
                        disabled={isLoading}
                    >
                        <Ionicons name="mail" size={24} color={Colors.light.text} />
                        <Text style={styles.emailButtonText}>Kontynuuj z Email</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footerContainer}>
                <Text style={styles.termsText}>
                    Kontynuując, akceptujesz nasze{' '}
                    <Text style={styles.termsLink}>Warunki korzystania</Text>
                    {' '}i{' '}
                    <Text style={styles.termsLink}>Politykę prywatności</Text>
                </Text>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    authButtons: {
        width: '100%',
        marginBottom: 32,
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
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
    appleButton: {
        backgroundColor: '#000',
    },
    googleButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    emailButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    appleButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    googleButtonText: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    emailButtonText: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        color: Colors.light.tabIconDefault,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    termsText: {
        fontSize: 12,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    footerContainer: {
        backgroundColor: Colors.light.background,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
});