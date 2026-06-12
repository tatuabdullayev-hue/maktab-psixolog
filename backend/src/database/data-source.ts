import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ALL_ENTITIES } from './entities/entities.list';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'psixolog',
  password: process.env.DB_PASSWORD || 'psixolog2024',
  database: process.env.DB_DATABASE || 'maktab_psixolog_db',
  entities: ALL_ENTITIES,
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
