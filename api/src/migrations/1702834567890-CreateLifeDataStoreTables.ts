import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLifeDataStoreTables1702834567890 implements MigrationInterface {
    name = 'CreateLifeDataStoreTables1702834567890';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgvector extension if not exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        // Update users table with additional fields
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC'
        `);

        // Update user_settings with new fields for Life Data Store
        await queryRunner.query(`
            ALTER TABLE user_settings 
            ADD COLUMN IF NOT EXISTS consent_sleep_tracking BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS sleep_tracking_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(20) DEFAULT 'standard'
        `);

        // Update voice_notes table with new fields
        await queryRunner.query(`
            ALTER TABLE voice_notes 
            ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
            ADD COLUMN IF NOT EXISTS note_type VARCHAR(20) DEFAULT 'quick_note' 
                CHECK (note_type IN ('daily_activity', 'journaling', 'quick_note', 'sleep_related')),
            ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
            ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
            ADD COLUMN IF NOT EXISTS extracted_entities JSONB DEFAULT '[]'
        `);

        // Create daily_activities table
        await queryRunner.query(`
            CREATE TABLE daily_activities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                voice_note_id UUID REFERENCES voice_notes(id) ON DELETE SET NULL,
                date DATE NOT NULL,
                activity_type VARCHAR(20) NOT NULL 
                    CHECK (activity_type IN ('work', 'exercise', 'meal', 'social', 'personal', 'health', 'travel', 'sleep', 'entertainment', 'learning')),
                title VARCHAR(200) NOT NULL,
                description TEXT,
                duration_minutes INTEGER,
                location VARCHAR(100),
                people_involved JSONB DEFAULT '[]',
                mood_before VARCHAR(20) CHECK (mood_before IN ('great', 'good', 'neutral', 'bad', 'terrible')),
                mood_after VARCHAR(20) CHECK (mood_after IN ('great', 'good', 'neutral', 'bad', 'terrible')),
                energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
                productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 10),
                tags JSONB DEFAULT '[]',
                extracted_metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_daily_activities_user_date ON daily_activities(user_id, date);
            CREATE INDEX idx_daily_activities_type ON daily_activities(activity_type);
            CREATE INDEX idx_daily_activities_created_at ON daily_activities(created_at);
        `);

        // Create sleep_tracking table
        await queryRunner.query(`
            CREATE TABLE sleep_tracking (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                sleep_date DATE NOT NULL,
                recording_start_time TIMESTAMP WITH TIME ZONE,
                recording_end_time TIMESTAMP WITH TIME ZONE,
                audio_files JSONB DEFAULT '[]',
                sleep_duration_hours FLOAT,
                snoring_detected BOOLEAN DEFAULT FALSE,
                snoring_intensity VARCHAR(20) DEFAULT 'none' 
                    CHECK (snoring_intensity IN ('none', 'light', 'moderate', 'heavy')),
                sleep_talking_detected BOOLEAN DEFAULT FALSE,
                sleep_talking_frequency INTEGER DEFAULT 0,
                sleep_quality_score INTEGER CHECK (sleep_quality_score >= 1 AND sleep_quality_score <= 10),
                awakenings_count INTEGER DEFAULT 0,
                analysis_completed BOOLEAN DEFAULT FALSE,
                analysis_metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, sleep_date)
            );
            
            CREATE INDEX idx_sleep_tracking_user_date ON sleep_tracking(user_id, sleep_date);
            CREATE INDEX idx_sleep_tracking_quality ON sleep_tracking(sleep_quality_score);
        `);

        // Create journal_entries table
        await queryRunner.query(`
            CREATE TABLE journal_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                voice_note_id UUID REFERENCES voice_notes(id) ON DELETE SET NULL,
                date DATE NOT NULL,
                entry_type VARCHAR(20) NOT NULL 
                    CHECK (entry_type IN ('daily_reflection', 'goal_setting', 'problem_solving', 'gratitude', 'challenge')),
                title VARCHAR(200),
                content TEXT NOT NULL,
                sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
                emotional_state JSONB DEFAULT '{}',
                topics_mentioned JSONB DEFAULT '[]',
                goals_referenced JSONB DEFAULT '[]',
                challenges_mentioned JSONB DEFAULT '[]',
                insights_gained TEXT,
                action_items JSONB DEFAULT '[]',
                embedding VECTOR(1536),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date);
            CREATE INDEX idx_journal_entries_type ON journal_entries(entry_type);
            CREATE INDEX idx_journal_entries_sentiment ON journal_entries(sentiment_score);
            CREATE INDEX idx_journal_entries_embedding_cosine ON journal_entries 
                USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        `);

        // Create performance_metrics table
        await queryRunner.query(`
            CREATE TABLE performance_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                metric_type VARCHAR(20) NOT NULL 
                    CHECK (metric_type IN ('energy', 'focus', 'productivity', 'mood', 'stress', 'motivation')),
                value FLOAT NOT NULL CHECK (value >= 1 AND value <= 10),
                source VARCHAR(20) NOT NULL 
                    CHECK (source IN ('self_reported', 'ai_inferred', 'activity_based')),
                confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
                context JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_performance_metrics_user_date ON performance_metrics(user_id, date);
            CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
            CREATE UNIQUE INDEX idx_performance_metrics_unique ON performance_metrics(user_id, date, metric_type, source);
        `);

        // Create life_correlations table
        await queryRunner.query(`
            CREATE TABLE life_correlations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                correlation_type VARCHAR(50) NOT NULL,
                factor_a VARCHAR(100) NOT NULL,
                factor_b VARCHAR(100) NOT NULL,
                correlation_strength FLOAT NOT NULL CHECK (correlation_strength >= -1 AND correlation_strength <= 1),
                confidence_level FLOAT NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
                sample_size INTEGER NOT NULL,
                date_range_start DATE NOT NULL,
                date_range_end DATE NOT NULL,
                insights TEXT,
                recommendations JSONB DEFAULT '[]',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_life_correlations_user ON life_correlations(user_id);
            CREATE INDEX idx_life_correlations_strength ON life_correlations(correlation_strength);
            CREATE INDEX idx_life_correlations_type ON life_correlations(correlation_type);
        `);

        // Create behavioral_patterns table
        await queryRunner.query(`
            CREATE TABLE behavioral_patterns (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                pattern_type VARCHAR(30) NOT NULL 
                    CHECK (pattern_type IN ('daily_routine', 'weekly_cycle', 'mood_cycle', 'productivity_pattern')),
                pattern_name VARCHAR(100) NOT NULL,
                description TEXT,
                frequency VARCHAR(20) NOT NULL,
                triggers JSONB DEFAULT '[]',
                outcomes JSONB DEFAULT '[]',
                strength_score FLOAT CHECK (strength_score >= 0 AND strength_score <= 1),
                last_observed DATE,
                pattern_data JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_behavioral_patterns_user ON behavioral_patterns(user_id);
            CREATE INDEX idx_behavioral_patterns_type ON behavioral_patterns(pattern_type);
            CREATE INDEX idx_behavioral_patterns_strength ON behavioral_patterns(strength_score);
        `);

        // Create ai_insights table
        await queryRunner.query(`
            CREATE TABLE ai_insights (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                insight_type VARCHAR(20) NOT NULL 
                    CHECK (insight_type IN ('correlation', 'recommendation', 'warning', 'achievement', 'pattern')),
                priority VARCHAR(10) NOT NULL 
                    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                data_sources JSONB NOT NULL DEFAULT '[]',
                confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
                action_suggested TEXT,
                dismissed BOOLEAN DEFAULT FALSE,
                dismissed_at TIMESTAMP WITH TIME ZONE,
                valid_until DATE,
                user_feedback VARCHAR(20) CHECK (user_feedback IN ('helpful', 'not_helpful', 'irrelevant')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_ai_insights_user ON ai_insights(user_id);
            CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
            CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
            CREATE INDEX idx_ai_insights_dismissed ON ai_insights(dismissed);
            CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);
        `);

        // Create daily_summaries table (enhanced)
        await queryRunner.query(`
            CREATE TABLE daily_summaries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                total_activities INTEGER DEFAULT 0,
                top_activities JSONB DEFAULT '[]',
                overall_mood VARCHAR(20),
                energy_average FLOAT,
                productivity_score FLOAT,
                sleep_quality_previous_night FLOAT,
                key_achievements JSONB DEFAULT '[]',
                challenges_faced JSONB DEFAULT '[]',
                ai_generated_summary TEXT,
                recommendations_for_tomorrow JSONB DEFAULT '[]',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user_id, date)
            );
            
            CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date);
        `);

        // Update events table with new event types
        await queryRunner.query(`
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS related_table VARCHAR(50),
            ADD COLUMN IF NOT EXISTS related_id UUID
        `);

        // Create triggers for updated_at timestamps
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        const tables = [
            'daily_activities', 'sleep_tracking', 'journal_entries',
            'life_correlations', 'behavioral_patterns', 'daily_summaries'
        ];

        for (const table of tables) {
            await queryRunner.query(`
                CREATE TRIGGER update_${table}_updated_at 
                BEFORE UPDATE ON ${table}
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        const tables = [
            'daily_activities', 'sleep_tracking', 'journal_entries',
            'life_correlations', 'behavioral_patterns', 'daily_summaries'
        ];

        for (const table of tables) {
            await queryRunner.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}`);
        }

        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

        // Drop tables in reverse order (respecting foreign keys)
        await queryRunner.query(`DROP TABLE IF EXISTS ai_insights`);
        await queryRunner.query(`DROP TABLE IF EXISTS behavioral_patterns`);
        await queryRunner.query(`DROP TABLE IF EXISTS life_correlations`);
        await queryRunner.query(`DROP TABLE IF EXISTS performance_metrics`);
        await queryRunner.query(`DROP TABLE IF EXISTS journal_entries`);
        await queryRunner.query(`DROP TABLE IF EXISTS sleep_tracking`);
        await queryRunner.query(`DROP TABLE IF EXISTS daily_activities`);
        await queryRunner.query(`DROP TABLE IF EXISTS daily_summaries`);

        // Revert column additions (optional, as they don't break existing functionality)
        // Note: In production, you might want to keep these for data preservation
    }
}