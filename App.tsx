import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/error-boundary';
import { SwipeableOnboarding } from '@/components/onboarding/swipeable-onboarding';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { stripeManager } from '@/lib/services/stripe-manager';
import { useAppStore } from '@/stores/app-store';
import { TabNavigator } from '@/navigation/TabNavigator';

import ModalScreen from '@/app/modal';
import SubscriptionScreen from '@/app/subscription';

export type RootStackParamList = {
  Tabs: undefined;
  Modal: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['threethree://'],
};

export default function App() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { initialize, isOnboarding, isAuthenticated, user, setOnboardingComplete } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await stripeManager.initialize();
        console.log('✅ Stripe initialized in app layout');
        initialize();
      } catch (error) {
        console.error('❌ Failed to initialize app services:', error);
        initialize();
      }
    };

    initializeApp();
  }, [initialize]);

  const handleOnboardingComplete = () => {
    setOnboardingComplete();
  };

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
    return (
      <SafeAreaProvider>
        <SwipeableOnboarding onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer theme={customTheme} linking={linking}>
          <Stack.Navigator>
            <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Modal" component={ModalScreen} options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{
                title: 'Subskrypcja',
                presentation: 'modal',
                headerBackTitle: 'Wstecz',
              }}
            />
          </Stack.Navigator>
          <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
