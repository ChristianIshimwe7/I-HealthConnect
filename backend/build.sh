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

echo "✅ Build complete!"
