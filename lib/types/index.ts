export enum EventType {
    // User events
    USER_REGISTERED = 'user_registered',
    USER_LOGIN = 'user_login',
    USER_PROFILE_UPDATED = 'user_profile_updated',
    USER_SETTINGS_UPDATED = 'user_settings_updated',

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

export interface User {
    id: string;
    email: string;
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
    confidence: number;
    createdAt: string;
    dismissed: boolean;
}

// Audio recording types
export interface AudioRecording {
    uri: string;
    duration: number;
    size: number;
}

export interface RecordingState {
    isRecording: boolean;
    duration: number;
    uri?: string;
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