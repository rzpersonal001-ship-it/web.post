import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  WASocket,
  ConnectionState,
  proto,
  delay,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { config } from '../config';
import { IWhatsAppService } from '@/types';

/**
 * Singleton WhatsApp Baileys Client
 * Implements proper connection management, reconnection strategy, and message sending
 */
class BaileysWhatsAppService implements IWhatsAppService {
  private static instance: BaileysWhatsAppService | null = null;
  private socket: WASocket | null = null;
  private isConnecting: boolean = false;
  private isInitialized: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectInterval: number;
  private readonly authDir: string;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    const cfg = config();
    this.authDir = cfg.whatsapp.sessionPath;
    this.reconnectInterval = cfg.whatsapp.reconnectInterval;
    this.maxReconnectAttempts = cfg.whatsapp.maxReconnectAttempts;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BaileysWhatsAppService {
    if (!BaileysWhatsAppService.instance) {
      console.log('[WhatsApp] Creating new Baileys service instance');
      BaileysWhatsAppService.instance = new BaileysWhatsAppService();
    }
    return BaileysWhatsAppService.instance;
  }

  /**
   * Initialize WhatsApp connection
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.socket) {
      console.log('[WhatsApp] Already initialized and connected');
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('[WhatsApp] Connection in progress, waiting...');
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.isInitialized && this.socket !== null;
  }

  /**
   * Send text message
   */
  public async sendTextMessage(to: string, text: string): Promise<void> {
    await this.ensureConnected();
    
    const jid = await this.getJid(to);
    console.log(`[WhatsApp] Sending text message to ${jid}`);
    
    await this.socket!.sendMessage(jid, { text });
    console.log(`[WhatsApp] Text message sent successfully to ${jid}`);
  }

  /**
   * Send image message
   */
  public async sendImageMessage(to: string, buffer: Buffer, caption?: string): Promise<void> {
    await this.ensureConnected();
    
    const jid = await this.getJid(to);
    console.log(`[WhatsApp] Sending image message to ${jid}`);
    
    await this.socket!.sendMessage(jid, {
      image: buffer,
      caption: caption || '',
    });
    console.log(`[WhatsApp] Image message sent successfully to ${jid}`);
  }

  /**
   * Send video message
   */
  public async sendVideoMessage(to: string, buffer: Buffer, caption?: string): Promise<void> {
    await this.ensureConnected();
    
    const jid = await this.getJid(to);
    console.log(`[WhatsApp] Sending video message to ${jid}`);
    
    await this.socket!.sendMessage(jid, {
      video: buffer,
      caption: caption || '',
    });
    console.log(`[WhatsApp] Video message sent successfully to ${jid}`);
  }

  /**
   * Disconnect from WhatsApp
   */
  public async disconnect(): Promise<void> {
    if (this.socket) {
      console.log('[WhatsApp] Disconnecting...');
      await this.socket.logout();
      this.socket = null;
      this.isInitialized = false;
      this.isConnecting = false;
      console.log('[WhatsApp] Disconnected successfully');
    }
  }

  /**
   * Get socket instance (for advanced usage)
   */
  public getSocket(): WASocket | null {
    return this.socket;
  }

  /**
   * Internal: Establish connection
   */
  private async connect(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;
    console.log('[WhatsApp] Initializing Baileys connection...');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        logger: this.createLogger(),
      });

      // Setup event handlers
      this.socket.ev.on('creds.update', saveCreds);
      this.socket.ev.on('connection.update', this.handleConnectionUpdate.bind(this));

      // Wait for connection to open
      await this.waitForConnection();

      this.isInitialized = true;
      this.reconnectAttempts = 0;
      console.log('[WhatsApp] Connection established successfully');
    } catch (error) {
      this.isConnecting = false;
      this.socket = null;
      console.error('[WhatsApp] Connection failed:', error);
      throw error;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Handle connection updates
   */
  private handleConnectionUpdate(update: Partial<ConnectionState>): void {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('[WhatsApp] QR Code generated. Please scan with WhatsApp mobile app.');
    }

    if (connection === 'close') {
      this.isInitialized = false;
      this.socket = null;

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WhatsApp] Connection closed. Status code: ${statusCode}`);

      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const backoffDelay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(
          `[WhatsApp] Reconnecting in ${backoffDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );

        setTimeout(() => {
          this.connect().catch(err => {
            console.error('[WhatsApp] Reconnection failed:', err);
          });
        }, backoffDelay);
      } else if (!shouldReconnect) {
        console.log('[WhatsApp] Logged out. Manual re-authentication required.');
      } else {
        console.error('[WhatsApp] Max reconnection attempts reached. Giving up.');
      }
    }

    if (connection === 'open') {
      this.isInitialized = true;
      this.reconnectAttempts = 0;
      console.log('[WhatsApp] Connection opened successfully');
    }
  }

  /**
   * Wait for connection to establish
   */
  private async waitForConnection(): Promise<void> {
    const maxWaitTime = 120000; // 2 minutes
    const checkInterval = 1000;
    let elapsed = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.isInitialized && this.socket) {
          clearInterval(interval);
          resolve();
        } else if (elapsed >= maxWaitTime) {
          clearInterval(interval);
          reject(new Error('Connection timeout'));
        } else if (!this.isConnecting) {
          clearInterval(interval);
          reject(new Error('Connection failed'));
        }
        elapsed += checkInterval;
      }, checkInterval);
    });
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isInitialized || !this.socket) {
      console.log('[WhatsApp] Not connected, initializing...');
      await this.initialize();
    }

    if (!this.socket) {
      throw new Error('WhatsApp client not connected');
    }
  }

  /**
   * Get JID for phone number or group
   */
  private async getJid(identifier: string): Promise<string> {
    // If already a JID, return as is
    if (identifier.includes('@')) {
      return identifier;
    }

    // Check if it's a group ID
    if (identifier.endsWith('@g.us')) {
      return identifier;
    }

    // Assume it's a phone number, verify it's on WhatsApp
    const results = await this.socket!.onWhatsApp(identifier);
    
    if (!results || results.length === 0 || !results[0]?.exists) {
      throw new Error(`Phone number is not registered on WhatsApp: ${identifier}`);
    }

    return results[0].jid;
  }

  /**
   * Create logger for Baileys
   */
  private createLogger() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const shouldLog = logLevel === 'debug';

    return {
      level: shouldLog ? 'debug' : 'silent',
      debug: (...args: any[]) => shouldLog && console.debug('[Baileys Debug]', ...args),
      info: (...args: any[]) => shouldLog && console.info('[Baileys Info]', ...args),
      warn: (...args: any[]) => console.warn('[Baileys Warn]', ...args),
      error: (...args: any[]) => console.error('[Baileys Error]', ...args),
      fatal: (...args: any[]) => console.error('[Baileys Fatal]', ...args),
      trace: (...args: any[]) => shouldLog && console.trace('[Baileys Trace]', ...args),
      child: () => this.createLogger(),
    };
  }
}

// Export singleton instance
export const whatsappService = BaileysWhatsAppService.getInstance();
