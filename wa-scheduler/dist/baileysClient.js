"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baileysClient = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
class BaileysClient {
    constructor() {
        this.sock = null;
        this.isConnecting = false;
        this.authDir = "./baileys_auth_info";
    }
    static getInstance() {
        if (!BaileysClient.instance) {
            BaileysClient.instance = new BaileysClient();
        }
        return BaileysClient.instance;
    }
    async getSocket() {
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
                    if (!this.isConnecting) {
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
    async connect() {
        this.isConnecting = true;
        console.log("[BaileysClient] Connecting to Baileys...");
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(this.authDir);
        const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
        this.sock = (0, baileys_1.default)({
            version,
            auth: state,
            printQRInTerminal: true
        });
        this.sock.ev.on("creds.update", saveCreds);
        this.sock.ev.on("connection.update", (update) => {
            var _a, _b;
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                console.log("[BaileysClient] QR code generated.");
                qrcode_terminal_1.default.generate(qr, { small: true });
            }
            if (connection === "close") {
                this.isConnecting = false;
                this.sock = null;
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                console.log(`[BaileysClient] Connection closed. Reconnecting: ${shouldReconnect}`);
                if (shouldReconnect) {
                    this.connect();
                }
                else {
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
exports.baileysClient = BaileysClient.getInstance();
