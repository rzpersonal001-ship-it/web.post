import { MediaType, ScheduleType, JobStatus, DestinationType } from '@prisma/client';

// Domain Types
export interface IPost {
  id: string;
  categoryId?: string | null;
  title?: string | null;
  caption: string;
  mediaType: MediaType;
  mediaUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchedule {
  id: string;
  name?: string | null;
  postId: string;
  scheduleType: ScheduleType;
  timeOfDay: string;
  startDate: Date;
  endDate?: Date | null;
  daysOfWeek?: string | null;
  daysOfMonth?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledJob {
  id: string;
  scheduleId?: string | null;
  postId: string;
  scheduledAt: Date;
  status: JobStatus;
  sentAt?: Date | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWhatsAppConfig {
  id: string;
  phoneNumberId: string;
  destinationType: DestinationType;
  destinationIdentifier: string;
  timezone: string;
  defaultDailyTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Service Interfaces
export interface IWhatsAppService {
  initialize(): Promise<void>;
  isConnected(): boolean;
  sendTextMessage(to: string, text: string): Promise<void>;
  sendImageMessage(to: string, buffer: Buffer, caption?: string): Promise<void>;
  sendVideoMessage(to: string, buffer: Buffer, caption?: string): Promise<void>;
  disconnect(): Promise<void>;
}

export interface ISchedulerService {
  generateJobsForSchedule(schedule: ISchedule, daysAhead: number): Promise<number>;
  processSchedule(schedule: ISchedule): Promise<void>;
}

export interface IJobService {
  processPendingJobs(): Promise<number>;
  sendJob(job: IScheduledJob): Promise<boolean>;
}

// Repository Interfaces
export interface IPostRepository {
  findById(id: string): Promise<IPost | null>;
  findAll(filters?: PostFilters): Promise<IPost[]>;
  create(data: CreatePostData): Promise<IPost>;
  update(id: string, data: UpdatePostData): Promise<IPost>;
  delete(id: string): Promise<void>;
}

export interface IScheduleRepository {
  findById(id: string): Promise<ISchedule | null>;
  findAll(filters?: ScheduleFilters): Promise<ISchedule[]>;
  findActive(): Promise<ISchedule[]>;
  create(data: CreateScheduleData): Promise<ISchedule>;
  update(id: string, data: UpdateScheduleData): Promise<ISchedule>;
  delete(id: string): Promise<void>;
}

export interface IScheduledJobRepository {
  findById(id: string): Promise<IScheduledJob | null>;
  findPending(limit?: number): Promise<IScheduledJob[]>;
  findByScheduleId(scheduleId: string): Promise<IScheduledJob[]>;
  create(data: CreateJobData): Promise<IScheduledJob>;
  createMany(data: CreateJobData[]): Promise<number>;
  update(id: string, data: UpdateJobData): Promise<IScheduledJob>;
  delete(id: string): Promise<void>;
}

export interface IWhatsAppConfigRepository {
  findFirst(): Promise<IWhatsAppConfig | null>;
  create(data: CreateWhatsAppConfigData): Promise<IWhatsAppConfig>;
  update(id: string, data: UpdateWhatsAppConfigData): Promise<IWhatsAppConfig>;
}

// Data Transfer Objects
export interface PostFilters {
  categoryId?: string;
  mediaType?: MediaType;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ScheduleFilters {
  postId?: string;
  scheduleType?: ScheduleType;
  isActive?: boolean;
}

export interface CreatePostData {
  categoryId?: string;
  title?: string;
  caption: string;
  mediaType: MediaType;
  mediaUrl: string;
  isActive?: boolean;
}

export interface UpdatePostData {
  categoryId?: string;
  title?: string;
  caption?: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  isActive?: boolean;
}

export interface CreateScheduleData {
  name?: string;
  postId: string;
  scheduleType: ScheduleType;
  timeOfDay: string;
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: string;
  daysOfMonth?: string;
  isActive?: boolean;
}

export interface UpdateScheduleData {
  name?: string;
  scheduleType?: ScheduleType;
  timeOfDay?: string;
  startDate?: Date;
  endDate?: Date;
  daysOfWeek?: string;
  daysOfMonth?: string;
  isActive?: boolean;
}

export interface CreateJobData {
  scheduleId?: string;
  postId: string;
  scheduledAt: Date;
  status?: JobStatus;
}

export interface UpdateJobData {
  status?: JobStatus;
  sentAt?: Date;
  errorMessage?: string;
}

export interface CreateWhatsAppConfigData {
  phoneNumberId: string;
  destinationType: DestinationType;
  destinationIdentifier: string;
  timezone?: string;
  defaultDailyTime?: string;
}

export interface UpdateWhatsAppConfigData {
  phoneNumberId?: string;
  destinationType?: DestinationType;
  destinationIdentifier?: string;
  timezone?: string;
  defaultDailyTime?: string;
}

// Configuration Types
export interface AppConfig {
  database: {
    url: string;
  };
  whatsapp: {
    sessionPath: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
  api: {
    port: number;
    secret: string;
    cronSecret: string;
  };
  scheduler: {
    interval: number;
    jobBufferDays: number;
    enabled: boolean;
  };
  app: {
    timezone: string;
    nodeEnv: string;
    storagePath: string;
  };
  logging: {
    level: string;
    filePath: string;
  };
}

// Utility Types
export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export interface ScheduleGenerationResult {
  jobsCreated: number;
  nextScheduledDate?: Date;
  error?: string;
}

export interface JobProcessingResult {
  success: boolean;
  jobsProcessed: number;
  jobsFailed: number;
  errors: string[];
}

export interface WhatsAppSendResult {
  success: boolean;
  error?: string;
  messageId?: string;
}
