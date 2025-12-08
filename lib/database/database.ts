import * as SQLite from 'expo-sqlite';
import { AppEvent, DailyEntry, Task, User, VoiceNote } from '../types';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: SQLite.SQLiteDatabase | null = null;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async initialize(): Promise<void> {
        try {
            this.db = await SQLite.openDatabaseAsync('threethree.db');
            await this.createTables();
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        auth_provider TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        consent_voice_processing INTEGER NOT NULL DEFAULT 0,
        consent_personalization INTEGER NOT NULL DEFAULT 0,
        primary_goals TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        transcription TEXT,
        raw_transcript TEXT,
        sentiment_score REAL,
        topics TEXT NOT NULL DEFAULT '[]',
        extracted_items TEXT NOT NULL DEFAULT '{}',
        embedding TEXT,
        created_at TEXT NOT NULL,
        processed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS daily_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        auto_summary TEXT,
        tasks TEXT NOT NULL DEFAULT '[]',
        habits TEXT NOT NULL DEFAULT '[]',
        mood TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        completed INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        category TEXT,
        extracted_from_voice_note_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (extracted_from_voice_note_id) REFERENCES voice_notes (id)
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        frequency TEXT NOT NULL DEFAULT 'daily',
        streak_count INTEGER NOT NULL DEFAULT 0,
        last_completed_at TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL DEFAULT '{}',
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE INDEX IF NOT EXISTS idx_voice_notes_user_id ON voice_notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_voice_notes_created_at ON voice_notes(created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
      CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    `;

        await this.db.execAsync(createTablesSQL);
    }

    // User methods
    public async createUser(user: Omit<User, 'id'>): Promise<User> {
        if (!this.db) throw new Error('Database not initialized');

        const id = this.generateId();
        const now = new Date().toISOString();
        const newUser: User = { ...user, id, createdAt: now, updatedAt: now };

        await this.db.runAsync(
            'INSERT INTO users (id, email, auth_provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [newUser.id, newUser.email, newUser.authProvider, newUser.createdAt, newUser.updatedAt]
        );

        return newUser;
    }

    public async getUserById(id: string): Promise<User | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getFirstAsync<User>(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        return result || null;
    }

    // Voice Notes methods
    public async saveVoiceNote(voiceNote: Omit<VoiceNote, 'id'>): Promise<VoiceNote> {
        if (!this.db) throw new Error('Database not initialized');

        const id = this.generateId();
        const now = new Date().toISOString();
        const newVoiceNote: VoiceNote = { ...voiceNote, id, createdAt: now };

        await this.db.runAsync(
            `INSERT INTO voice_notes (id, user_id, audio_url, transcription, raw_transcript, 
       sentiment_score, topics, extracted_items, embedding, created_at, processed_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newVoiceNote.id,
                newVoiceNote.userId,
                newVoiceNote.audioUrl,
                newVoiceNote.transcription || '',
                newVoiceNote.rawTranscript || '',
                newVoiceNote.sentimentScore || 0,
                JSON.stringify(newVoiceNote.topics || []),
                JSON.stringify(newVoiceNote.extractedItems || {}),
                newVoiceNote.embedding ? JSON.stringify(newVoiceNote.embedding) : null,
                newVoiceNote.createdAt,
                newVoiceNote.processedAt || null
            ]
        );

        return newVoiceNote;
    }

    public async getVoiceNotesByUserId(userId: string, limit: number = 50): Promise<VoiceNote[]> {
        if (!this.db) throw new Error('Database not initialized');

        const results = await this.db.getAllAsync<any>(
            'SELECT * FROM voice_notes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );

        return results.map(this.mapVoiceNoteFromDb);
    }

    // Tasks methods
    public async createTask(task: Omit<Task, 'id'>): Promise<Task> {
        if (!this.db) throw new Error('Database not initialized');

        const id = this.generateId();
        const now = new Date().toISOString();
        const newTask: Task = { ...task, id };

        await this.db.runAsync(
            `INSERT INTO tasks (id, user_id, title, description, priority, completed, 
       due_date, category, extracted_from_voice_note_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newTask.id,
                task.extractedFromVoiceNoteId ? task.extractedFromVoiceNoteId.split('-')[0] : '', // Extract userId from voiceNoteId
                newTask.title,
                newTask.description || null,
                newTask.priority,
                newTask.completed ? 1 : 0,
                newTask.dueDate || null,
                newTask.category || null,
                newTask.extractedFromVoiceNoteId || null,
                now,
                now
            ]
        );

        return newTask;
    }

    public async getTasksByUserId(userId: string, completed?: boolean): Promise<Task[]> {
        if (!this.db) throw new Error('Database not initialized');

        let query = 'SELECT * FROM tasks WHERE user_id = ?';
        const params: any[] = [userId];

        if (completed !== undefined) {
            query += ' AND completed = ?';
            params.push(completed ? 1 : 0);
        }

        query += ' ORDER BY created_at DESC';

        const results = await this.db.getAllAsync<any>(query, params);
        return results.map(this.mapTaskFromDb);
    }

    public async updateTaskCompletion(taskId: string, completed: boolean): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            'UPDATE tasks SET completed = ?, updated_at = ? WHERE id = ?',
            [completed ? 1 : 0, new Date().toISOString(), taskId]
        );
    }

    // Daily Entries methods
    public async getDailyEntry(userId: string, date: string): Promise<DailyEntry | null> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.getFirstAsync<any>(
            'SELECT * FROM daily_entries WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        return result ? this.mapDailyEntryFromDb(result) : null;
    }

    public async saveDailyEntry(entry: Omit<DailyEntry, 'id'>): Promise<DailyEntry> {
        if (!this.db) throw new Error('Database not initialized');

        const id = this.generateId();
        const now = new Date().toISOString();
        const newEntry: DailyEntry = { ...entry, id, updatedAt: now };

        await this.db.runAsync(
            `INSERT OR REPLACE INTO daily_entries (id, user_id, date, auto_summary, tasks, habits, mood, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newEntry.id,
                newEntry.userId,
                newEntry.date,
                newEntry.autoSummary,
                JSON.stringify(newEntry.tasks),
                JSON.stringify(newEntry.habits),
                newEntry.mood,
                newEntry.updatedAt
            ]
        );

        return newEntry;
    }

    // Event logging
    public async logEvent(event: Omit<AppEvent, 'id'>): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const id = this.generateId();

        await this.db.runAsync(
            'INSERT INTO events (id, user_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?)',
            [id, event.userId, event.eventType, JSON.stringify(event.payload), event.timestamp]
        );
    }

    // Helper methods
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    private mapVoiceNoteFromDb(row: any): VoiceNote {
        return {
            id: row.id,
            userId: row.user_id,
            audioUrl: row.audio_url,
            transcription: row.transcription,
            rawTranscript: row.raw_transcript,
            sentimentScore: row.sentiment_score,
            topics: JSON.parse(row.topics || '[]'),
            extractedItems: JSON.parse(row.extracted_items || '{}'),
            embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
            createdAt: row.created_at,
            processedAt: row.processed_at
        };
    }

    private mapTaskFromDb(row: any): Task {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            priority: row.priority,
            completed: row.completed === 1,
            dueDate: row.due_date,
            category: row.category,
            extractedFromVoiceNoteId: row.extracted_from_voice_note_id
        };
    }

    private mapDailyEntryFromDb(row: any): DailyEntry {
        return {
            id: row.id,
            userId: row.user_id,
            date: row.date,
            autoSummary: row.auto_summary,
            tasks: JSON.parse(row.tasks || '[]'),
            habits: JSON.parse(row.habits || '[]'),
            mood: row.mood,
            updatedAt: row.updated_at
        };
    }

    public async clearAllData(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        await this.db.execAsync(`
      DELETE FROM events;
      DELETE FROM tasks;
      DELETE FROM habits;
      DELETE FROM daily_entries;
      DELETE FROM voice_notes;
      DELETE FROM user_settings;
      DELETE FROM users;
    `);
    }
}