import React, { useState } from 'react';
import { View } from 'react-native';
import { useAppStore } from '../../stores/app-store';
import { AuthScreen } from './auth-screen';
import CompletionScreen from './completion-screen';
import { ConsentScreen } from './consent-screen';
import { IntroScreen } from './intro-screen';
import { PersonalizationScreen } from './personalization-screen';

interface OnboardingFlowProps {
    onComplete: () => void;
}

type OnboardingStep = 'intro' | 'auth' | 'consent' | 'personalization' | 'completion';

interface UserData {
    email: string;
    authProvider: string;
    voiceProcessingConsent: boolean;
    personalizationConsent: boolean;
    goals: string[];
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro');
    const [userData, setUserData] = useState<Partial<UserData>>({});
    const { setUser, setUserSettings, setAuthenticated } = useAppStore();

    const handleIntroComplete = () => {
        setCurrentStep('auth');
    };

    const handleAuthComplete = (authData: { email: string; authProvider: string }) => {
        setUserData(prev => ({ ...prev, ...authData }));
        setCurrentStep('consent');
    };

    const handleConsentComplete = (consents: { voiceProcessing: boolean; personalization: boolean }) => {
        setUserData(prev => ({
            ...prev,
            voiceProcessingConsent: consents.voiceProcessing,
            personalizationConsent: consents.personalization
        }));
        setCurrentStep('personalization');
    };

    const handlePersonalizationComplete = async (goals: string[]) => {
        const finalUserData = { ...userData, goals };
        setUserData(finalUserData);

        try {
            // Create user object
            const user = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
                email: finalUserData.email!,
                authProvider: finalUserData.authProvider!,
                isOnboardingCompleted: false, // Will be set to true in completion
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Create user settings
            const userSettings = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
                userId: user.id,
                consentVoiceProcessing: finalUserData.voiceProcessingConsent!,
                consentPersonalization: finalUserData.personalizationConsent!,
                primaryGoals: finalUserData.goals,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to store but don't complete onboarding yet
            setUser(user);
            setUserSettings(userSettings);
            setAuthenticated(true);

            // Move to completion screen
            setCurrentStep('completion');
        } catch (error) {
            console.error('Error completing personalization:', error);
        }
    };

    const handleFinalCompletion = async () => {
        // Mark onboarding as complete and navigate to main app
        try {
            console.log('✅ Onboarding marked as complete');
            onComplete();
        } catch (error) {
            console.error('Error marking onboarding as complete:', error);
            onComplete(); // Continue anyway
        }
    };

    const handleBack = () => {
        switch (currentStep) {
            case 'auth':
                setCurrentStep('intro');
                break;
            case 'consent':
                setCurrentStep('auth');
                break;
            case 'personalization':
                setCurrentStep('consent');
                break;
            case 'completion':
                setCurrentStep('personalization');
                break;
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {currentStep === 'intro' && (
                <IntroScreen onContinue={handleIntroComplete} />
            )}

            {currentStep === 'auth' && (
                <AuthScreen
                    onContinue={handleAuthComplete}
                    onBack={handleBack}
                />
            )}

            {currentStep === 'consent' && (
                <ConsentScreen
                    onContinue={handleConsentComplete}
                    onBack={handleBack}
                />
            )}

            {currentStep === 'personalization' && (
                <PersonalizationScreen
                    onContinue={handlePersonalizationComplete}
                    onBack={handleBack}
                />
            )}

            {currentStep === 'completion' && (
                <CompletionScreen
                    onComplete={handleFinalCompletion}
                    userName={userData.email?.split('@')[0] || ''}
                />
            )}
        </View>
    );
};