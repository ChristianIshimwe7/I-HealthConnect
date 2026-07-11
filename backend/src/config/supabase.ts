import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('✅ Using hardcoded Supabase credentials from config');
}

// Create Supabase client with WebSocket transport - using type assertion to bypass TypeScript issues
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    // @ts-ignore - TypeScript type mismatch between ws and browser WebSocket
    transport: WebSocket
  }
});

export default supabase;
