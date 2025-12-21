import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHabits1734711600000 implements MigrationInterface {
    name = 'CreateHabits1734711600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create habits table
        await queryRunner.query(`
            CREATE TABLE "habits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "frequency" character varying NOT NULL DEFAULT 'daily',
                "category" character varying NOT NULL DEFAULT 'personal',
                "status" character varying NOT NULL DEFAULT 'active',
                "current_streak" integer NOT NULL DEFAULT 0,
                "longest_streak" integer NOT NULL DEFAULT 0,
                "total_completions" integer NOT NULL DEFAULT 0,
                "last_completed_at" date,
                "target_days" integer,
                "reminder_settings" jsonb,
                "custom_fields" jsonb,
                CONSTRAINT "PK_habits" PRIMARY KEY ("id")
            )
        `);

        // Create habit_completions table
        await queryRunner.query(`
            CREATE TABLE "habit_completions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "habit_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "completed_at" date NOT NULL,
                "notes" text,
                "rating" integer,
                "metadata" jsonb,
                CONSTRAINT "PK_habit_completions" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for habits
        await queryRunner.query(`CREATE INDEX "IDX_habits_user_id" ON "habits" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_habits_user_id_status" ON "habits" ("user_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_habits_user_id_category" ON "habits" ("user_id", "category")`);
        await queryRunner.query(`CREATE INDEX "IDX_habits_user_id_frequency" ON "habits" ("user_id", "frequency")`);

        // Create indexes for habit_completions
        await queryRunner.query(`CREATE INDEX "IDX_habit_completions_habit_id" ON "habit_completions" ("habit_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_habit_completions_user_id" ON "habit_completions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_habit_completions_completed_at" ON "habit_completions" ("completed_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_habit_completions_habit_id_completed_at" ON "habit_completions" ("habit_id", "completed_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_habit_completions_user_id_completed_at" ON "habit_completions" ("user_id", "completed_at")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "FK_habits_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "habit_completions"
            ADD CONSTRAINT "FK_habit_completions_habit_id"
            FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "habit_completions"
            ADD CONSTRAINT "FK_habit_completions_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        // Add unique constraint to prevent duplicate completions per day
        await queryRunner.query(`
            ALTER TABLE "habit_completions"
            ADD CONSTRAINT "UQ_habit_completions_habit_date"
            UNIQUE ("habit_id", "completed_at")
        `);

        // Add check constraints for enum values
        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_frequency"
            CHECK ("frequency" IN ('daily', 'weekly', 'monthly'))
        `);

        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_category"
            CHECK ("category" IN ('health', 'productivity', 'learning', 'personal', 'fitness', 'mindfulness', 'social', 'financial'))
        `);

        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_status"
            CHECK ("status" IN ('active', 'paused', 'completed', 'archived'))
        `);

        // Add check constraints for valid values
        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_current_streak"
            CHECK ("current_streak" >= 0)
        `);

        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_longest_streak"
            CHECK ("longest_streak" >= 0)
        `);

        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_total_completions"
            CHECK ("total_completions" >= 0)
        `);

        await queryRunner.query(`
            ALTER TABLE "habits"
            ADD CONSTRAINT "CHK_habits_target_days"
            CHECK ("target_days" IS NULL OR ("target_days" >= 1 AND "target_days" <= 31))
        `);

        await queryRunner.query(`
            ALTER TABLE "habit_completions"
            ADD CONSTRAINT "CHK_habit_completions_rating"
            CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "habit_completions" DROP CONSTRAINT "FK_habit_completions_user_id"`);
        await queryRunner.query(`ALTER TABLE "habit_completions" DROP CONSTRAINT "FK_habit_completions_habit_id"`);
        await queryRunner.query(`ALTER TABLE "habits" DROP CONSTRAINT "FK_habits_user_id"`);

        // Drop indexes for habit_completions
        await queryRunner.query(`DROP INDEX "IDX_habit_completions_user_id_completed_at"`);
        await queryRunner.query(`DROP INDEX "IDX_habit_completions_habit_id_completed_at"`);
        await queryRunner.query(`DROP INDEX "IDX_habit_completions_completed_at"`);
        await queryRunner.query(`DROP INDEX "IDX_habit_completions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_habit_completions_habit_id"`);

        // Drop indexes for habits
        await queryRunner.query(`DROP INDEX "IDX_habits_user_id_frequency"`);
        await queryRunner.query(`DROP INDEX "IDX_habits_user_id_category"`);
        await queryRunner.query(`DROP INDEX "IDX_habits_user_id_status"`);
        await queryRunner.query(`DROP INDEX "IDX_habits_user_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "habit_completions"`);
        await queryRunner.query(`DROP TABLE "habits"`);
    }
}