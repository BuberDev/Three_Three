import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.iconSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 90 : 80,
          ...DesignSystem.elevation[3],
          borderTopLeftRadius: DesignSystem.borderRadius.xl,
          borderTopRightRadius: DesignSystem.borderRadius.xl,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.5,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dzisiaj',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="house.fill"
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: 'Nagranie',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="mic.fill"
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Sen',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="moon.fill"
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Rutyny',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="list.bullet"
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Analiza',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="brain"
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="person.circle"
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
