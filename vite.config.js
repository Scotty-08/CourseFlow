import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built site works from any folder, such as
  // https://scotty-08.github.io/CourseFlow/ on GitHub Pages.
  base: './',
  plugins: [react(), tailwindcss()],
})