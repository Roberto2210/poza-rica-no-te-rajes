import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useHttpsTunnel = env.VITE_USE_HTTPS_TUNNEL === '1'   // actívalo solo cuando uses ngrok/https

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: useHttpsTunnel ? ['.ngrok-free.app', '.railway.app'] : true,
      hmr: useHttpsTunnel ? { clientPort: 443 } : true   // ⬅️ en local NO fuerza 443
    },
    preview: {
      host: true,
      port: 8080,
      allowedHosts: useHttpsTunnel ? ['.ngrok-free.app', '.railway.app'] : true
      // no pongas clientPort aquí
    }
  }
})
