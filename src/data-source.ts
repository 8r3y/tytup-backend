import { DataSource } from 'typeorm';
import { VideoInfo } from './entities/video-info';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres' || process.env.DB_USERNAME,
  database: 'tytup' || process.env.DB_NAME,
  password: ']+]ig9MtK3ICURMoeJ' || process.env.DB_PASSWORD,
  synchronize: true,
  logging: true,
  entities: [VideoInfo],
  subscribers: [],
  migrations: [],
});
