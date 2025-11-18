import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client
 * Ensures only one instance exists across the application
 */
class DatabaseClient {
  private static instance: PrismaClient | null = null;
  private static isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      console.log('[Database] Creating new Prisma client instance');
      DatabaseClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });
    }
    return DatabaseClient.instance;
  }

  public static async connect(): Promise<void> {
    if (DatabaseClient.isConnecting) {
      console.log('[Database] Connection already in progress');
      return;
    }

    DatabaseClient.isConnecting = true;
    const client = DatabaseClient.getInstance();

    try {
      await client.$connect();
      console.log('[Database] Connected successfully');
    } catch (error) {
      console.error('[Database] Connection failed:', error);
      throw error;
    } finally {
      DatabaseClient.isConnecting = false;
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      console.log('[Database] Disconnecting...');
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
      console.log('[Database] Disconnected successfully');
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('[Database] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = DatabaseClient.getInstance();

// Export utility functions
export const connectDatabase = () => DatabaseClient.connect();
export const disconnectDatabase = () => DatabaseClient.disconnect();
export const databaseHealthCheck = () => DatabaseClient.healthCheck();
