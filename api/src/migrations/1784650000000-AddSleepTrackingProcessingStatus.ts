import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSleepTrackingProcessingStatus1784650000000 implements MigrationInterface {
    name = 'AddSleepTrackingProcessingStatus1784650000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sleep_tracking" ADD "processing_status" character varying(20) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" ADD "processing_error" text`);
        // Existing rows predate this column and already have full (fake)
        // analysis data — mark them completed so they don't show as pending.
        await queryRunner.query(`UPDATE "sleep_tracking" SET "processing_status" = 'completed'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sleep_tracking" DROP COLUMN "processing_error"`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" DROP COLUMN "processing_status"`);
    }
}
