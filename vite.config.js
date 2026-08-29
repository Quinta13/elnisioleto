import { defineConfig } from 'vite';

// In produzione la GitHub Action passa BASE_PATH = "/nome-repo/" così il sito
// funziona anche su https://USERNAME.github.io/nome-repo/. In locale resta "/".
export default defineConfig({
  base: process.env.BASE_PATH || '/',
});
