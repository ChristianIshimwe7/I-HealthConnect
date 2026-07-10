// Type declaration to fix WebSocket conflicts
declare module 'ws' {
  const WebSocket: any;
  export = WebSocket;
}
