import React, { useRef, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { ApiService } from '../../lib/services/api';
import { getApiUrl } from '../../lib/utils/config';
import { useAppStore } from '../../stores/app-store';
import { AuthScreen } from './auth-screen';
import CompletionScreen from './completion-screen';
import { ConsentScreen } from './consent-screen';
import { IntroScreen } from './intro-screen';
import { PersonalizationScreen } from './personalization-screen';

interface SwipeableOnboardingProps {
    onComplete: () => void;
}

interface UserData {
    email?: string;
    password?: string;
    authProvider?: string;
    googleAuth?: {
        accessToken?: string;
        refreshToken?: string;
        idToken?: string;
        user?: any;
    };
    voiceProcessingConsent?: boolean;
    personalizationConsent?: boolean;
    goals: string[];
}

type AuthData = {
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
};

export const SwipeableOnboarding: React.FC<SwipeableOnboardingProps> = ({ onComplete }) => {
    const pagerRef = useRef<PagerView>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [userData, setUserData] = useState<Partial<UserData>>({});

    // Enterprise guard - prevent duplicate processing
    const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);

    // Enterprise-safe completion function
    const completeOnboardingSafely = () => {
        if (isCompletingOnboarding) {
            console.log('🔒 Onboarding completion already in progress, preventing duplicate');
            return;
        }

        // SECURITY: Double-check authentication before completing
        const { isAuthenticated, user } = useAppStore.getState();
        if (!isAuthenticated || !user) {
            console.error('🚫 SECURITY: Attempted to complete onboarding without authentication!');
            console.log('📋 Authentication required - redirecting to login screen');
            // Redirect to auth screen instead of completing
            pagerRef.current?.setPage(1);
            return;
        }

        setIsCompletingOnboarding(true);
        console.log('🎉 Onboarding completed safely - user authenticated, entering main application');

        // Use setTimeout to ensure state update and prevent rapid calls
        setTimeout(() => {
            onComplete();
        }, 100);
    };
    const { setUser, setUserSettings, setAuthenticated } = useAppStore();

    const goToNext = () => {
        const nextPage = currentPage + 1;
        if (nextPage < 5) {
            pagerRef.current?.setPage(nextPage);
            setCurrentPage(nextPage);
        }
    };

    const handleIntroComplete = () => {
        goToNext();
    };

    const applyAuthenticatedSession = async (
        tokenData: any,
        onboardingData?: Partial<UserData>,
    ) => {
        if (!tokenData?.accessToken || !tokenData?.refreshToken || !tokenData?.user) {
            console.error('❌ Invalid authentication response structure:', {
                hasAccessToken: !!tokenData?.accessToken,
                hasRefreshToken: !!tokenData?.refreshToken,
                hasUser: !!tokenData?.user,
            });
            throw new Error('Nieprawidłowa odpowiedź serwera. Spróbuj ponownie.');
        }

        const { setTokens } = useAppStore.getState();
        await setTokens(tokenData.accessToken, tokenData.refreshToken);

        const apiService = ApiService.getInstance();
        apiService.setAuthToken(tokenData.accessToken);

        setUser(tokenData.user);
        setAuthenticated(true);

        const now = new Date().toISOString();
        setUserSettings({
            id: tokenData.user.settings?.id || `${tokenData.user.id}-settings`,
            userId: tokenData.user.id,
            consentVoiceProcessing: onboardingData?.voiceProcessingConsent || false,
            consentPersonalization: onboardingData?.personalizationConsent || false,
            primaryGoals: onboardingData?.goals || [],
            createdAt: tokenData.user.settings?.createdAt || now,
            updatedAt: tokenData.user.settings?.updatedAt || now,
        });

        console.log('✅ Authenticated session stored:', {
            email: tokenData.user.email,
            userId: tokenData.user.id,
            provider: tokenData.user.authProvider,
        });
    };

    const handleAuthComplete = async (authData: AuthData) => {
        // Enterprise guard - prevent duplicate processing
        if (isProcessingAuth) {
            console.log('🔒 Auth processing already in progress, ignoring duplicate call');
            return;
        }

        setIsProcessingAuth(true);
        console.log('🔍 AuthComplete called with:', authData);

        try {
            if (authData.authData) {
                console.log('🎯 This is a LOGIN - skipping onboarding');

                try {
                    // Extract tokens and user data from nested API response structure
                    const responseData = authData.authData?.data?.data || authData.authData?.data || authData.authData;

                    await applyAuthenticatedSession(responseData);

                    // Enterprise complete onboarding - single call with guard
                    completeOnboardingSafely();
                    return;

                } catch (error) {
                    console.error('❌ Login processing failed:', error);
                    // Don't call onComplete() on error - let user try again
                    throw error;
                }
            }

            console.log('📝 This is REGISTRATION - continuing onboarding');
            // Regular registration flow
            setUserData(prev => ({ ...prev, ...authData }));
            goToNext();
        } finally {
            setIsProcessingAuth(false);
        }
    };

    const handleConsentComplete = (consents: { voiceProcessing: boolean; personalization: boolean }) => {
        setUserData(prev => ({
            ...prev,
            voiceProcessingConsent: consents.voiceProcessing,
            personalizationConsent: consents.personalization
        }));
        goToNext();
    };

    const handlePersonalizationComplete = async (goals: string[]) => {
        const finalUserData = { ...userData, goals };
        setUserData(finalUserData);

        const currentAuthState = useAppStore.getState();
        if (currentAuthState.isAuthenticated && currentAuthState.user) {
            const now = new Date().toISOString();
            setUserSettings({
                id: `${currentAuthState.user.id}-settings`,
                userId: currentAuthState.user.id,
                consentVoiceProcessing: finalUserData.voiceProcessingConsent || false,
                consentPersonalization: finalUserData.personalizationConsent || false,
                primaryGoals: finalUserData.goals || [],
                createdAt: now,
                updatedAt: now,
            });
            console.log('✅ User is already authenticated, continuing onboarding');
            goToNext();
            return;
        }

        if (!finalUserData.email) {
            console.error('❌ Missing email in onboarding data', finalUserData);
            throw new Error('Nie udało się odczytać danych logowania. Wróć do poprzedniego kroku i spróbuj ponownie.');
        }

        if (finalUserData.authProvider === 'google') {
            if (!finalUserData.googleAuth?.idToken) {
                throw new Error('Sesja Google wygasła. Wróć do poprzedniego kroku i zaloguj się ponownie.');
            }

            const response = await fetch(`${getApiUrl()}/api/auth/google/mobile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: finalUserData.googleAuth.idToken,
                    consentVoiceProcessing: finalUserData.voiceProcessingConsent || false,
                    consentPersonalization: finalUserData.personalizationConsent || false,
                    primaryGoals: finalUserData.goals || [],
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: 'pl',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `HTTP ${response.status}: ${response.statusText}`,
                }));
                throw new Error(errorData.message || 'Nie udało się zalogować przez Google.');
            }

            const authResponse = await response.json();
            const tokenData = authResponse.data?.data || authResponse.data || authResponse;
            await applyAuthenticatedSession(tokenData, finalUserData);
            goToNext();
            return;
        }

        if (!finalUserData.password) {
            console.error('❌ Missing password for email registration', finalUserData);
            throw new Error('Nie udało się odczytać hasła. Wróć do poprzedniego kroku i spróbuj ponownie.');
        }

        let registrationAttempts = 0;
        const maxRetries = 3;

        while (registrationAttempts < maxRetries) {
            try {
                registrationAttempts++;
                console.log(`🚀 Registration attempt ${registrationAttempts}/${maxRetries}...`);

                const requestBody = {
                    email: finalUserData.email.trim().toLowerCase(),
                    password: finalUserData.password,
                    authProvider: 'local',
                    consentVoiceProcessing: finalUserData.voiceProcessingConsent || false,
                    consentPersonalization: finalUserData.personalizationConsent || false,
                    primaryGoals: finalUserData.goals || [],
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: 'pl',
                };

                console.log('📤 Sending registration request:', {
                    email: requestBody.email,
                    authProvider: requestBody.authProvider,
                    consentVoiceProcessing: requestBody.consentVoiceProcessing,
                    consentPersonalization: requestBody.consentPersonalization,
                    goalsCount: requestBody.primaryGoals.length
                });

                const response = await fetch(`${getApiUrl()}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                        message: `HTTP ${response.status}: ${response.statusText}`
                    }));

                    // Handle specific error cases
                    if (response.status === 409) {
                        throw new Error('User with this email already exists. Please try logging in instead.');
                    } else if (response.status === 400) {
                        throw new Error(errorData.message || 'Invalid registration data');
                    } else if (response.status >= 500) {
                        throw new Error('Server error. Please try again later.');
                    }

                    throw new Error(errorData.message || 'Registration failed');
                }

                const authResponse = await response.json();
                console.log('✅ Registration successful:', {
                    success: authResponse.success,
                    timestamp: authResponse.timestamp,
                    hasUser: !!authResponse.data?.data?.user,
                    hasTokens: !!(authResponse.data?.data?.accessToken && authResponse.data?.data?.refreshToken)
                });

                console.log('🔍 Registration API response structure:', {
                    topLevel: Object.keys(authResponse),
                    dataLevel: authResponse.data ? Object.keys(authResponse.data) : null,
                    dataDataLevel: authResponse.data?.data ? Object.keys(authResponse.data.data) : null
                });

                const tokenData = authResponse.data?.data || authResponse.data || authResponse;
                await applyAuthenticatedSession(tokenData, finalUserData);

                console.log('✅ Enterprise registration completed successfully:', {
                    userId: tokenData.user.id,
                    email: tokenData.user.email,
                    isAuthenticated: true
                });

                // Wait a moment for state to update before proceeding
                await new Promise(resolve => setTimeout(resolve, 100));

                // Double-check authentication state was properly set
                const { isAuthenticated, user } = useAppStore.getState();
                if (!isAuthenticated || !user) {
                    console.error('⚠️ Authentication state not properly updated, retrying...');
                    throw new Error('Authentication state update failed');
                }

                console.log('✅ Authentication state confirmed:', { isAuthenticated, userEmail: user.email });

                // Success - break retry loop
                break;

            } catch (error) {
                console.error(`❌ Registration attempt ${registrationAttempts} failed:`, error instanceof Error ? error.message : 'Unknown error');

                if (registrationAttempts >= maxRetries) {
                    console.error('❌ All registration attempts exhausted');
                    // Continue to completion screen even on failure - let user know about the issue
                    // They can try again later or contact support
                    throw new Error(`Registration failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }

                // Wait before retry (exponential backoff)
                const delay = Math.pow(2, registrationAttempts) * 1000;
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        goToNext();
    };

    const handleFinalComplete = async () => {
        try {
            // GUARD: Only proceed if we're actually on the completion screen (page 4)
            if (currentPage !== 4) {
                console.log(`⚠️ handleFinalComplete called on page ${currentPage}, but should only run on page 4. Ignoring.`);
                return;
            }

            console.log('📋 Final onboarding screen reached');

            // Implement circuit breaker pattern for authentication
            const authCircuitBreaker = {
                failureCount: 0,
                threshold: 3,
                timeout: 5000, // 5 seconds
                lastFailureTime: 0,
                state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN'
            };

            const checkAuthenticationWithCircuitBreaker = async (): Promise<boolean> => {
                const now = Date.now();

                // Check if circuit is open (failed too many times)
                if (authCircuitBreaker.state === 'OPEN') {
                    if (now - authCircuitBreaker.lastFailureTime < authCircuitBreaker.timeout) {
                        console.log('🔒 Authentication circuit breaker is OPEN, skipping check');
                        return false;
                    } else {
                        authCircuitBreaker.state = 'HALF_OPEN';
                    }
                }

                try {
                    const state = useAppStore.getState();
                    const { isAuthenticated, user } = state;

                    if (isAuthenticated && user) {
                        // Reset circuit breaker on success
                        authCircuitBreaker.failureCount = 0;
                        authCircuitBreaker.state = 'CLOSED';
                        return true;
                    }

                    throw new Error('User not authenticated');
                } catch (error) {
                    authCircuitBreaker.failureCount++;
                    authCircuitBreaker.lastFailureTime = now;

                    if (authCircuitBreaker.failureCount >= authCircuitBreaker.threshold) {
                        authCircuitBreaker.state = 'OPEN';
                        console.error('🔒 Authentication circuit breaker opened due to repeated failures');
                    }

                    return false;
                }
            };

            // Try authentication check with circuit breaker
            const isAuthValid = await checkAuthenticationWithCircuitBreaker();

            if (!isAuthValid) {
                console.error('❌ Cannot complete onboarding: Authentication failed or circuit breaker open');
                console.log('📋 Redirecting to authentication screen...');
                pagerRef.current?.setPage(1);
                return;
            }

            console.log('✅ User authenticated, completing onboarding safely');
            completeOnboardingSafely();
        } catch (error) {
            console.error('❌ Failed to complete final onboarding step:', error);
            // SECURITY: Don't complete onboarding on error without authentication
            const { isAuthenticated, user } = useAppStore.getState();
            if (isAuthenticated && user) {
                console.log('✅ Error but user authenticated, completing anyway');
                completeOnboardingSafely();
            } else {
                console.error('❌ Error and user not authenticated, redirecting to auth');
                pagerRef.current?.setPage(1);
            }
        }
    }; return (
        <View style={styles.container}>
            <StatusBar
                barStyle={currentPage === 0 ? 'light-content' : 'dark-content'}
                translucent
                backgroundColor="transparent"
            />
            <PagerView
                ref={pagerRef}
                style={styles.pager}
                initialPage={0}
                scrollEnabled={false}
                onPageSelected={e => setCurrentPage(e.nativeEvent.position)}
                pageMargin={0}
            >
                {/* Page 0: Intro */}
                <View key="intro" style={styles.page}>
                    <IntroScreen onContinue={handleIntroComplete} />
                </View>

                {/* Page 1: Auth */}
                <View key="auth" style={styles.page}>
                    <AuthScreen
                        onContinue={handleAuthComplete}
                        onBack={() => pagerRef.current?.setPage(0)}
                    />
                </View>

                {/* Page 2: Consent */}
                <View key="consent" style={styles.page}>
                    <ConsentScreen
                        onContinue={handleConsentComplete}
                        onBack={() => pagerRef.current?.setPage(1)}
                    />
                </View>

                {/* Page 3: Personalization */}
                <View key="personalization" style={styles.page}>
                    <PersonalizationScreen
                        onContinue={handlePersonalizationComplete}
                        onBack={() => pagerRef.current?.setPage(2)}
                    />
                </View>

                {/* Page 4: Completion */}
                <View key="completion" style={styles.page}>
                    <CompletionScreen
                        onComplete={handleFinalComplete}
                        userName={userData.email || 'User'}
                    />
                </View>
            </PagerView>

        </View>
    );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    pager: {
        flex: 1,
    },
    page: {
        width: screenWidth,
        flex: 1,
    },
});
