// preload.js - Load environment variables and patch WebSocket
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the current directory
dotenv.config();

console.log('📋 preload.js loaded');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');

// ✅ Fix WebSocket for Supabase Realtime
const WebSocket = require('ws');

// Patch global WebSocket
if (!global.WebSocket) {
  global.WebSocket = WebSocket;
}

// Patch globalThis WebSocket
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

console.log('✅ WebSocket patched for Node.js 20');
