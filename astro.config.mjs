// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  server: {
    host: true,
    port: 4321
  },
  vite: {
    plugins: [tailwindcss()]
  },
  output: "server",
  adapter: cloudflare(),
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile',
    },
  },
});