const env = process.env;

export const config = {
  port: Number(env.PORT || 8001),
  hostname: env.HOST || '0.0.0.0',
  // Base URL under which /videos and /previews are publicly reachable
  publicUrl: (env.PUBLIC_URL || 'http://localhost:8001').replace(/\/+$/, ''),
  defaultAuthor: env.DEFAULT_AUTHOR || 'Unknown',
  maxUploadSize: Number(env.MAX_UPLOAD_SIZE_MB || 50) * 1024 * 1024,
  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 5432),
    username: env.DB_USERNAME || 'postgres',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'tytup',
  },
};
