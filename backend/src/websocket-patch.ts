// src/websocket-patch.ts
import WebSocket from 'ws';

// Patch global WebSocket for Node.js 20
if (!globalThis.WebSocket) {
  // @ts-ignore
  globalThis.WebSocket = WebSocket;
  console.log('✅ WebSocket patched for Node.js 20');
}