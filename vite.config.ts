import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from a sub-path, so Vite's asset URLs
// need to know that sub-path in advance.
//
// This is set for the confirmed repo: github.com/us-crypto/drNaseri,
// published at us-crypto.github.io/drNaseri/ — no change needed unless
// you move the repo somewhere else later.
export default defineConfig({
  plugins: [react()],
  base: '/drNaseri/',
})
