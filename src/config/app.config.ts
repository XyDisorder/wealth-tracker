/**
 * App configuration
 */

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  database: {
    url: string;
  };
  worker: {
    enabled: boolean;
    pollInterval: number; // ms
    lockTimeout: number; // ms
    maxAttempts: number;
  };
}

export const appConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV || 'development') as AppConfig['nodeEnv'],
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  worker: {
    enabled: process.env.WORKER_ENABLED !== 'false',
    pollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000', 10),
    lockTimeout: parseInt(process.env.WORKER_LOCK_TIMEOUT || '300000', 10), // 5 min
    maxAttempts: parseInt(process.env.WORKER_MAX_ATTEMPTS || '3', 10),
  },
});
