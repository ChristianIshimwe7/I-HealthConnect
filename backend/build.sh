#!/bin/bash
echo "🔨 Building I-HealthConnect Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install types
echo "📦 Installing TypeScript types..."
npm install --save-dev @types/node @types/express @types/cors @types/jsonwebtoken @types/bcrypt @types/ws

# Build
echo "🔨 Building TypeScript..."
npm run build

# ✅ Copy preload.js to dist
echo "📋 Copying preload.js to dist..."
if [ -f preload.js ]; then
    cp preload.js dist/
    echo "✅ preload.js copied to dist/"
    ls -la dist/preload.js
else
    echo "❌ preload.js not found in root!"
    exit 1
fi

# ✅ Set environment variables for production
echo "🔑 Setting Supabase environment variables..."
export NODE_ENV=production
export PORT=3000
export SUPABASE_URL=https://nmzmkkwhtgkspfvbdxgr.supabase.co
export SUPABASE_ANON_KEY=sb_publishable_Tu-7n7V-kUpeVokv5w8rfQ_oJe9CDA7
export JWT_SECRET=afibora_super_secret_jwt_key_2026_secure

echo "✅ Build complete!"
echo "🚀 Starting server with Supabase configuration..."
node dist/server.js
