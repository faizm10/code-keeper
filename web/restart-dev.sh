#!/bin/bash
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next dev" || true
pkill -f "next-server" || true

echo "🧹 Cleaning caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

echo "✅ Caches cleared!"
echo ""
echo "📋 Current .env.local contents:"
cat .env.local | grep SUPABASE
echo ""
echo "🚀 Now restart your dev server with: npm run dev"
