import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://nmzmkkwhtgkspfvbdxgr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('✅ Using hardcoded Supabase credentials from config');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
