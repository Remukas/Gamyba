import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Import custom plugins
import { editModePlugin } from './plugins/visual-editor/vite-plugin-edit-mode.js'
import { reactInlineEditorPlugin } from './plugins/visual-editor/vite-plugin-react-inline-editor.js'
import { iframeRouteRestorationPlugin } from './plugins/vite-plugin-iframe-route-restoration.js'

export default defineConfig({
  plugins: [
    react(),
    editModePlugin(),
    reactInlineEditorPlugin(),
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