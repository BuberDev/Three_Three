import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { SwipeableOnboarding } from '@/components/onboarding/swipeable-onboarding';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { stripeManager } from '@/lib/services/stripe-manager';
import { useAppStore } from '@/stores/app-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { initialize, isOnboarding, isAuthenticated, user, setOnboardingComplete } = useAppStore();

  useEffect(() => {
    // Debug color scheme for troubleshooting
    console.log('🎨 RootLayout colorScheme:', {
      scheme: colorScheme,
      textColor: colors.text,
      backgroundColor: colors.background,
      platform: require('react-native').Platform.OS
    });
  }, [colorScheme, colors.text, colors.background]);

  useEffect(() => {
    // Initialize the app store and services
    const initializeApp = async () => {
      try {
        // Initialize Stripe first
        await stripeManager.initialize();
        console.log('✅ Stripe initialized in app layout');

        // Then initialize app store
        initialize();
      } catch (error) {
        console.error('❌ Failed to initialize app services:', error);
        // Still initialize the app even if Stripe fails
        initialize();
      }
    };

    initializeApp();
  }, [initialize]);

  const handleOnboardingComplete = () => {
    setOnboardingComplete();
  };

  // Create custom theme based on our design system - use proper React Navigation theme structure
  const customTheme = colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  // CRITICAL: Niezalogowany user ZAWSZE musi przejść przez onboarding/auth!
  // Tylko zalogowany user może ominąć onboarding
  if (isOnboarding || !isAuthenticated || !user) {
    return <SwipeableOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider value={customTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="subscription"
              options={{
                title: 'Subskrypcja',
                presentation: 'modal',
                headerBackTitle: 'Wstecz'
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
