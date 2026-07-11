import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

console.log('📊 Connecting to database...');

// Create pool with proper configuration for Supabase
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection on first use
pool.on('connect', (client) => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

// Query helper with better error handling
export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms`);
    return result;
  } catch (error: any) {
    console.error('❌ Query error:', error.message);
    console.error('❌ Query text:', text.substring(0, 200));
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};

export default pool;
