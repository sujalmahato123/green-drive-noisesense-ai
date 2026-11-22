/**
 * Backend base URL.
 *
 * - Local dev: leave VITE_API_URL unset; requests go to relative /api/... and Vite proxies them
 *   to http://localhost:8000 (see vite.config.js).
 * - Production (Vercel): set VITE_API_URL to the Render backend, e.g.
 *   https://green-drive-noisesense-api.onrender.com  (no trailing slash, no /api suffix)
 *
 * Vite inlines VITE_* variables at build time, so redeploy the frontend after changing it.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

// True when the app talks to a remote backend (which may need a cold start on free hosting)
export const REMOTE_API = API_BASE !== ''

export const apiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
