import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { TaskList } from '@/components/daily/task-list';
import { ThemedText } from '@/components/themed-text';
import { VoiceRecorder } from '@/components/voice/voice-recorder';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/stores/app-store';

export default function HomeScreen() {
  const {
    tasks,
    todaysTasks,
    loadTasks,
    isProcessingVoiceNote
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTasks();
    } finally {
      setRefreshing(false);
    }
  }, [loadTasks]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.greeting}>
            {getGreeting()}!
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isProcessingVoiceNote
              ? 'Processing your thoughts...'
              : 'Ready to capture your thoughts?'
            }
          </ThemedText>
        </View>

        {/* Voice Recorder */}
        <View style={styles.recorderSection}>
          <VoiceRecorder onComplete={onRefresh} />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>
              {todaysTasks.filter(t => t.completed).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completed Today</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>
              {todaysTasks.filter(t => !t.completed).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Remaining</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>
              {tasks.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Tasks</ThemedText>
          </View>
        </View>

        {/* Today's Tasks Section */}
        <View style={styles.tasksSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Today&apos;s Tasks
          </ThemedText>
          <TaskList
            tasks={todaysTasks}
            showCompleted={true}
            emptyMessage="No tasks for today. Record a voice note to create tasks automatically!"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  greeting: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  recorderSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  tasksSection: {
    flex: 1,
    marginTop: 20,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
});
