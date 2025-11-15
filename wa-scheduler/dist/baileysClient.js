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
exports.startBaileys = startBaileys;
exports.getSocket = getSocket;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
let sock;
async function startBaileys() {
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)("baileys_auth_info");
    const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
    sock = (0, baileys_1.default)({
        version,
        auth: state,
        printQRInTerminal: true,
    });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
        var _a, _b;
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("QR Code diterima, silakan pindai:");
            qrcode_terminal_1.default.generate(qr, { small: true });
        }
        if (connection === "close") {
            const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
            console.log("Koneksi ditutup karena:", lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error, ", menyambungkan kembali:", shouldReconnect);
            if (shouldReconnect) {
                startBaileys();
            }
        }
        else if (connection === "open") {
            console.log("Koneksi WhatsApp terbuka");
        }
    });
    return sock;
}
function getSocket() {
    if (!sock) {
        throw new Error("Baileys client is not initialized. Call startBaileys() first.");
    }
    return sock;
}
