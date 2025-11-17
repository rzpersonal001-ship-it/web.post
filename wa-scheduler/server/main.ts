import dotenv from 'dotenv';
dotenv.config();

import './api';
import { startScheduler } from './scheduler';
import { baileysClient } from './baileysClient';

console.log('[Main] Starting main application...');

baileysClient.getSocket()
    .then(() => {
        console.log("[Main] Baileys client is ready.");
        startScheduler();
    })
    .catch(err => {
        console.error("[Main] Failed to connect Baileys client on startup:", err);
        process.exit(1);
    });
