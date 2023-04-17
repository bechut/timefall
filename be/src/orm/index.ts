import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

dotenv.config({ path: 'env/.env' });

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  POSTGRES_USERNAME,
} = process.env;

import { readdirSync } from 'fs';

const ormFolderPath = (name: 'entity' | 'migration') =>
  join(process.cwd(), 'src', 'orm', name);

export const entities = readdirSync(ormFolderPath('entity')).map(
  (file_name: string) => {
    const firstSplit = file_name.split('.');
    const fn_name =
      firstSplit[0].slice(0, 1).toUpperCase() + firstSplit[0].slice(1);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module: any = require('./entity/' + file_name.replace('.ts', ''));
    return module[fn_name];
  },
);
//
export const migrations = readdirSync(ormFolderPath('migration')).map(
  (file_name: string) => {
    const firstSplit = file_name.split('.');
    const secondSplit = firstSplit[0].split('-');
    if (!secondSplit.length) return [];
    const fn_name =
      secondSplit[1].slice(0, 1).toUpperCase() +
      secondSplit[1].slice(1) +
      secondSplit[0];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module: any = require('./migration/' + file_name.replace('.ts', ''));
    return module[fn_name];
  },
);

export const dbConfig = {
  type: 'postgres',
  host: POSTGRES_HOST,
  port: +POSTGRES_PORT,
  username: POSTGRES_USERNAME,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  synchronize: false,
  logging: false,
  migrationsRun: false,
  entities,
  migrations,
};

export default new DataSource(dbConfig as any);
