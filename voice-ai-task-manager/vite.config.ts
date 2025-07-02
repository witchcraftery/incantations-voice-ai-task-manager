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
  server: {
    // Disable HTTPS for development to avoid certificate issues
    https: false,
    host: '0.0.0.0',
    port: process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT) : 5174,
    allowedHosts: [
      'incantations.witchcraftery.io',
      '.witchcraftery.io',  // Allow all subdomains
      'localhost',
      '127.0.0.1'
    ]
  },
})