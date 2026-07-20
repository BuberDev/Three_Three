import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/use-theme-color';
import GoogleAuthService from '../../lib/services/google-auth';
import { getApiUrl } from '../../lib/utils/config';

interface AuthScreenProps {
    onContinue: (authData: {
        email: string;
        password?: string;
        authProvider: string;
        googleAuth?: {
            accessToken?: string;
            refreshToken?: string;
            idToken?: string;
            user?: any;
        };
        authData?: any;
    }) => void;
    onBack: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onContinue, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(false); // true = login, false = register
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const borderColor = useThemeColor({}, 'border');
    const primaryColor = useThemeColor({}, 'primary');
    const onAccentColor = useThemeColor({}, 'onAccent');

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
            const googleAuthService = GoogleAuthService.getInstance();

            // Validate configuration
            if (!googleAuthService.validateConfiguration()) {
                throw new Error('Google OAuth not properly configured. Please check your .env and Google Cloud Console setup.');
            }

            const result = await googleAuthService.signIn();

            // Successfully authenticated with Google
            onContinue({
                email: result.user.email,
                authProvider: 'google',
                googleAuth: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    idToken: result.idToken,
                    user: result.user
                }
            });
        } catch (error) {
            console.error('Google authentication failed:', error);
            Alert.alert(
                'Błąd uwierzytelniania',
                error instanceof Error ? error.message : 'Nie udało się zalogować przez Google. Sprawdź połączenie internetowe i spróbuj ponownie.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = () => {
        setShowEmailForm(true);
    };

    const handleEmailSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Błąd', 'Proszę wprowadź adres email');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Błąd', 'Proszę wprowadź prawidłowy adres email');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Błąd', 'Proszę wprowadź hasło');
            return;
        }

        if (!isLoginMode && password.length < 8) {
            Alert.alert('Błąd', 'Hasło musi mieć co najmniej 8 znaków');
            return;
        }

        setIsLoading(true);

        try {
            if (isLoginMode) {
                // Handle login
                const apiUrl = getApiUrl();
                console.log('🔗 Using API URL:', apiUrl);

                const response = await fetch(`${apiUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password: password.trim(),
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
                    throw new Error(errorData.message || 'Nieprawidłowy email lub hasło');
                }

                const authData = await response.json();
                console.log('✅ Login successful:', authData);

                // Pass login data to parent component
                onContinue({
                    email: email.trim(),
                    password: password.trim(),
                    authProvider: 'email',
                    authData: authData // Include tokens and user data
                });
            } else {
                // Handle registration (existing code)
                onContinue({
                    email: email.trim(),
                    password: password.trim(),
                    authProvider: 'email'
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Wystąpił błąd podczas uwierzytelniania';
            Alert.alert('Błąd', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { color: textColor }]}>{isLoginMode ? 'Zaloguj się' : 'Utwórz konto'}</Text>
                <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
                    {isLoginMode
                        ? 'Zaloguj się do swojego konta, aby kontynuować.'
                        : 'Twoje dane są bezpieczne. Synchronizujemy je tylko po to, by usprawnić Twoją codzienność.'
                    }
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
                        style={[styles.authButton, styles.googleButton, { backgroundColor: surfaceColor, borderColor }]}
                        onPress={handleGoogleAuth}
                        disabled={isLoading}
                    >
                        <Ionicons name="logo-google" size={24} color="#4285F4" />
                        <Text style={[styles.googleButtonText, { color: textColor }]}>Kontynuuj z Google</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                        <Text style={[styles.dividerText, { color: textSecondaryColor }]}>lub</Text>
                        <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.authButton, styles.emailButton, { backgroundColor: surfaceColor, borderColor }]}
                        onPress={handleEmailAuth}
                        disabled={isLoading}
                    >
                        <Ionicons name="mail" size={24} color={textColor} />
                        <Text style={[styles.emailButtonText, { color: textColor }]}>Kontynuuj z Email</Text>
                    </TouchableOpacity>

                    {/* Login/Register Toggle - moved outside form for better visibility */}
                    {showEmailForm && (
                        <TouchableOpacity
                            style={[styles.toggleButton, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '33' }]}
                            onPress={() => setIsLoginMode(!isLoginMode)}
                            disabled={isLoading}
                        >
                            <Text style={[styles.toggleText, { color: primaryColor }]}>
                                {isLoginMode
                                    ? 'Nie masz konta? Utwórz nowe'
                                    : 'Masz już konto? Zaloguj się'
                                }
                            </Text>
                        </TouchableOpacity>
                    )}

                    {showEmailForm && (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardAvoidingView}
                        >
                            <View style={[styles.emailForm, { backgroundColor: surfaceColor, borderColor }]}>
                                <TextInput
                                    style={[styles.emailInput, { backgroundColor, borderColor, color: textColor }]}
                                    placeholder="Wprowadź swój email"
                                    placeholderTextColor={textSecondaryColor}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoFocus
                                />
                                <TextInput
                                    style={[styles.emailInput, { backgroundColor, borderColor, color: textColor }]}
                                    placeholder="Wprowadź hasło"
                                    placeholderTextColor={textSecondaryColor}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                />
                                <View style={styles.emailFormButtons}>
                                    <TouchableOpacity
                                        style={[styles.formButton, styles.cancelButton, { backgroundColor: borderColor }]}
                                        onPress={() => {
                                            setShowEmailForm(false);
                                            setEmail('');
                                            setPassword('');
                                        }}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: textColor }]}>Anuluj</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.formButton, styles.submitButton, { backgroundColor: primaryColor }]}
                                        onPress={handleEmailSubmit}
                                        disabled={!email.trim() || !password.trim() || isLoading}
                                    >
                                        <Text style={[styles.submitButtonText, { color: onAccentColor }, (!email.trim() || !password.trim()) && styles.disabledText]}>
                                            {isLoading ? 'Przetwarzanie...' : isLoginMode ? 'Zaloguj się' : 'Kontynuuj'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.footerContainer, { backgroundColor, borderTopColor: borderColor }]}>
                <Text style={[styles.termsText, { color: textSecondaryColor }]}>
                    Kontynuując, akceptujesz nasze{' '}
                    <Text style={[styles.termsLink, { color: primaryColor }]}>Warunki korzystania</Text>
                    {' '}i{' '}
                    <Text style={[styles.termsLink, { color: primaryColor }]}>Politykę prywatności</Text>
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
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
        borderWidth: 1,
    },
    emailButton: {
        borderWidth: 1,
    },
    appleButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    emailButtonText: {
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
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 14,
    },
    termsText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    footerContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
    },
    keyboardAvoidingView: {
        flex: 0,
    },
    emailForm: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    emailInput: {
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    emailFormButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    formButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
    },
    cancelButtonText: {
        fontWeight: '600',
    },
    submitButton: {
    },
    submitButtonText: {
        fontWeight: '600',
    },
    disabledText: {
        opacity: 0.5,
    },
    toggleButton: {
        marginTop: 16,
        marginBottom: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
