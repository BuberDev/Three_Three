import { MigrationInterface, QueryRunner } from "typeorm";

export class WidenUserSettingsTimezone1784563533327 implements MigrationInterface {
    name = 'WidenUserSettingsTimezone1784563533327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" ALTER COLUMN "timezone" TYPE character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" ALTER COLUMN "timezone" TYPE character varying(10)`);
    }

}
