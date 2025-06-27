import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from "fs"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Check if SSL certificates exist
    https: process.env.VITE_DISABLE_HTTPS === 'true' ? false : {
      key: fs.existsSync('./ssl/localhost-key.pem') 
        ? fs.readFileSync('./ssl/localhost-key.pem')
        : fs.existsSync('../docker/ssl/localhost-key.pem')
        ? fs.readFileSync('../docker/ssl/localhost-key.pem')
        : undefined,
      cert: fs.existsSync('./ssl/localhost-cert.pem')
        ? fs.readFileSync('./ssl/localhost-cert.pem') 
        : fs.existsSync('../docker/ssl/localhost-cert.pem')
        ? fs.readFileSync('../docker/ssl/localhost-cert.pem')
        : undefined,
    },
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
  },
})
