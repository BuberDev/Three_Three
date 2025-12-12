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
    accessToken: string | null;
    refreshToken: string | null;

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
    setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
    clearTokens: () => Promise<void>;

    // Voice notes actions
    addVoiceNote: (voiceNote: VoiceNote) => void;
    updateRecordingState: (state: RecordingState) => void;
    setProcessingVoiceNote: (processing: boolean) => void;
    uploadVoiceNote: (audioUri: string) => Promise<boolean>;
    uploadVoiceNoteWithContext: (audioUri: string, context?: string) => Promise<boolean>;
    uploadSleepRecording: (sleepData: any) => Promise<boolean>;

    // 🏢 ENTERPRISE Voice Recording Functions
    uploadDailyReportVoice: (audioUri: string, reportType: 'morning' | 'evening' | 'summary') => Promise<boolean>;
    uploadSleepReportVoice: (audioUri: string, sleepType: 'dream' | 'insomnia' | 'morning-reflection' | 'sleep-quality') => Promise<boolean>;
    uploadLifeExperienceVoice: (audioUri: string, category: 'reflection' | 'gratitude' | 'emotion' | 'achievement' | 'challenge') => Promise<boolean>;

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
            accessToken: null,
            refreshToken: null,
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

            setTokens: async (accessToken, refreshToken) => {
                try {
                    // Enterprise validation - prevent AsyncStorage errors
                    if (!accessToken || !refreshToken) {
                        console.error('❌ setTokens called with invalid tokens:', {
                            hasAccessToken: !!accessToken,
                            hasRefreshToken: !!refreshToken,
                            accessTokenType: typeof accessToken,
                            refreshTokenType: typeof refreshToken
                        });
                        throw new Error('Invalid tokens: both accessToken and refreshToken are required');
                    }

                    // Ensure tokens are strings
                    const validAccessToken = String(accessToken).trim();
                    const validRefreshToken = String(refreshToken).trim();

                    if (!validAccessToken || !validRefreshToken) {
                        throw new Error('Invalid tokens: empty or whitespace-only tokens');
                    }

                    await AsyncStorage.setItem('@access_token', validAccessToken);
                    await AsyncStorage.setItem('@refresh_token', validRefreshToken);
                    set({ accessToken: validAccessToken, refreshToken: validRefreshToken });

                    console.log('✅ Tokens stored successfully', {
                        accessTokenLength: validAccessToken.length,
                        refreshTokenLength: validRefreshToken.length
                    });
                } catch (error) {
                    console.error('❌ Error saving tokens:', error);
                    throw error; // Re-throw for calling code to handle
                }
            },

            clearTokens: async () => {
                try {
                    await AsyncStorage.removeItem('@access_token');
                    await AsyncStorage.removeItem('@refresh_token');
                    set({ accessToken: null, refreshToken: null });
                } catch (error) {
                    console.error('Error clearing tokens:', error);
                }
            },

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
                    const response = await apiService.uploadVoiceNote(audioUri);

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
                    const response = await apiService.uploadVoiceNoteWithContext(audioUri, context);

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

            // 🏢 ENTERPRISE Voice Recording Functions
            uploadDailyReportVoice: async (audioUri: string, reportType: 'morning' | 'evening' | 'summary') => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log(`🌅 Uploading ${reportType} daily report voice note...`);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadDailyReportVoice(audioUri, reportType);

                    if (response.success && response.data) {
                        addVoiceNote(response.data.voiceNote);
                        console.log(`✅ Daily ${reportType} report uploaded successfully!`);
                        return true;
                    } else {
                        setError(response.error || 'Failed to upload daily report');
                        return false;
                    }
                } catch (error) {
                    console.error('🚨 Daily report upload failed:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setProcessingVoiceNote(false);
                }
            },

            uploadSleepReportVoice: async (audioUri: string, sleepType: 'dream' | 'insomnia' | 'morning-reflection' | 'sleep-quality') => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log(`🌙 Uploading ${sleepType} sleep report voice note...`);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadSleepReportVoice(audioUri, sleepType);

                    if (response.success && response.data) {
                        addVoiceNote(response.data.voiceNote);
                        console.log(`✅ Sleep ${sleepType} report uploaded successfully!`);
                        return true;
                    } else {
                        setError(response.error || 'Failed to upload sleep report');
                        return false;
                    }
                } catch (error) {
                    console.error('🚨 Sleep report upload failed:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setProcessingVoiceNote(false);
                }
            },

            uploadLifeExperienceVoice: async (audioUri: string, category: 'reflection' | 'gratitude' | 'emotion' | 'achievement' | 'challenge') => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log(`💭 Uploading ${category} life experience voice note...`);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadLifeExperienceVoice(audioUri, category);

                    if (response.success && response.data) {
                        addVoiceNote(response.data.voiceNote);
                        console.log(`✅ Life ${category} experience uploaded successfully!`);
                        return true;
                    } else {
                        setError(response.error || 'Failed to upload life experience');
                        return false;
                    }
                } catch (error) {
                    console.error('🚨 Life experience upload failed:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setProcessingVoiceNote(false);
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
            },

            loadDailyMetrics: async () => {
                const { user } = get();
                if (!user) {
                    set({ dailyMetrics: null });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Daily metrics not available (backend endpoint not implemented yet)');
                set({ dailyMetrics: null });
            },

            loadWeeklyInsights: async () => {
                const { user } = get();
                if (!user) {
                    set({ weeklyInsights: null });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Weekly insights not available (backend endpoint not implemented yet)');
                set({ weeklyInsights: null });
            },

            loadProgressMetrics: async () => {
                const { user } = get();
                if (!user) {
                    set({ progressMetrics: null });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Progress metrics not available (backend endpoint not implemented yet)');
                set({ progressMetrics: null });
            },

            generatePersonalizedRecommendations: async () => {
                const { user } = get();
                if (!user) {
                    set({ recommendations: [] });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Recommendations not available (backend endpoint not implemented yet)');
                set({ recommendations: [] });
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
                console.log('🚀 App Store Initialize started, __DEV__:', __DEV__);
                try {
                    set({ isLoading: true });

                    // Load JWT tokens from storage and verify authentication
                    let loadedTokens = { accessToken: null, refreshToken: null };
                    let authenticatedUser = null;

                    try {
                        const accessToken = await AsyncStorage.getItem('@access_token');
                        const refreshToken = await AsyncStorage.getItem('@refresh_token');

                        if (accessToken && refreshToken) {
                            loadedTokens = { accessToken, refreshToken };

                            // Set up API service with the token
                            const apiService = ApiService.getInstance();
                            apiService.setAuthToken(accessToken);

                            // Try to fetch user profile to verify token is still valid
                            try {
                                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/profile`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                if (response.ok) {
                                    authenticatedUser = await response.json();
                                    console.log('✅ User authenticated from stored token:', authenticatedUser.id);
                                } else {
                                    console.log('❌ Stored token is invalid, clearing...');
                                    await AsyncStorage.removeItem('@access_token');
                                    await AsyncStorage.removeItem('@refresh_token');
                                    loadedTokens = { accessToken: null, refreshToken: null };
                                }
                            } catch (error) {
                                console.log('❌ Failed to verify token, clearing...', error);
                                await AsyncStorage.removeItem('@access_token');
                                await AsyncStorage.removeItem('@refresh_token');
                                loadedTokens = { accessToken: null, refreshToken: null };
                            }
                        }
                    } catch (error) {
                        console.error('Error loading tokens:', error);
                    }

                    // Set initial state based on authentication status
                    set({
                        user: authenticatedUser,
                        userSettings: null,
                        isAuthenticated: !!authenticatedUser,
                        isOnboarding: !authenticatedUser, // Only show onboarding if not authenticated
                        accessToken: loadedTokens.accessToken,
                        refreshToken: loadedTokens.refreshToken,
                        voiceNotes: [],
                        tasks: [],
                        todaysTasks: [],
                        todayEntry: null,
                        recommendations: [],
                        activities: [],
                        todaysActivities: [],
                        dailyMetrics: null,
                        weeklyInsights: null,
                        progressMetrics: null,
                        error: null
                    });

                    // Initialize services
                    const dbService = DatabaseService.getInstance();
                    await dbService.initialize();

                    const audioService = AudioService.getInstance();
                    await audioService.initialize();

                    const state = get();
                    let currentUser = state.user;

                    // EMERGENCY CHECK: If we find demo-user-123, CLEAR IT!
                    if (currentUser?.id === 'demo-user-123') {
                        console.log('🚨 DEMO USER DETECTED! Clearing...');
                        await get().clearTokens();
                        set({
                            user: null,
                            isAuthenticated: false,
                            isOnboarding: true,
                        });
                        currentUser = null;
                    }

                    // Load user data if authenticated
                    if (currentUser && state.isAuthenticated && currentUser.id !== 'demo-user-123') {
                        console.log('📚 Loading user data for:', currentUser.email);

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
                            }
                            // No demo entry creation - user must create real data
                        } catch (error) {
                            console.log('No daily entry found for today - user will need to create one');
                            // No demo data - clean slate for real user
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

                    // Clear stored JWT tokens
                    await get().clearTokens();

                    // Reset app state
                    set({
                        user: null,
                        userSettings: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null,
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