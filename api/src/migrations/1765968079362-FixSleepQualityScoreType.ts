import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSleepQualityScoreType1765968079362 implements MigrationInterface {
    name = 'FixSleepQualityScoreType1765968079362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_670e233391ba06e5cfee5d4054"`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" DROP COLUMN "sleep_quality_score"`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" ADD "sleep_quality_score" numeric(3,1)`);
        await queryRunner.query(`CREATE INDEX "IDX_670e233391ba06e5cfee5d4054" ON "sleep_tracking" ("sleep_quality_score") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_670e233391ba06e5cfee5d4054"`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" DROP COLUMN "sleep_quality_score"`);
        await queryRunner.query(`ALTER TABLE "sleep_tracking" ADD "sleep_quality_score" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_670e233391ba06e5cfee5d4054" ON "sleep_tracking" ("sleep_quality_score") `);
    }

}
