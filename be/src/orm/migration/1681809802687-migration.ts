import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1681809802687 implements MigrationInterface {
    name = 'Migration1681809802687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "is_linked_google"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "is_linked_google" boolean NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "is_linked_google"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "is_linked_google" integer NOT NULL DEFAULT '0'
        `);
    }

}
