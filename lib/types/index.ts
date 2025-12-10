export enum EventType {
    // User events
    USER_REGISTERED = 'user_registered',
    USER_LOGIN = 'user_login',
    USER_PROFILE_UPDATED = 'user_profile_updated',
    USER_SETTINGS_UPDATED = 'user_settings_updated',

    // Activity tracking events
    ACTIVITY_LOGGED = 'activity_logged',
    DAILY_SUMMARY_REQUESTED = 'daily_summary_requested',
    PROGRESS_MILESTONE_REACHED = 'progress_milestone_reached',

    // Voice note events
    VOICE_NOTE_UPLOADED = 'voice_note_uploaded',
    VOICE_NOTE_TRANSCRIBED = 'voice_note_transcribed',
    VOICE_NOTE_PROCESSED = 'voice_note_processed',
    VOICE_NOTE_DELETED = 'voice_note_deleted',

    // Task events
    TASK_CREATED = 'task_created',
    TASK_COMPLETED = 'task_completed',
    TASK_UPDATED = 'task_updated',
    TASK_DELETED = 'task_deleted',
    TASK_OVERDUE = 'task_overdue',

    // Daily summary events
    DAILY_SUMMARY_GENERATED = 'daily_summary_generated',
    DAILY_INSIGHTS_UPDATED = 'daily_insights_updated',

    // Offline sync events
    OFFLINE_SYNC_SUCCESS = 'offline_sync_success',
    OFFLINE_SYNC_FAILED = 'offline_sync_failed',
}

export enum ActivityCategory {
    WORK = 'work',
    HEALTH = 'health',
    LEARNING = 'learning',
    SOCIAL = 'social',
    PERSONAL = 'personal',
    EXERCISE = 'exercise',
    NUTRITION = 'nutrition',
    SLEEP = 'sleep',
    ENTERTAINMENT = 'entertainment',
    TRAVEL = 'travel',
    HOUSEHOLD = 'household',
    FINANCE = 'finance',
    OTHER = 'other'
}

export enum TimeOfDay {
    EARLY_MORNING = 'early_morning', // 5-8
    MORNING = 'morning', // 8-12
    AFTERNOON = 'afternoon', // 12-17
    EVENING = 'evening', // 17-21
    NIGHT = 'night' // 21-5
}

export enum EnergyLevel {
    VERY_LOW = 1,
    LOW = 2,
    MEDIUM = 3,
    HIGH = 4,
    VERY_HIGH = 5
}

export enum MoodType {
    VERY_SAD = 1,
    SAD = 2,
    NEUTRAL = 3,
    HAPPY = 4,
    VERY_HAPPY = 5
}

export interface User {
    id: string;
    email: string;
    name?: string;
    authProvider: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserSettings {
    id: string;
    userId: string;
    consentVoiceProcessing: boolean;
    consentPersonalization: boolean;
    primaryGoals: string[];
    // Nowe ustawienia dla profilu
    notificationsEnabled?: boolean;
    dataProcessingConsent?: boolean;
    aiAnalysisEnabled?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VoiceNote {
    id: string;
    userId: string;
    audioUrl: string;
    transcription: string;
    rawTranscript: string;
    sentimentScore: number;
    topics: string[];
    extractedItems: {
        tasks: Task[];
        insights: string[];
        mood?: string;
    };
    embedding?: number[];
    createdAt: string;
    processedAt?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    dueDate?: string;
    category?: string;
    extractedFromVoiceNoteId?: string;
}

export interface DailyEntry {
    id: string;
    userId: string;
    date: string;
    autoSummary: string;
    tasks: Task[];
    habits: Habit[];
    mood: string;
    voiceNotesCount?: number;
    updatedAt: string;
}

export interface Habit {
    id: string;
    name: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    streakCount: number;
    lastCompletedAt?: string;
    isCompleted: boolean;
}

export interface AppEvent {
    id: string;
    userId: string;
    eventType: EventType;
    payload: Record<string, any>;
    timestamp: string;
}

export interface Recommendation {
    id: string;
    userId: string;
    type: 'task_priority' | 'habit_suggestion' | 'time_management' | 'insight';
    title: string;
    description: string;
    reason?: string;
    confidence: number;
    createdAt: string;
    dismissed: boolean;
}

// Audio recording types
export interface AudioRecording {
    id?: string;
    uri: string;
    duration: number;
    size?: number;
}

export interface RecordingState {
    isRecording: boolean;
    duration: number;
    uri?: string | null;
    isPaused?: boolean;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface VoiceNoteResponse {
    voiceNote: VoiceNote;
    extractedTasks: Task[];
    insights: string[];
}

// Nowe interfejsy dla trackingu aktywności

export interface Activity {
    id: string;
    userId: string;
    title: string;
    description?: string;
    category: ActivityCategory;
    tags: string[];
    duration?: number; // w minutach
    startTime?: string;
    endTime?: string;
    energyLevel?: EnergyLevel;
    mood?: MoodType;
    timeOfDay: TimeOfDay;
    location?: string;
    notes?: string;
    extractedFromVoiceNoteId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DailyMetrics {
    id: string;
    userId: string;
    date: string;
    totalActivities: number;
    categoriesBreakdown: Record<ActivityCategory, number>;
    averageEnergyLevel: number;
    averageMood: number;
    timeOfDayBreakdown: Record<TimeOfDay, number>;
    topTags: { tag: string; count: number }[];
    totalFocusTime: number; // w minutach
    productivityScore: number; // 0-100
    completedTasks: number;
    totalTasks: number;
    voiceNotesCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface WeeklyInsights {
    id: string;
    userId: string;
    weekStart: string;
    weekEnd: string;
    totalActivities: number;
    mostProductiveDay: string;
    mostProductiveTimeOfDay: TimeOfDay;
    dominantMood: MoodType;
    averageEnergyLevel: number;
    topCategories: { category: ActivityCategory; count: number }[];
    improvementAreas: string[];
    achievements: string[];
    habits: {
        started: number;
        maintained: number;
        broken: number;
    };
    recommendedGoals: string[];
    createdAt: string;
}

export interface ProgressMetrics {
    streak: {
        current: number;
        longest: number;
        type: string; // e.g., "daily_logging", "exercise", "productivity"
    };
    goals: {
        daily: number;
        weekly: number;
        monthly: number;
    };
    completion: {
        tasksToday: number;
        tasksThisWeek: number;
        tasksThisMonth: number;
    };
    trends: {
        energyLevel: number[]; // ostatnie 7 dni
        mood: number[]; // ostatnie 7 dni  
        productivity: number[]; // ostatnie 7 dni
    };
}