import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define process.env for browser compatibility
    'process.env': '{}',
  },
  server: {
    host: true,
    port: 5174,
    allowedHosts: ["incantations.witchcraftery.io", "witchcraftery.io", "localhost"],
    // No HTTPS inside container - Nginx handles SSL termination
    https: false,
    // Disable HMR for production to avoid WebSocket issues
    hmr: false,
  },
  build: {
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
