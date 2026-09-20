import type { NextConfig } from 'next';

/**
 * Evaluated once when the dev server starts or a build begins. On Vercel a production
 * build only runs after a merge lands on the deploy branch, so this is the date the live
 * site was last deployed — not the visitor's clock. Same approach as the __BUILD_TIME__
 * define in the portfolio's vite.config.js.
 */
const BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    // Inlined at build time. Public because the footer that renders it is a client
    // component; a deploy timestamp is not sensitive.
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
  },
};

export default nextConfig;
