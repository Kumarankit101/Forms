import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Print the backend URL to the console
  console.log(`Backend URL: ${env.VITE_API_URL}`);

  return {
    root: './client',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@shared': path.resolve(__dirname, './shared')
      }
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true
    },
    server: {
      port: 5138,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
