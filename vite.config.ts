import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * Content Security Policy: the only places the app may load code from and talk to.
 * GitHub Pages can't send HTTP headers, so it goes into index.html as a <meta> tag.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Our own bundle, plus the Google script Firebase loads for the sign-in popup.
  "script-src 'self' https://apis.google.com",
  // Firebase Authentication and Firestore are all *.googleapis.com.
  "connect-src 'self' https://*.googleapis.com",
  // The hidden sign-in frame Firebase opens on its own domain, and Google's account picker.
  'frame-src https://tracker-cc170.firebaseapp.com https://accounts.google.com',
  "img-src 'self' data:",
  "style-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/** Adds the CSP to the built index.html only, so the dev server and its tools keep working. */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/tracker/',
  plugins: [vue(), vueDevTools(), contentSecurityPolicy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
