"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
require("./api");
const scheduler_1 = require("./scheduler");
const baileysClient_1 = require("./baileysClient");
console.log('[Main] Starting main application...');
baileysClient_1.baileysClient.getSocket()
    .then(() => {
    console.log("[Main] Baileys client is ready.");
    (0, scheduler_1.startScheduler)();
})
    .catch(err => {
    console.error("[Main] Failed to connect Baileys client on startup:", err);
    process.exit(1);
});
