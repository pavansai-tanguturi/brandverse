#!/bin/bash

# Cross-platform development server startup script
# This script prevents xdg-open issues in different environments

echo "🚀 Starting Brandverse Frontend Development Server..."

# Set environment variable to disable browser auto-opening
export DISABLE_BROWSER_OPEN=true

# Check if we're in a CI/build environment
if [ "$CI" = "true" ] || [ "$BUILD_ENV" = "true" ]; then
    echo "📦 Build environment detected - browser opening disabled"
    export DISABLE_BROWSER_OPEN=true
fi

# Check operating system and adjust accordingly
case "$(uname -s)" in
    Linux*)
        echo "🐧 Linux environment detected"
        if ! command -v xdg-open &> /dev/null; then
            echo "⚠️  xdg-open not available - browser opening disabled"
            export DISABLE_BROWSER_OPEN=true
        fi
        ;;
    Darwin*)
        echo "🍎 macOS environment detected"
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
        echo "🪟 Windows environment detected"
        ;;
    *)
        echo "❓ Unknown environment - browser opening disabled for safety"
        export DISABLE_BROWSER_OPEN=true
        ;;
esac

# Start the development server
echo "🌐 Starting Vite development server on http://localhost:3000"
echo "📱 Mobile access available on your network IP"
echo ""

npm run dev