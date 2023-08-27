import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "js")
    }
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      input: [
        resolve(__dirname, 'newtab.html'),
        resolve(__dirname, 'option.html'),
      ]
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
