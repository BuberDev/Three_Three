import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSleepEventsTable1705334400001 implements MigrationInterface {
    name = 'CreateSleepEventsTable1705334400001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create sleep_events table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS sleep_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sleep_tracking_id UUID NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                event_time TIMESTAMP NOT NULL,
                duration_seconds INTEGER,
                intensity VARCHAR(20),
                confidence_score DECIMAL(3,2),
                audio_segment_start INTEGER,
                audio_segment_end INTEGER,
                transcription TEXT,
                details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE sleep_events 
            ADD CONSTRAINT FK_sleep_events_sleep_tracking 
            FOREIGN KEY (sleep_tracking_id) REFERENCES sleep_tracking(id) ON DELETE CASCADE;
        `);

        // Create indices
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_sleep_events_sleep_tracking_id ON sleep_events(sleep_tracking_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_sleep_events_event_type ON sleep_events(event_type);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_sleep_events_event_time ON sleep_events(event_time);
        `);

        // Add check constraints for enum values
        await queryRunner.query(`
            ALTER TABLE sleep_events 
            ADD CONSTRAINT CHK_event_type 
            CHECK (event_type IN ('snoring', 'sleep_talking', 'movement', 'awakening', 'coughing', 'environment_noise', 'breathing_irregularity'));
        `);

        await queryRunner.query(`
            ALTER TABLE sleep_events 
            ADD CONSTRAINT CHK_intensity 
            CHECK (intensity IN ('very_low', 'low', 'moderate', 'high', 'very_high'));
        `);

        await queryRunner.query(`
            ALTER TABLE sleep_events 
            ADD CONSTRAINT CHK_confidence_score 
            CHECK (confidence_score >= 0 AND confidence_score <= 1);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS sleep_events;`);
    }
}