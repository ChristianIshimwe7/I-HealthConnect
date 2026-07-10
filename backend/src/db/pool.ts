// src/db/pool.ts
import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Query helper function
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query:', { text: text.substring(0, 60), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

// Get client for transactions
export const getClient = async () => {
  return await pool.connect();
};

export default pool;
