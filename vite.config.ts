import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

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

/**
 * Makes Tracker an installable app: the manifest (name, icons, full screen) and a service worker
 * that keeps a copy of the app on the phone, so it opens without a connection.
 */
const pwa = VitePWA({
  registerType: 'autoUpdate', // a new version replaces the old one on the next launch
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: {
    name: 'Tracker',
    short_name: 'Tracker',
    description: 'Check in on the days that count.',
    theme_color: '#2f6fdb',
    background_color: '#ffffff',
    display: 'standalone', // full screen, without the browser's address bar
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: 'icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/tracker/',
  plugins: [vue(), vueDevTools(), contentSecurityPolicy(), pwa],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
