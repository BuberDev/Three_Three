import { useAppStore } from '@/stores/app-store';
import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';

export interface NotificationSettings {
    enabled: boolean;
    pushEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    categories: {
        tasks: boolean;
        sleep: boolean;
        voice: boolean;
        ai: boolean;
        general: boolean;
    };
}

export interface LocalNotification {
    id: string;
    title: string;
    body: string;
    category: keyof NotificationSettings['categories'];
    scheduledAt?: Date;
    data?: Record<string, any>;
}

const DEFAULT_CHANNEL_ID = 'default';

export class NotificationService {
    private static instance: NotificationService;
    private isInitialized = false;

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Sprawdza czy powiadomienia są włączone w ustawieniach
     */
    private areNotificationsEnabled(): boolean {
        const userSettings = useAppStore.getState().userSettings;
        return userSettings?.notificationsEnabled ?? true;
    }

    /**
     * Sprawdza czy push powiadomienia są włączone
     */
    private arePushNotificationsEnabled(): boolean {
        const userSettings = useAppStore.getState().userSettings;
        return userSettings?.pushNotifications ?? false;
    }

    /**
     * Inicjalizuje serwis powiadomień
     */
    async initialize(): Promise<boolean> {
        try {
            console.log('📢 Initializing notification service...');

            if (!this.areNotificationsEnabled()) {
                console.log('📢 Notifications disabled in settings');
                return false;
            }

            // Android requires a channel for any notification to display
            await notifee.createChannel({
                id: DEFAULT_CHANNEL_ID,
                name: 'Default Channel',
                importance: AndroidImportance.DEFAULT,
            });

            this.isInitialized = true;
            console.log('✅ Notification service initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
            return false;
        }
    }

    /**
     * Żądanie uprawnień do push powiadomień
     */
    async requestPushPermissions(): Promise<boolean> {
        try {
            if (!this.areNotificationsEnabled() || !this.arePushNotificationsEnabled()) {
                console.log('📢 Push notifications disabled in settings');
                return false;
            }

            const settings = await notifee.requestPermission();
            return settings.authorizationStatus >= 1;
        } catch (error) {
            console.error('❌ Error requesting push permissions:', error);
            return false;
        }
    }

    /**
     * Wyślij lokalne powiadomienie
     */
    async sendLocalNotification(notification: LocalNotification): Promise<boolean> {
        try {
            if (!this.areNotificationsEnabled()) {
                console.log(`📢 Notification blocked by settings: ${notification.title}`);
                return false;
            }

            console.log(`📢 Sending notification: ${notification.title} - ${notification.body}`);

            if (notification.scheduledAt) {
                const trigger: TimestampTrigger = {
                    type: TriggerType.TIMESTAMP,
                    timestamp: notification.scheduledAt.getTime(),
                };
                await notifee.createTriggerNotification(
                    {
                        id: notification.id,
                        title: notification.title,
                        body: notification.body,
                        data: notification.data,
                        android: { channelId: DEFAULT_CHANNEL_ID },
                    },
                    trigger
                );
            } else {
                await notifee.displayNotification({
                    id: notification.id,
                    title: notification.title,
                    body: notification.body,
                    data: notification.data,
                    android: { channelId: DEFAULT_CHANNEL_ID },
                });
            }

            return true;
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            return false;
        }
    }

    /**
     * Zaplanuj powiadomienie o zadaniu
     */
    async scheduleTaskReminder(taskTitle: string, scheduledTime: Date): Promise<boolean> {
        return this.sendLocalNotification({
            id: `task_${Date.now()}`,
            title: 'Przypomnienie o zadaniu',
            body: `Czas na: ${taskTitle}`,
            category: 'tasks',
            scheduledAt: scheduledTime,
        });
    }

    /**
     * Wyślij powiadomienie o sesji snu
     */
    async notifySleepSession(message: string): Promise<boolean> {
        return this.sendLocalNotification({
            id: `sleep_${Date.now()}`,
            title: 'Sesja snu',
            body: message,
            category: 'sleep',
        });
    }

    /**
     * Wyślij powiadomienie o notatce głosowej
     */
    async notifyVoiceNote(message: string): Promise<boolean> {
        return this.sendLocalNotification({
            id: `voice_${Date.now()}`,
            title: 'Notatka głosowa',
            body: message,
            category: 'voice',
        });
    }

    /**
     * Wyślij powiadomienie od AI
     */
    async notifyAI(message: string): Promise<boolean> {
        return this.sendLocalNotification({
            id: `ai_${Date.now()}`,
            title: 'AI Asystent',
            body: message,
            category: 'ai',
        });
    }

    /**
     * Zaplanuj przypomnienie o nawyku
     */
    async scheduleHabitReminder(habitName: string, reminderSettings: { time: string; days?: number[] }): Promise<boolean> {
        if (!this.areNotificationsEnabled()) {
            console.log('📢 Notifications disabled, skipping habit reminder');
            return false;
        }

        const [hours, minutes] = reminderSettings.time.split(':').map(Number);
        const days = reminderSettings.days || [1, 2, 3, 4, 5, 6, 0]; // Default to daily

        try {
            // Schedule notification for each day of the week
            for (const day of days) {
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, minutes, 0, 0);

                // If the time has passed today, schedule for next occurrence
                if (scheduledDate.getTime() <= Date.now()) {
                    scheduledDate.setDate(scheduledDate.getDate() + 1);
                }

                // Find the next occurrence of this day
                while (scheduledDate.getDay() !== day) {
                    scheduledDate.setDate(scheduledDate.getDate() + 1);
                }

                await this.sendLocalNotification({
                    id: `habit_${habitName}_${day}_${Date.now()}`,
                    title: 'Przypomnienie o nawyku',
                    body: `Czas na: ${habitName}`,
                    category: 'general',
                    scheduledAt: scheduledDate,
                });
            }

            console.log(`📢 Habit reminders scheduled for: ${habitName}`);
            return true;
        } catch (error) {
            console.error('❌ Error scheduling habit reminder:', error);
            return false;
        }
    }

