import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DatabaseService } from '../lib/database/database';
import { ApiService } from '../lib/services/api';
import { AudioService } from '../lib/services/audio';
import { EventService } from '../lib/services/event';
import { DailyEntry, EventType, Recommendation, RecordingState, Task, User, UserSettings, VoiceNote } from '../lib/types';

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

    // Tasks actions
    addTask: (task: Task) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    toggleTaskCompletion: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    loadTasks: () => Promise<void>;

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
                if (!user) return;

                try {
                    const dbService = DatabaseService.getInstance();
                    const tasks = await dbService.getTasksByUserId(user.id);
                    const today = new Date().toISOString().split('T')[0];
                    const todaysTasks = tasks.filter(task => {
                        const taskDate = task.dueDate?.split('T')[0];
                        return taskDate === today || !task.completed;
                    });

                    set({ tasks, todaysTasks });
                } catch (error) {
                    console.error('Failed to load tasks:', error);
                    setError('Failed to load tasks');
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

                    // Load user data if authenticated
                    const { user, isAuthenticated } = get();
                    if (user && isAuthenticated) {
                        await get().loadTasks();

                        // Load today's entry
                        const today = new Date().toISOString().split('T')[0];
                        const todayEntry = await dbService.getDailyEntry(user.id, today);
                        set({ todayEntry });
                    }

                } catch (error) {
                    console.error('App initialization failed:', error);
                    set({ error: 'Failed to initialize app' });
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