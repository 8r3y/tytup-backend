import { DataSource } from 'typeorm';
import { VideoInfo } from './entities/video-info';
import { config } from './config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...config.db,
  synchronize: true,
  logging: true,
  entities: [VideoInfo],
  subscribers: [],
  migrations: [],
});