    /**
     * Anuluj przypomnienia dla konkretnego nawyku
     */
    async cancelHabitReminders(habitName: string): Promise<void> {
        try {
            const scheduledIds = await notifee.getTriggerNotificationIds();
            const habitNotificationIds = scheduledIds.filter(id => id.startsWith(`habit_${habitName}`));

            for (const id of habitNotificationIds) {
                await notifee.cancelNotification(id);
            }

            console.log(`📢 Cancelled ${habitNotificationIds.length} habit reminders for: ${habitName}`);
        } catch (error) {
            console.error('❌ Error cancelling habit reminders:', error);
        }
    }

    /**
     * Anuluj wszystkie zaplanowane powiadomienia
     */
    async cancelAllNotifications(): Promise<void> {
        try {
            await notifee.cancelAllNotifications();
            console.log('📢 All notifications cancelled');
        } catch (error) {
            console.error('❌ Error cancelling notifications:', error);
        }
    }

    /**
     * Wyczyść badge aplikacji
     */
    async clearBadge(): Promise<void> {
        try {
            await notifee.setBadgeCount(0);
            console.log('📢 Badge cleared');
        } catch (error) {
            console.error('❌ Error clearing badge:', error);
        }
    }

    /**
     * Sprawdź czy serwis jest zainicjalizowany
     */
    isReady(): boolean {
        return this.isInitialized && this.areNotificationsEnabled();
    }

    /**
     * Pobierz token do push powiadomień
     *
     * Note: this was previously backed by Expo's push notification service,
     * which has no bare-RN equivalent without setting up FCM/APNs directly.
     * No caller currently consumes this token server-side, so it returns null.
     */
    async getPushToken(): Promise<string | null> {
        return null;
    }
}

export const notificationService = NotificationService.getInstance();
