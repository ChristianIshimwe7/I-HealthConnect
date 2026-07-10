// web/api/ping.js

export default function handler() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}