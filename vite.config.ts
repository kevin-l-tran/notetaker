import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.keep': 'text'
      }
    }
  },
  assetsInclude: ['**/*.keep'],
  resolve: {
    dedupe: ["@codemirror/state","@codemirror/view","@codemirror/language","@lezer/common"],
  },
})
