// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  base: process.env.PUBLIC_BASE_PATH || '/',
  trailingSlash: 'ignore'
});
