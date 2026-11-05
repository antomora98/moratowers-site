import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The content security policy lives in src/lib/csp.ts and is written by the pages themselves as the first element of
// the head. Astro's security.csp option is not used: it writes the tag at the end of the head, after the stylesheets
// and preloads, which a meta policy does not cover. scripts/cspcheck.mjs checks the tag on every built page.
const SITE = 'https://moratowers.dev';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  // The sitemap lists canonical pages only: /case/ only redirects to case 1.
  integrations: [sitemap({ filter: (page) => page !== `${SITE}/case/` })],
});
