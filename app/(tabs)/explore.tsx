import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { DailySummary } from '@/components/daily/daily-summary';
import { useAppStore } from '@/stores/app-store';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export default function DailyScreen() {
  const { todayEntry } = useAppStore();

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Daily Insights
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Track your progress and patterns
        </ThemedText>
      </View>

      <DailySummary entry={todayEntry || undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
});