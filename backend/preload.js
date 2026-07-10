// preload.js - Load environment variables and patch WebSocket
require('dotenv').config();

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
console.log('📋 Environment loaded:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
