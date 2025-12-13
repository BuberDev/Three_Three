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

    public isInitialized(): boolean {
        return this.db !== null;
    }

    public async initialize(): Promise<void> {
        try {
            this.db = await SQLite.openDatabaseAsync('threethree.db');
            await this.createTables();
            await this.runMigrations();
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    private async runMigrations(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // 🔧 Migration: Add missing summary column if it doesn't exist
            await this.db.execAsync(`
                ALTER TABLE voice_notes ADD COLUMN summary TEXT;
            `);
            console.log('✅ Database migration: Added summary column');
        } catch (error: any) {
            // Column already exists - this is expected for new installations
            if (error.message?.includes('duplicate column name')) {
                console.log('✅ Database migration: summary column already exists');
            } else {
                console.warn('⚠️ Database migration warning:', error.message);
            }
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
        summary TEXT,
        duration REAL DEFAULT 0,
        file_size INTEGER,
        mime_type TEXT DEFAULT 'audio/m4a',
        processing_status TEXT DEFAULT 'pending',
        processed_at TEXT,
        sentiment_score REAL,
        topics TEXT NOT NULL DEFAULT '[]',
        extracted_items TEXT NOT NULL DEFAULT '{}',
        embedding TEXT,
        created_at TEXT NOT NULL,
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

        // Map API response format to database format
        const userId = voiceNote.userId || voiceNote.user_id;
        const transcription = voiceNote.transcription || voiceNote.transcript || '';
        const audioUrl = voiceNote.audioUrl || voiceNote.audioFilePath || '';
        const summary = voiceNote.summary || '';
        const duration = voiceNote.duration || 0;
        const processed = voiceNote.processed || voiceNote.processingStatus === 'completed';

        const newVoiceNote: VoiceNote = {
            ...voiceNote,
            id,
            createdAt: now,
            userId,
            transcription,
            audioUrl,
            summary,
            duration,
            processed
        };

        console.log('💾 Saving voice note to database:', {
            id: newVoiceNote.id,
            userId,
            hasTranscription: !!transcription,
            hasSummary: !!summary,
            duration,
            processed
        });

        await this.db.runAsync(
            `INSERT OR REPLACE INTO voice_notes (id, user_id, audio_url, transcription, raw_transcript, 
       summary, duration, file_size, mime_type, processing_status, processed_at,
       sentiment_score, topics, extracted_items, embedding, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newVoiceNote.id,
                userId,
                audioUrl,
                transcription,
                transcription, // Use transcription as rawTranscript
                summary,
                duration,
                voiceNote.fileSize || 0,
                voiceNote.mimeType || 'audio/m4a',
                voiceNote.processingStatus || (processed ? 'completed' : 'pending'),
                processed ? now : null,
                voiceNote.sentimentScore || voiceNote.sentiment || 0,
                JSON.stringify(voiceNote.topics || voiceNote.tags || []),
                JSON.stringify(voiceNote.extractedItems || {}),
                voiceNote.embedding ? JSON.stringify(voiceNote.embedding) : null,
                newVoiceNote.createdAt
            ]
        );

        console.log('✅ Voice note saved to database successfully');
        return newVoiceNote;
    }

    public async getVoiceNotesByUserId(userId: string, limit: number = 50): Promise<VoiceNote[]> {
        if (!this.db) throw new Error('Database not initialized');

        console.log(`🔍 Querying voice notes for user: ${userId}, limit: ${limit}`);

        try {
            const results = await this.db.getAllAsync<any>(
                'SELECT * FROM voice_notes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
                [userId, limit]
            );

            console.log(`📊 Raw database results: ${results.length} rows found`);

            if (results.length > 0) {
                console.log('📄 Sample voice note from DB:', {
                    id: results[0].id,
                    user_id: results[0].user_id,
                    hasTranscription: !!results[0].transcription,
                    created_at: results[0].created_at
                });
            }

            const mappedResults = results.map(this.mapVoiceNoteFromDb);
            console.log(`✅ Successfully mapped ${mappedResults.length} voice notes`);

            return mappedResults;
        } catch (error) {
            console.error('❌ Error loading voice notes from database:', error);
            return [];
        }
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
            user_id: row.user_id, // Backend compatibility
            audioUrl: row.audio_url,
            audioFilePath: row.audio_url, // API compatibility
            transcription: row.transcription || '',
            transcript: row.transcription || '', // Alternative name
            rawTranscript: row.raw_transcript || row.transcription || '',
            summary: row.summary || '',
            duration: row.duration || 0,
            fileSize: row.file_size || 0,
            mimeType: row.mime_type || 'audio/m4a',
            processingStatus: row.processing_status || 'pending',
            sentimentScore: row.sentiment_score || 0,
            sentiment: row.sentiment_score || 0, // API compatibility
            topics: JSON.parse(row.topics || '[]'),
            tags: JSON.parse(row.topics || '[]'), // API compatibility
            extractedItems: JSON.parse(row.extracted_items || '{}'),
            embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
            processed: row.processing_status === 'completed' || !!row.processed_at,
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