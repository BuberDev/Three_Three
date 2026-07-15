import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactStats } from '@/components/compact-stats';
import { AddTaskModal } from '@/components/daily/add-task-modal';
import { PlanningModal } from '@/components/daily/planning-modal';
import { QuickActivityModal } from '@/components/daily/quick-activity-modal';
import { TaskList } from '@/components/daily/task-list';
import { ModernButton } from '@/components/modern-button';
import { ModernCard } from '@/components/modern-card';
import { ModernView } from '@/components/modern-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/stores/app-store';
import { useNavigation } from '@react-navigation/native';
import { SubscriptionGate } from '@/components/subscription/subscription-gate';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const {
    todaysTasks,
    loadTasks,
    recommendations,
    todayEntry,
    todaysActivities,
    dailyMetrics,
    progressMetrics,
    loadActivities,
    loadDailyMetrics,
    loadProgressMetrics,
    generatePersonalizedRecommendations
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [showQuickActivityModal, setShowQuickActivityModal] = React.useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);
  const [showPlanningModal, setShowPlanningModal] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const store = useAppStore.getState();
      await Promise.all([
        store.loadTasks(),
        store.loadActivities(),
        store.loadDailyMetrics(),
        store.loadProgressMetrics(),
        store.generatePersonalizedRecommendations()
      ]);
    } catch (error) {
      console.log('Refresh failed, using cached data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    // Dane są już ładowane przez initialize w _layout.tsx
    // Tu tylko odświeżamy jeśli jest użytkownik
    const refreshData = async () => {
      const { user } = useAppStore.getState();
      if (user) {
        try {
          await Promise.all([
            loadTasks(),
            loadActivities(),
            loadDailyMetrics(),
            loadProgressMetrics(),
            generatePersonalizedRecommendations()
          ]);
        } catch (error) {
          console.log('Data refresh failed, using cached data');
        }
      }
    };

    // Opóźnij odświeżenie o chwilę, żeby dać czas initialize
    const timer = setTimeout(refreshData, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getDateString = () => {
    const today = new Date();
    return today.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const getDayProgress = () => {
    if (!todaysTasks || todaysTasks.length === 0) return 0;
    const completed = todaysTasks.filter(t => t.completed).length;
    return Math.round((completed / todaysTasks.length) * 100);
  };

  const getProductivityScore = () => {
    return dailyMetrics?.productivityScore || progressMetrics?.trends?.productivity?.[6] || 75;
  };

  const getTodaysActivityCount = () => {
    return todaysActivities?.length || dailyMetrics?.totalActivities || 0;
  };

  const getAverageEnergyLevel = () => {
    return dailyMetrics?.averageEnergyLevel || 4;
  };


  const getStreakInfo = () => {
    return progressMetrics?.streak || { current: 7, longest: 12, type: 'daily_logging' };
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'record':
        navigation.navigate('Voice');
        break;
      case 'add-task':
        setShowAddTaskModal(true);
        break;
      case 'plan-now':
        setShowPlanningModal(true);
        break;
      case 'quick-activity':
        setShowQuickActivityModal(true);
        break;
      case 'daily-review':
        Alert.alert(
          'Podsumowanie dnia',
          'Opowiedz mi, co dzisiaj osiągnąłeś i jak się czujesz.',
          [
            { text: 'Anuluj', style: 'cancel' },
            { text: 'Nagraj podsumowanie', onPress: () => navigation.navigate('Voice') }
          ]
        );
        break;
    }
  };

  return (
    <SubscriptionGate
      feature="start_screen"
      screenTitle="Ekran główny"
    >
    <ModernView style={{ flex: 1 }}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: DesignSystem.spacing.lg,
          paddingTop: insets.top + DesignSystem.spacing.lg,
          paddingBottom: DesignSystem.spacing['4xl'],
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Hero Section */}
        <View style={{ marginBottom: DesignSystem.spacing['3xl'] }}>
          <ThemedText variant="displaySmall" style={{ marginBottom: DesignSystem.spacing.xs }}>
            {getDateString()}
          </ThemedText>

          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryLight] as readonly [string, string, ...string[]]}
            locations={[0, 1] as readonly [number, number, ...number[]]}
            start={DesignSystem.gradients.primary.start}
            end={DesignSystem.gradients.primary.end}
            style={{
              marginTop: DesignSystem.spacing.lg,
              borderRadius: DesignSystem.borderRadius['2xl'],
              padding: DesignSystem.spacing.xl,
              ...DesignSystem.elevation[3],
            }}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: DesignSystem.spacing.lg
            }}>
              <View>
                <ThemedText
                  variant="titleLarge"
                  lightColor="rgba(255,255,255,0.9)"
                  darkColor="rgba(255,255,255,0.9)"
                  style={{ marginBottom: DesignSystem.spacing.xs }}
                >
                  Dzisiejszy postęp
                </ThemedText>
                <ThemedText
                  variant="bodyMedium"
                  lightColor="rgba(255,255,255,0.7)"
                  darkColor="rgba(255,255,255,0.7)"
                >
                  {(todaysTasks?.filter(t => t.completed).length || 0)} z {todaysTasks?.length || 0} zadań
                </ThemedText>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: DesignSystem.borderRadius.full,
                padding: DesignSystem.spacing.md,
              }}>
                <ThemedText
                  variant="headlineMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '700' }}
                >
                  {getDayProgress()}%
                </ThemedText>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={{
              height: 6,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: DesignSystem.borderRadius.full,
              marginBottom: DesignSystem.spacing.lg,
            }}>
              <View
                style={{
                  height: '100%',
                  width: `${getDayProgress()}%`,
                  backgroundColor: 'white',
                  borderRadius: DesignSystem.borderRadius.full,
                }}
              />
            </View>

            {/* Stats Row */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText
                  variant="titleMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '600' }}
                >
                  {getProductivityScore()}
                </ThemedText>
                <ThemedText
                  variant="bodySmall"
                  lightColor="rgba(255,255,255,0.8)"
                  darkColor="rgba(255,255,255,0.8)"
                >
                  Produktywność
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText
                  variant="titleMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '600' }}
                >
                  {getStreakInfo().current}
                </ThemedText>
                <ThemedText
                  variant="bodySmall"
                  lightColor="rgba(255,255,255,0.8)"
                  darkColor="rgba(255,255,255,0.8)"
                >
                  Dni z rzędu
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText
                  variant="titleMedium"
                  lightColor="white"
                  darkColor="white"
                  style={{ fontWeight: '600' }}
                >
                  {getTodaysActivityCount()}
                </ThemedText>
                <ThemedText
                  variant="bodySmall"
                  lightColor="rgba(255,255,255,0.8)"
                  darkColor="rgba(255,255,255,0.8)"
                >
                  Aktywności
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Compact Stats Overview */}
        <View style={{
          flexDirection: 'row',
          gap: DesignSystem.spacing.sm,
          marginBottom: DesignSystem.spacing.md,
        }}>
          <CompactStats
            title="Wszystkie"
            count={todaysTasks?.length || 0}
            icon="list.bullet"
            showPreview={true}
            previewItems={todaysTasks?.slice(0, 3).map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed
            })) || []}
          />
          <CompactStats
            title="Dzisiaj"
            count={todaysTasks?.length || 0}
            icon="clock"
            showPreview={true}
            previewItems={todaysTasks?.slice(0, 3).map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed
            })) || []}
          />
          <CompactStats
            title="Do zrobienia"
            count={todaysTasks?.filter(t => !t.completed).length || 0}
            icon="circle"
            showPreview={true}
            previewItems={todaysTasks?.filter(t => !t.completed).slice(0, 3).map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed
            })) || []}
          />
        </View>

        {/* Quick Actions */}
        <ModernCard
          gradient
          elevation={2}
          padding="md"
          style={{
            marginBottom: DesignSystem.spacing.md
          }}
        >
          <ThemedText
            variant="titleMedium"
            style={{ marginBottom: DesignSystem.spacing.md }}
          >
            Szybkie akcje
          </ThemedText>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: DesignSystem.spacing.md,
          }}>
            <ModernButton
              title="Nagraj"
              size="medium"
              leftIcon={<IconSymbol name="mic.fill" size={16} color="white" />}
              onPress={() => handleQuickAction('record')}
              style={{ flex: 1, minWidth: '45%' }}
            />
            <ModernButton
              title="Dodaj zadanie"
              variant="secondary"
              size="medium"
              leftIcon={<IconSymbol name="plus" size={16} color={colors.primary} />}
              onPress={() => handleQuickAction('add-task')}
              style={{ flex: 1, minWidth: '45%' }}
            />
            <ModernButton
              title="Planuj dzień"
              variant="ghost"
              size="medium"
              leftIcon={<IconSymbol name="calendar" size={16} color={colors.primary} />}
              onPress={() => handleQuickAction('plan-now')}
              style={{ flex: 1, minWidth: '45%' }}
            />
            <ModernButton
              title="Przegląd dnia"
              variant="ghost"
              size="medium"
              leftIcon={<IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={colors.primary} />}
              onPress={() => handleQuickAction('daily-review')}
              style={{ flex: 1, minWidth: '45%' }}
            />
          </View>
        </ModernCard>

        {/* Today's Tasks */}
        <ModernCard
          title="Dzisiejsze zadania"
          elevation={1}
          padding="md"
          style={{
            marginBottom: DesignSystem.spacing.md
          }}
        >
          <TaskList
            tasks={todaysTasks || []}
            showCompleted={true}
            emptyMessage="Brak zadań na dziś. Nagraj notatkę głosową, aby automatycznie utworzyć zadania!"
          />
        </ModernCard>

        {/* Today's Activities */}
        <ModernCard
          title="Dzisiejsze aktywności"
          elevation={1}
          padding="md"
          style={{
            marginBottom: DesignSystem.spacing.lg
          }}
        >
          {getTodaysActivityCount() > 0 ? (
            <View>
              <View style={{
                flexDirection: 'row',
                gap: DesignSystem.spacing.sm,
                marginBottom: DesignSystem.spacing.md,
              }}>
                <ModernView
                  variant="surfaceSecondary"
                  borderRadius="md"
                  padding="sm"
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <IconSymbol name="clock" size={20} color={colors.primary} />
                  <ThemedText
                    variant="titleSmall"
                    style={{ marginTop: DesignSystem.spacing.xs / 2, fontWeight: '600' }}
                  >
                    {getTodaysActivityCount()}
                  </ThemedText>
                  <ThemedText variant="bodySmall" color="secondary">
                    Aktywności
                  </ThemedText>
                </ModernView>

                <ModernView
                  variant="surfaceSecondary"
                  borderRadius="md"
                  padding="sm"
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <IconSymbol name="battery.100" size={20} color={colors.primary} />
                  <ThemedText
                    variant="titleSmall"
                    style={{ marginTop: DesignSystem.spacing.xs / 2, fontWeight: '600' }}
                  >
                    {getAverageEnergyLevel()}/5
                  </ThemedText>
                  <ThemedText variant="bodySmall" color="secondary">
                    Energia
                  </ThemedText>
                </ModernView>
              </View>

              {dailyMetrics?.topTags && (
                <View>
                  <ThemedText
                    variant="bodyMedium"
                    style={{ marginBottom: DesignSystem.spacing.sm }}
                  >
                    Główne aktywności
                  </ThemedText>
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: DesignSystem.spacing.xs,
                  }}>
                    {dailyMetrics.topTags.slice(0, 4).map((tagInfo, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: colors.backgroundTertiary,
                          paddingHorizontal: DesignSystem.spacing.sm,
                          paddingVertical: DesignSystem.spacing.xs,
                          borderRadius: DesignSystem.borderRadius.md,
                        }}
                      >
                        <ThemedText variant="bodySmall" color="secondary">
                          {tagInfo.tag} ({tagInfo.count})
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: DesignSystem.spacing.lg,
            }}>
              <View style={{
                backgroundColor: colors.backgroundTertiary,
                borderRadius: DesignSystem.borderRadius.full,
                padding: DesignSystem.spacing.md,
                marginBottom: DesignSystem.spacing.md,
              }}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.iconSecondary} />
              </View>
              <ThemedText
                variant="bodyLarge"
                color="secondary"
                style={{
                  textAlign: 'center',
                  marginBottom: DesignSystem.spacing.lg
                }}
              >
                Nagrywaj notatki, aby automatycznie śledzić swoje aktywności
              </ThemedText>
              <ModernButton
                title="Dodaj pierwszą aktywność"
                variant="secondary"
                size="medium"
                onPress={() => handleQuickAction('quick-activity')}
              />
            </View>
          )}
        </ModernCard>

        {/* AI Recommendations */}
        <ModernCard
          title="Rekomendacje AI"
          elevation={1}
          padding="md"
          style={{
            marginBottom: DesignSystem.spacing.lg
          }}
        >
          {(recommendations && recommendations.length > 0) ? (
            <View style={{ gap: DesignSystem.spacing.sm }}>
              {recommendations.slice(0, 3).map((recommendation, index) => (
                <ModernView
                  key={index}
                  variant="surfaceSecondary"
                  borderRadius="md"
                  padding="sm"
                  style={{ borderLeftWidth: 2, borderLeftColor: colors.primary }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: DesignSystem.spacing.xs,
                  }}>
                    <IconSymbol name="brain" size={14} color={colors.primary} />
                    <ThemedText
                      variant="bodyMedium"
                      style={{ marginLeft: DesignSystem.spacing.xs, flex: 1, fontWeight: '500' }}
                    >
                      {recommendation.title}
                    </ThemedText>
                  </View>
                  <ThemedText
                    variant="bodySmall"
                    style={{ marginBottom: DesignSystem.spacing.xs / 2 }}
                  >
                    {recommendation.description}
                  </ThemedText>
                  <ThemedText variant="bodySmall" color="tertiary">
                    {recommendation.reason}
                  </ThemedText>
                </ModernView>
              ))}
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: DesignSystem.spacing.xl,
            }}>
              <View style={{
                backgroundColor: colors.backgroundTertiary,
                borderRadius: DesignSystem.borderRadius.full,
                padding: DesignSystem.spacing.lg,
                marginBottom: DesignSystem.spacing.lg,
              }}>
                <IconSymbol name="brain" size={32} color={colors.iconSecondary} />
              </View>
              <ThemedText
                variant="bodyLarge"
                color="secondary"
                style={{ textAlign: 'center' }}
              >
                Rekomendacje AI pojawią się po zebraniu więcej danych
              </ThemedText>
            </View>
          )}
        </ModernCard>
      </ScrollView>

      <QuickActivityModal
        visible={showQuickActivityModal}
        onClose={() => setShowQuickActivityModal(false)}
      />

      <AddTaskModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSave={(taskData) => {
          // Handle task saving logic here
          console.log('New task created:', taskData);
          // You can add this to your task store/API call
        }}
      />

      <PlanningModal
        visible={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
        onSave={(planningData) => {
          // Handle planning data saving logic here
          console.log('Day plan created:', planningData);
          // You can integrate this with your daily planning system
        }}
      />
    </ModernView>
    </SubscriptionGate>
  );
}