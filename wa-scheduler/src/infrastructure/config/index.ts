import dotenv from 'dotenv';
import { AppConfig } from '@/types';

// Load environment variables
dotenv.config();

/**
 * Validates and returns application configuration
 * Throws error if required environment variables are missing
 */
export function getConfig(): AppConfig {
  const requiredEnvVars = ['DATABASE_URL'];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    database: {
      url: process.env.DATABASE_URL!,
    },
    whatsapp: {
      sessionPath: process.env.WHATSAPP_SESSION_PATH || './baileys_auth_info',
      reconnectInterval: parseInt(process.env.WHATSAPP_RECONNECT_INTERVAL || '5000', 10),
      maxReconnectAttempts: parseInt(process.env.WHATSAPP_MAX_RECONNECT_ATTEMPTS || '10', 10),
    },
    api: {
      port: parseInt(process.env.API_PORT || '3001', 10),
      secret: process.env.API_SECRET || 'default-secret-change-me',
      cronSecret: process.env.CRON_SECRET || 'default-cron-secret-change-me',
    },
    scheduler: {
      interval: parseInt(process.env.SCHEDULER_INTERVAL || '60000', 10),
      jobBufferDays: parseInt(process.env.SCHEDULER_JOB_BUFFER_DAYS || '30', 10),
      enabled: process.env.SCHEDULER_ENABLED !== 'false',
    },
    app: {
      timezone: process.env.APP_TIMEZONE || 'Asia/Pontianak',
      nodeEnv: process.env.NODE_ENV || 'development',
      storagePath: process.env.STORAGE_PATH || './storage',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      filePath: process.env.LOG_FILE_PATH || './logs',
    },
  };
}

/**
 * Singleton configuration instance
 */
let configInstance: AppConfig | null = null;

export function config(): AppConfig {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}

/**
 * Validates configuration on startup
 */
export function validateConfig(): void {
  try {
    const cfg = getConfig();
    console.log('[Config] Configuration validated successfully');
    console.log(`[Config] Environment: ${cfg.app.nodeEnv}`);
    console.log(`[Config] Timezone: ${cfg.app.timezone}`);
    console.log(`[Config] Scheduler enabled: ${cfg.scheduler.enabled}`);
  } catch (error) {
    console.error('[Config] Configuration validation failed:', error);
    throw error;
  }
}
