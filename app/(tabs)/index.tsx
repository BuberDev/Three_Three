import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActivityModal } from '@/components/daily/quick-activity-modal';
import { TaskList } from '@/components/daily/task-list';
import { ModernButton } from '@/components/modern-button';
import { ModernCard } from '@/components/modern-card';
import { ModernView } from '@/components/modern-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, DesignSystem } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TimeOfDay } from '@/lib/types';
import { useAppStore } from '@/stores/app-store';
import { router } from 'expo-router';

export default function HomeScreen() {
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

  const getCurrentTimeOfDay = (): TimeOfDay => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) return TimeOfDay.EARLY_MORNING;
    if (hour >= 8 && hour < 12) return TimeOfDay.MORNING;
    if (hour >= 12 && hour < 17) return TimeOfDay.AFTERNOON;
    if (hour >= 17 && hour < 21) return TimeOfDay.EVENING;
    return TimeOfDay.NIGHT;
  };

  const getStreakInfo = () => {
    return progressMetrics?.streak || { current: 7, longest: 12, type: 'daily_logging' };
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'record':
        router.push('/voice');
        break;
      case 'add-task':
        Alert.alert('Dodaj zadanie', 'Ta funkcja zostanie wkrótce dodana');
        break;
      case 'plan-now':
        Alert.alert('Co planujesz?', 'Ta funkcja zostanie wkrótce dodana');
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
            { text: 'Nagraj podsumowanie', onPress: () => router.push('/voice') }
          ]
        );
        break;
    }
  };

  return (
    <ModernView style={{ flex: 1 }}>
      <StatusBar style="auto" />

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
            colors={DesignSystem.gradients.primary.colors}
            locations={DesignSystem.gradients.primary.locations}
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

        {/* Quick Actions */}
        <ModernCard
          gradient
          elevation={2}
          style={{ marginBottom: DesignSystem.spacing.xl }}
        >
          <ThemedText
            variant="titleLarge"
            style={{ marginBottom: DesignSystem.spacing.lg }}
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
              title="Szybka aktywność"
              variant="ghost"
              size="medium"
              leftIcon={<IconSymbol name="clock" size={16} color={colors.primary} />}
              onPress={() => handleQuickAction('quick-activity')}
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
          elevation={2}
          style={{ marginBottom: DesignSystem.spacing.xl }}
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
          elevation={2}
          style={{ marginBottom: DesignSystem.spacing.xl }}
        >
          {getTodaysActivityCount() > 0 ? (
            <View>
              <View style={{
                flexDirection: 'row',
                gap: DesignSystem.spacing.md,
                marginBottom: DesignSystem.spacing.lg,
              }}>
                <ModernView
                  variant="surfaceSecondary"
                  borderRadius="lg"
                  padding="md"
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <IconSymbol name="clock" size={24} color={colors.primary} />
                  <ThemedText
                    variant="titleMedium"
                    style={{ marginTop: DesignSystem.spacing.xs, fontWeight: '600' }}
                  >
                    {getTodaysActivityCount()}
                  </ThemedText>
                  <ThemedText variant="bodySmall" color="secondary">
                    Aktywności
                  </ThemedText>
                </ModernView>

                <ModernView
                  variant="surfaceSecondary"
                  borderRadius="lg"
                  padding="md"
                  style={{ flex: 1, alignItems: 'center' }}
                >
                  <IconSymbol name="battery.100" size={24} color={colors.primary} />
                  <ThemedText
                    variant="titleMedium"
                    style={{ marginTop: DesignSystem.spacing.xs, fontWeight: '600' }}
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
                    variant="titleSmall"
                    style={{ marginBottom: DesignSystem.spacing.md }}
                  >
                    Główne aktywności
                  </ThemedText>
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: DesignSystem.spacing.sm,
                  }}>
                    {dailyMetrics.topTags.slice(0, 4).map((tagInfo, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: colors.backgroundTertiary,
                          paddingHorizontal: DesignSystem.spacing.md,
                          paddingVertical: DesignSystem.spacing.sm,
                          borderRadius: DesignSystem.borderRadius.lg,
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
              paddingVertical: DesignSystem.spacing.xl,
            }}>
              <View style={{
                backgroundColor: colors.backgroundTertiary,
                borderRadius: DesignSystem.borderRadius.full,
                padding: DesignSystem.spacing.lg,
                marginBottom: DesignSystem.spacing.lg,
              }}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={32} color={colors.iconSecondary} />
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
          elevation={2}
        >
          {(recommendations && recommendations.length > 0) ? (
            <View style={{ gap: DesignSystem.spacing.md }}>
              {recommendations.slice(0, 3).map((recommendation, index) => (
                <ModernView
                  key={index}
                  variant="surfaceSecondary"
                  borderRadius="lg"
                  padding="md"
                  style={{ borderLeftWidth: 3, borderLeftColor: colors.primary }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: DesignSystem.spacing.sm,
                  }}>
                    <IconSymbol name="brain" size={16} color={colors.primary} />
                    <ThemedText
                      variant="titleSmall"
                      style={{ marginLeft: DesignSystem.spacing.sm, flex: 1 }}
                    >
                      {recommendation.title}
                    </ThemedText>
                  </View>
                  <ThemedText
                    variant="bodyMedium"
                    style={{ marginBottom: DesignSystem.spacing.xs }}
                  >
                    {recommendation.description}
                  </ThemedText>
                  <ThemedText variant="bodySmall" color="tertiary">
                    Dlaczego: {recommendation.reason}
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
    </ModernView>
  );
}