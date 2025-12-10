import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DatabaseService } from '../lib/database/database';
import { ApiService } from '../lib/services/api';
import { AudioService } from '../lib/services/audio';
import { EventService } from '../lib/services/event';
import {
    Activity,
    DailyEntry,
    DailyMetrics,
    EventType,
    ProgressMetrics,
    Recommendation,
    RecordingState,
    Task,
    User,
    UserSettings,
    VoiceNote,
    WeeklyInsights
} from '../lib/types';

interface AppStore {
    // User state
    user: User | null;
    userSettings: UserSettings | null;
    isAuthenticated: boolean;

    // Voice notes state
    voiceNotes: VoiceNote[];
    currentRecording: RecordingState;
    isProcessingVoiceNote: boolean;

    // Tasks state
    tasks: Task[];
    todaysTasks: Task[];

    // Daily entry state
    todayEntry: DailyEntry | null;

    // Recommendations state
    recommendations: Recommendation[];

    // Activity tracking state
    activities: Activity[];
    todaysActivities: Activity[];
    dailyMetrics: DailyMetrics | null;
    weeklyInsights: WeeklyInsights | null;
    progressMetrics: ProgressMetrics | null;

    // UI state
    isLoading: boolean;
    error: string | null;
    isOnboarding: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setUserSettings: (settings: UserSettings) => void;
    setAuthenticated: (auth: boolean) => void;

    // Voice notes actions
    addVoiceNote: (voiceNote: VoiceNote) => void;
    updateRecordingState: (state: RecordingState) => void;
    setProcessingVoiceNote: (processing: boolean) => void;
    uploadVoiceNote: (audioUri: string) => Promise<boolean>;
    uploadVoiceNoteWithContext: (audioUri: string, context?: string) => Promise<boolean>;
    uploadSleepRecording: (sleepData: any) => Promise<boolean>;

    // Tasks actions
    addTask: (task: Task) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    toggleTaskCompletion: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    loadTasks: () => Promise<void>;

    // Activity tracking actions
    addActivity: (activity: Activity) => void;
    loadActivities: () => Promise<void>;
    loadDailyMetrics: () => Promise<void>;
    loadWeeklyInsights: () => Promise<void>;
    loadProgressMetrics: () => Promise<void>;
    generatePersonalizedRecommendations: () => Promise<void>;

    // Daily entry actions
    setTodayEntry: (entry: DailyEntry) => void;
    generateDailySummary: () => Promise<void>;

    // General actions
    initialize: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    setOnboardingComplete: () => void;
    logout: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            userSettings: null,
            isAuthenticated: false,
            voiceNotes: [],
            currentRecording: { isRecording: false, duration: 0 },
            isProcessingVoiceNote: false,
            tasks: [],
            todaysTasks: [],
            todayEntry: null,
            recommendations: [],

            // Activity tracking initial state
            activities: [],
            todaysActivities: [],
            dailyMetrics: null,
            weeklyInsights: null,
            progressMetrics: null,

            isLoading: false,
            error: null,
            isOnboarding: true,

            // User actions
            setUser: (user) => set({ user }),
            setUserSettings: (userSettings) => set({ userSettings }),
            setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

            // Voice notes actions
            addVoiceNote: (voiceNote) => {
                const { user } = get();
                set((state) => ({
                    voiceNotes: [voiceNote, ...state.voiceNotes]
                }));

                // Log voice note event
                if (user) {
                    const eventService = EventService.getInstance();
                    eventService.dispatchEvent(EventType.VOICE_NOTE_UPLOADED, user.id, {
                        voiceNoteId: voiceNote.id,
                        transcriptionLength: voiceNote.transcription?.length || 0,
                        topics: voiceNote.topics
                    });
                }
            },

            updateRecordingState: (currentRecording) => set({ currentRecording }),

            setProcessingVoiceNote: (isProcessingVoiceNote) => set({ isProcessingVoiceNote }),

            uploadVoiceNote: async (audioUri: string) => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadVoiceNote(audioUri, user.id);

