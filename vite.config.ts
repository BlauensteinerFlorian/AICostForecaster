import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is set for GitHub Pages project-page hosting (https://<user>.github.io/AICostForecaster/).
// Override via the BASE_PATH env var when deploying elsewhere (e.g. a custom domain → "/").
const base = process.env.BASE_PATH ?? '/AICostForecaster/';

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
});
