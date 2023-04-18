import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1681788418816 implements MigrationInterface {
    name = 'Migration1681788418816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "is_linked_google"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "is_linked_google" integer NOT NULL DEFAULT '0'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "is_linked_google"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "is_linked_google" boolean NOT NULL DEFAULT false
        `);
    }

}