                    if (response.success && response.data) {
                        // Add voice note to local state
                        addVoiceNote(response.data.voiceNote);

                        // Add extracted tasks to local state
                        const { tasks } = get();
                        const newTasks = [...response.data.extractedTasks, ...tasks];
                        set({ tasks: newTasks });

                        // Save to local database
                        const dbService = DatabaseService.getInstance();
                        await dbService.saveVoiceNote(response.data.voiceNote);

                        for (const task of response.data.extractedTasks) {
                            await dbService.createTask(task);
                        }

                        return true;
                    } else {
                        setError(response.error || 'Failed to upload voice note');
                        return false;
                    }
                } catch (error) {
                    console.error('Upload voice note error:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setProcessingVoiceNote(false);
                }
            },

            // Nowa funkcja uploadVoiceNoteWithContext
            uploadVoiceNoteWithContext: async (audioUri: string, context?: string) => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadVoiceNoteWithContext(audioUri, user.id, context);

                    if (response.success && response.data) {
                        // Add voice note to local state
                        addVoiceNote(response.data.voiceNote);

                        // Add extracted tasks and activities to local state
                        const { tasks, activities } = get();
                        const newTasks = [...response.data.extractedTasks, ...tasks];
                        const newActivities = [...(response.data.extractedActivities || []), ...activities];

                        const today = new Date();
                        const isToday = (date: Date) => date.toDateString() === today.toDateString();

                        set({
                            tasks: newTasks,
                            activities: newActivities,
                            todaysActivities: newActivities.filter(a => isToday(new Date(a.createdAt)))
                        });

                        // Save to local database
                        const dbService = DatabaseService.getInstance();
                        await dbService.saveVoiceNote(response.data.voiceNote);

                        for (const task of response.data.extractedTasks) {
                            await dbService.createTask(task);
                        }

                        return true;
                    } else {
                        setError(response.error || 'Failed to upload voice note');
                        return false;
                    }
                } catch (error) {
                    console.error('Upload voice note error:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setProcessingVoiceNote(false);
                }
            },

            uploadSleepRecording: async (sleepData: any) => {
                const { user, setError, setLoading } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setLoading(true);
                    console.log('Uploading sleep recording data:', sleepData);

                    // Here you would typically upload to your API
                    // For now, just save locally and return success
                    console.log('Sleep data would be saved locally:', sleepData);

                    // TODO: Implement proper database save when sleep_sessions table is created
                    // const dbService = DatabaseService.getInstance();
                    // await dbService.saveSleepSession(sleepData);

                    console.log('Sleep recording data saved successfully');
                    return true;
                } catch (error) {
                    console.error('Upload sleep recording error:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setLoading(false);
                }
            },

            // Tasks actions
            addTask: (task) => {
                const { user } = get();
                const isToday = (date: Date) => {
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                };

                set((state) => ({
                    tasks: [task, ...state.tasks],
                    todaysTasks: isToday(new Date()) ? [task, ...state.todaysTasks] : state.todaysTasks
                }));

                // Log task creation event
                if (user) {
                    const eventService = EventService.getInstance();
                    eventService.dispatchEvent(EventType.TASK_CREATED, user.id, {
                        taskId: task.id,
                        title: task.title,
                        priority: task.priority,
                        extractedFromVoiceNote: !!task.extractedFromVoiceNoteId
                    });
                }
            },

            updateTask: (taskId, updates) =>
                set((state) => ({
                    tasks: state.tasks.map(task =>
                        task.id === taskId ? { ...task, ...updates } : task
                    ),
                    todaysTasks: state.todaysTasks.map(task =>
                        task.id === taskId ? { ...task, ...updates } : task
                    )
                })),

            toggleTaskCompletion: async (taskId) => {
                const { tasks, updateTask } = get();
                const task = tasks.find(t => t.id === taskId);
                if (!task) return;

                const completed = !task.completed;
                updateTask(taskId, { completed });

                try {
                    const dbService = DatabaseService.getInstance();
                    await dbService.updateTaskCompletion(taskId, completed);
                } catch (error) {
                    console.error('Failed to update task in database:', error);
                }
            },

            deleteTask: async (taskId) => {
                set((state) => ({
                    tasks: state.tasks.filter(task => task.id !== taskId),
                    todaysTasks: state.todaysTasks.filter(task => task.id !== taskId)
                }));

                try {
                    const apiService = ApiService.getInstance();
                    await apiService.deleteTask(taskId);
                } catch (error) {
                    console.error('Failed to delete task:', error);
                }
            },

            loadTasks: async () => {
                const { user, setError } = get();
                if (!user) {
                    // Jeśli brak użytkownika, ustaw puste tablice
                    set({ tasks: [], todaysTasks: [] });
                    return;
                }

                try {
                    const dbService = DatabaseService.getInstance();

                    // Sprawdź czy baza jest zainicjalizowana
                    if (!dbService.isInitialized()) {
                        console.log('Database not initialized, initializing now...');
                        await dbService.initialize();
                    }

                    const tasks = await dbService.getTasksByUserId(user.id);
                    const today = new Date().toISOString().split('T')[0];
                    const todaysTasks = tasks.filter(task => {
                        const taskDate = task.dueDate?.split('T')[0];
                        return taskDate === today || !task.completed;
                    });

                    set({ tasks, todaysTasks });
                } catch (error) {
                    console.error('Failed to load tasks:', error);
                    // Nie pokazuj błędu użytkownikowi jeśli to tylko brak danych
                    set({ tasks: [], todaysTasks: [] });
                }
            },

            // Activity tracking actions
            addActivity: (activity) => {
                const today = new Date();
                const isToday = (date: Date) => date.toDateString() === today.toDateString();

                set((state) => ({
                    activities: [activity, ...state.activities],
                    todaysActivities: isToday(new Date(activity.createdAt))
                        ? [activity, ...state.todaysActivities]
                        : state.todaysActivities
                }));
            },

            loadActivities: async () => {
                const { user } = get();
                if (!user) {
                    set({ activities: [], todaysActivities: [] });
                    return;
                }

                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.getActivities(user.id);

                    if (response.success && response.data) {
                        const activities = response.data;
                        const today = new Date();
                        const isToday = (date: Date) => date.toDateString() === today.toDateString();
                        const todaysActivities = activities.filter(activity =>
                            isToday(new Date(activity.createdAt))
                        );

                        set({ activities, todaysActivities });
                    }
                } catch (error) {
                    console.log('Activities not available (likely in development mode)');
                    // Ustaw puste dane zamiast błędu
                    set({ activities: [], todaysActivities: [] });
                }
            }, loadDailyMetrics: async () => {
                const { user } = get();
                if (!user) {
                    set({ dailyMetrics: null });
                    return;
                }

                try {
                    const apiService = ApiService.getInstance();
                    const today = new Date().toISOString().split('T')[0];
                    const response = await apiService.getDailyMetrics(user.id, today);

                    if (response.success && response.data) {
                        set({ dailyMetrics: response.data });
                    }
                } catch (error) {
                    console.log('Daily metrics not available (likely in development mode)');
                    set({ dailyMetrics: null });
                }
            },

            loadWeeklyInsights: async () => {
                const { user } = get();
                if (!user) {
                    set({ weeklyInsights: null });
                    return;
                }

                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.getWeeklyInsights(user.id);

                    if (response.success && response.data) {
                        set({ weeklyInsights: response.data });
                    }
                } catch (error) {
                    console.log('Weekly insights not available (likely in development mode)');
                    set({ weeklyInsights: null });
                }
            },

            loadProgressMetrics: async () => {
                const { user } = get();
                if (!user) {
                    set({ progressMetrics: null });
                    return;
                }

                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.getProgressMetrics(user.id);

                    if (response.success && response.data) {
                        set({ progressMetrics: response.data });
                    }
                } catch (error) {
                    console.log('Progress metrics not available (likely in development mode)');
                    set({ progressMetrics: null });
                }
            },

            generatePersonalizedRecommendations: async () => {
                const { user } = get();
                if (!user) {
                    set({ recommendations: [] });
                    return;
                }

                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.generatePersonalizedRecommendations(user.id);

                    if (response.success && response.data) {
                        set({ recommendations: response.data });
                    }
                } catch (error) {
                    console.log('Recommendations not available (likely in development mode)');
                    set({ recommendations: [] });
                }
            },

            // Daily entry actions
            setTodayEntry: (todayEntry) => set({ todayEntry }),

            generateDailySummary: async () => {
                const { user, voiceNotes, tasks } = get();
                if (!user) return;

                try {
                    const today = new Date().toISOString().split('T')[0];
                    const todaysNotes = voiceNotes.filter(note =>
                        note.createdAt.startsWith(today)
                    );
                    const todaysTasks = tasks.filter(task =>
                        task.dueDate?.startsWith(today) || !task.completed
                    );

                    // Generate simple summary (in real app, this would use AI)
                    const completedTasks = todaysTasks.filter(t => t.completed);
                    const pendingTasks = todaysTasks.filter(t => !t.completed);

                    const autoSummary = `Today you recorded ${todaysNotes.length} voice notes, completed ${completedTasks.length} tasks, and have ${pendingTasks.length} tasks remaining.`;

                    const dailyEntry: Omit<DailyEntry, 'id'> = {
                        userId: user.id,
                        date: today,
                        autoSummary,
                        tasks: todaysTasks,
                        habits: [], // This would be populated by habit tracking
                        mood: 'neutral', // This would be extracted from voice notes
                        updatedAt: new Date().toISOString()
                    };

                    const dbService = DatabaseService.getInstance();
                    const savedEntry = await dbService.saveDailyEntry(dailyEntry);
                    set({ todayEntry: savedEntry });
                } catch (error) {
                    console.error('Failed to generate daily summary:', error);
                }
            },

            // General actions
            initialize: async () => {
                try {
                    set({ isLoading: true });

                    // Initialize services
                    const dbService = DatabaseService.getInstance();
                    await dbService.initialize();

                    const audioService = AudioService.getInstance();
                    await audioService.initialize();

                    // W trybie development, stwórz demo użytkownika jeśli nie ma zalogowanego
                    const { user, isAuthenticated } = get();
                    let currentUser = user;

                    if (!user && __DEV__) {
                        console.log('Creating demo user for development...');
                        const demoUser: User = {
                            id: 'demo-user-123',
                            email: 'demo@example.com',
                            name: 'Demo User',
                            authProvider: 'demo',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        // Dodaj demo dane
                        const demoTasks: Task[] = [
                            {
                                id: '1',
                                title: 'Przygotuj prezentację',
                                description: 'Prezentacja na spotkanie z klientem',
                                priority: 'high' as const,
                                completed: false,
                                dueDate: new Date().toISOString(),
                                category: 'work',
                                extractedFromVoiceNoteId: 'demo-note-1'
                            },
                            {
                                id: '2',
                                title: 'Trening biegowy',
                                description: '30 minut biegania w parku',
                                priority: 'medium' as const,
                                completed: true,
                                dueDate: new Date().toISOString(),
                                category: 'health'
                            },
                            {
                                id: '3',
                                title: 'Przeczytaj artykuł o AI',
                                description: 'Artykuł o najnowszych trendach w AI',
                                priority: 'low' as const,
                                completed: false,
                                category: 'learning'
                            }
                        ];

                        const demoRecommendations: Recommendation[] = [
                            {
                                id: '1',
                                userId: demoUser.id,
                                type: 'time_management' as const,
                                title: 'Zaplanuj przerwę',
                                description: 'Ostatnio pracowałeś intensywnie. Zaplanuj 15-minutową przerwę na spacer.',
                                reason: 'Analiza Twoich wzorców pracy pokazuje, że krótkie przerwy zwiększają produktywność',
                                confidence: 0.8,
                                createdAt: new Date().toISOString(),
                                dismissed: false
                            },
                            {
                                id: '2',
                                userId: demoUser.id,
                                type: 'habit_suggestion' as const,
                                title: 'Czas na trening',
                                description: 'To dobry moment na aktywność fizyczną - zwykle o tej porze masz najwięcej energii.',
                                reason: 'Twoja energia jest najwyższa między 16:00-18:00',
                                confidence: 0.9,
                                createdAt: new Date().toISOString(),
                                dismissed: false
                            }
                        ];

                        currentUser = demoUser;
                        set({
                            user: demoUser,
                            isAuthenticated: true,
                            isOnboarding: false,
                            tasks: demoTasks,
                            todaysTasks: demoTasks.filter(t => t.dueDate?.startsWith(new Date().toISOString().split('T')[0]) || !t.completed),
                            recommendations: demoRecommendations
                        });
                    }

                    // Load user data if authenticated
                    if (currentUser && (isAuthenticated || __DEV__)) {
                        // Load data gracefully - don't throw on network errors
                        const loadPromises = [
                            get().loadTasks(),
                            get().loadActivities(),
                            get().loadDailyMetrics(),
                            get().loadWeeklyInsights(),
                            get().loadProgressMetrics(),
                            get().generatePersonalizedRecommendations()
                        ];

                        // Wait for all promises but don't fail if some fail
                        const results = await Promise.allSettled(loadPromises);

                        // Log which operations failed (for debugging)
                        results.forEach((result, index) => {
                            const operations = ['loadTasks', 'loadActivities', 'loadDailyMetrics', 'loadWeeklyInsights', 'loadProgressMetrics', 'generateRecommendations'];
                            if (result.status === 'rejected') {
                                console.log(`⚠️ ${operations[index]} failed:`, result.reason?.message || 'Unknown error');
                            }
                        });

                        // Load today's entry
                        const today = new Date().toISOString().split('T')[0];
                        try {
                            const todayEntry = await dbService.getDailyEntry(currentUser.id, today);
                            if (todayEntry) {
                                set({ todayEntry });
                            } else {
                                // Stwórz przykładowy entry dla demo
                                const demoEntry: DailyEntry = {
                                    id: 'demo-entry-' + today,
                                    userId: currentUser.id,
                                    date: today,
                                    autoSummary: 'Dzisiaj masz 3 zadania do wykonania. Świetnie rozpocząłeś dzień!',
                                    tasks: [],
                                    habits: [],
                                    mood: 'positive',
                                    voiceNotesCount: 2,
                                    updatedAt: new Date().toISOString()
                                };
                                set({ todayEntry: demoEntry });
                            }
                        } catch (error) {
                            console.log('No daily entry found for today, using demo data');
                            const demoEntry: DailyEntry = {
                                id: 'demo-entry-' + today,
                                userId: currentUser.id,
                                date: today,
                                autoSummary: 'Dzisiaj masz 3 zadania do wykonania. Świetnie rozpocząłeś dzień!',
                                tasks: [],
                                habits: [],
                                mood: 'positive',
                                voiceNotesCount: 2,
                                updatedAt: new Date().toISOString()
                            };
                            set({ todayEntry: demoEntry });
                        }
                    }

                } catch (error) {
                    console.error('App initialization failed:', error);
                    // Nie pokazuj błędu użytkownikowi w development
                    if (!__DEV__) {
                        set({ error: 'Failed to initialize app' });
                    }
                } finally {
                    set({ isLoading: false });
                }
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),
            setOnboardingComplete: () => set((state) => ({
                ...state,
                user: state.user ? { ...state.user, isOnboardingCompleted: true } : null,
                isOnboarding: false
            })),

            logout: async () => {
                try {
                    // Clear auth token
                    const apiService = ApiService.getInstance();
                    apiService.setAuthToken('');

                    // Reset app state
                    set({
                        user: null,
                        userSettings: null,
                        isAuthenticated: false,
                        voiceNotes: [],
                        tasks: [],
                        todaysTasks: [],
                        todayEntry: null,
                        recommendations: [],
                        isOnboarding: true,
                        error: null
                    });

                    // Clear database (optional - you might want to keep data for offline usage)
                    // const dbService = DatabaseService.getInstance();
                    // await dbService.clearAllData();

                } catch (error) {
                    console.error('Logout failed:', error);
                }
            }
        }),
        {
            name: 'app-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                userSettings: state.userSettings,
                isAuthenticated: state.isAuthenticated,
                isOnboarding: state.isOnboarding,
            }),
        }
    )
);

// Helper function
function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}