import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    WASocket
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { Boom } from '@hapi/boom';

class BaileysClient {
    private static instance: BaileysClient;
    public sock: WASocket | null = null;
    private isConnecting: boolean = false;
    private authDir: string = "./baileys_auth_info";

    private constructor() {}

    public static getInstance(): BaileysClient {
        if (!BaileysClient.instance) {
            BaileysClient.instance = new BaileysClient();
        }
        return BaileysClient.instance;
    }

    public async getSocket(): Promise<WASocket> {
        console.log('[BaileysClient] getSocket called.');
        if (this.sock) {
            console.log('[BaileysClient] Socket instance already exists.');
            return this.sock;
        }

        if (this.isConnecting) {
            console.log('[BaileysClient] Connection is in progress, waiting...');
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (this.sock) {
                        clearInterval(checkInterval);
                        console.log('[BaileysClient] Connection established, resolving promise.');
                        resolve(this.sock);
                    }
                    if(!this.isConnecting) {
                        clearInterval(checkInterval);
                        console.error('[BaileysClient] Connection failed while waiting.');
                        reject(new Error("Connection failed"));
                    }
                }, 1000);
            });
        }

        console.log('[BaileysClient] No socket, initiating new connection.');
        return this.connect();
    }

    private async connect(): Promise<WASocket> {
        this.isConnecting = true;
        console.log("[BaileysClient] Connecting to Baileys...");
        const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
        const { version } = await fetchLatestBaileysVersion();

        this.sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true
        });

        this.sock.ev.on("creds.update", saveCreds);

        this.sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("[BaileysClient] QR code generated.");
                qrcode.generate(qr, { small: true });
            }

            if (connection === "close") {
                this.isConnecting = false;
                this.sock = null;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`[BaileysClient] Connection closed. Reconnecting: ${shouldReconnect}`);
                if (shouldReconnect) {
                    this.connect();
                } else {
                    console.log("[BaileysClient] Not reconnecting: Logged out.");
                }
            }

            if (connection === "open") {
                this.isConnecting = false;
                console.log("[BaileysClient] Connection opened successfully.");
            }
        });

        return this.sock;
    }
}

export const baileysClient = BaileysClient.getInstance();
