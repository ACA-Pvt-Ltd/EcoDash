#!/bin/bash

# Performance-Optimized Android Build Script
# This script builds an optimized release APK with all performance enhancements

echo "🚀 Starting Performance-Optimized Android Build..."
echo ""

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build
rm -rf node_modules/.cache
echo "✅ Clean complete"
echo ""

# Step 2: Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Step 3: Clear Metro bundler cache
echo "🗑️  Clearing Metro cache..."
npx expo start -c &
EXPO_PID=$!
sleep 3
kill $EXPO_PID 2>/dev/null
echo "✅ Cache cleared"
echo ""

# Step 4: Decide whether Sentry can upload source maps
# sentry-cli fails the whole build if it has no org/project/token, and
# android/sentry.properties is a stub that defers to these env vars. Skip the
# upload unless all three are present — set them and the upload runs again
# automatically, no change needed here.
if [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_PROJECT" ] && [ -n "$SENTRY_AUTH_TOKEN" ]; then
    echo "📡 Sentry credentials found — source maps will be uploaded"
    SENTRY_STATUS="ENABLED"
else
    export SENTRY_DISABLE_AUTO_UPLOAD=true
    echo "⚠️  Sentry source map upload SKIPPED (SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN not set)"
    echo "   Crash reporting still works, but release stack traces will be minified."
    SENTRY_STATUS="SKIPPED"
fi
echo ""

# Step 5: Build the release APK
echo "🔨 Building release APK..."
echo "   - Hermes engine: ENABLED"
echo "   - ProGuard: ENABLED"
echo "   - Optimizations: ENABLED"
echo "   - Sentry source maps: $SENTRY_STATUS"
echo ""

cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📱 APK Location:"
    echo "   android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📊 APK Size:"
    ls -lh app/build/outputs/apk/release/app-release.apk | awk '{print "   " $5}'
    echo ""
    echo "🎉 Your optimized APK is ready!"
    echo ""
    echo "To install on device:"
    echo "   adb install -r app/build/outputs/apk/release/app-release.apk"
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
