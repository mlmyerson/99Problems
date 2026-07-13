import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base is set to the repo name for GitHub Pages project page deployment
export default defineConfig({
  plugins: [react()],
  base: '/99Problems/',
})
