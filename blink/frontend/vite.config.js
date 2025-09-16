import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: process.env.NODE_ENV === 'development' && process.env.DISABLE_BROWSER_OPEN !== 'true' ? false : false, // Disable auto-opening browser to avoid xdg-open dependency
    host: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    // Fix for some packages that expect process.env
    global: 'globalThis',
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
})