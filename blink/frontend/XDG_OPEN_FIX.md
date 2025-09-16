# xdg-open Fix Documentation

## Problem
The project was encountering `spawn xdg-open ENOENT` errors in build/CI environments where the `xdg-open` command is not available.

## Root Cause
The Vite development server was configured with `open: true`, which attempts to automatically open the browser using system commands like:
- `xdg-open` on Linux
- `open` on macOS  
- `start` on Windows

These commands may not be available in headless build environments, Docker containers, or CI/CD pipelines.

## Solution Implemented

### 1. Vite Configuration Fix
**File:** `vite.config.js`
```javascript
server: {
  port: 3000,
  open: false, // Disabled auto-opening to prevent xdg-open dependency
  host: true
}
```

### 2. Environment Variable Control
**File:** `.env`
```
DISABLE_BROWSER_OPEN=true
```

### 3. Updated NPM Scripts
**File:** `package.json`
```json
{
  "scripts": {
    "dev": "DISABLE_BROWSER_OPEN=true vite",
    "start": "DISABLE_BROWSER_OPEN=true vite", 
    "dev:open": "vite",  // For local dev with browser opening
    "start:open": "vite"
  }
}
```

### 4. Cross-Platform Startup Script
**File:** `start-dev.sh`
- Detects the operating system
- Checks for available commands
- Sets appropriate environment variables
- Provides fallback behavior

## Usage

### For Development (Local)
```bash
# Without browser opening (safer)
npm run dev
npm run start

# With browser opening (if system supports it)
npm run dev:open
npm run start:open

# Using the cross-platform script
./start-dev.sh
```

### For Build/CI Environments
The default configuration now works in headless environments:
```bash
npm run build
npm run preview
```

## Benefits

1. **Cross-Platform Compatibility**: Works on Windows, macOS, Linux
2. **CI/CD Friendly**: No GUI dependencies in build environments
3. **Flexible**: Developers can still enable browser opening locally
4. **Backward Compatible**: Existing workflows still work
5. **Error Prevention**: Eliminates spawn ENOENT errors

## Environment Detection

The solution automatically detects:
- CI environments (`CI=true`)
- Build environments (`BUILD_ENV=true`)
- Available system commands
- Operating system type

## Manual Browser Opening

If you want to open the browser manually:
```bash
# The server will show the URL (usually http://localhost:3000)
# Open it manually in your browser
```

## Troubleshooting

If you still encounter issues:

1. **Check Environment Variables**:
   ```bash
   echo $DISABLE_BROWSER_OPEN
   ```

2. **Verify Vite Config**:
   Ensure `open: false` in `vite.config.js`

3. **Check Package Dependencies**:
   No additional packages required - this is a configuration fix

4. **Manual Override**:
   ```bash
   DISABLE_BROWSER_OPEN=true npm run dev
   ```

## Related Packages

These packages might also cause similar issues:
- `open` package
- `react-to-print` 
- `electron`
- Any package that spawns system processes

The current solution is focused on the Vite development server, which was the source of the xdg-open issue.