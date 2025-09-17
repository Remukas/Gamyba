import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Import custom plugins
import inlineEditDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js'
import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js'
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js'

export default defineConfig({
  plugins: [
    react(),
    inlineEditDevPlugin(),
    inlineEditPlugin(),
    iframeRouteRestorationPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true
  }
})