import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Redirect /register and /login to include the basename /student_referral/ during local development
const devRedirectPlugin = () => ({
  name: 'dev-redirect-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ? new URL(req.url, 'http://localhost') : null;
      if (url) {
        if (url.pathname === '/register') {
          res.writeHead(302, { Location: `/student_referral/register${url.search}` });
          res.end();
          return;
        }
        if (url.pathname === '/login') {
          res.writeHead(302, { Location: `/student_referral/login${url.search}` });
          res.end();
          return;
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  base: '/student_referral/',
  plugins: [react(), devRedirectPlugin()],
})
