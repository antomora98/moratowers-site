import { GOATCOUNTER_CODE } from '../config';

// The content security policy, delivered as a <meta> tag because GitHub Pages sets no headers. Base.astro and the
// /case/ redirect write it as the first element of the head, so it governs every stylesheet, preload and script on
// the page. (Astro's own CSP option writes the tag at the end of the head, after the stylesheets and preloads, so it
// is off; see astro.config.mjs.) No script or style here is processed by Astro: the inline scripts are is:inline, and
// their sha256 hashes are listed below. scripts/cspcheck.mjs fails the build when the tag is not first, when an
// inline script is missing from the list, or when a script or stylesheet is not same-origin.
const goatcounter = GOATCOUNTER_CODE ? ` https://${GOATCOUNTER_CODE}.goatcounter.com` : '';
const SCRIPT_HASHES = [
  // The strings live in src/lib/inline.ts.
  'sha256-xu+cL2Kg4vX6DHnAPuOf3AK5kgxE2XU5UFwzOyUjYNY=', // MOTION_PLAIN: About, Story, the cases
  'sha256-4z6dXYjnHVHxnjVllUPB3c6XjI7E+SQX1qohtJQHH6I=', // MOTION_LANDING: the landing
  'sha256-MSn8RKOcdayyMVMKbxP8mhsazDo9hWofkpnSVQsYbIo=', // MOTION_RULES: Rules
  'sha256-qSU+ifBqUoi7QaH/v6EocCEUwYbBT+2P4agPDT8ApNE=', // IMPORTMAP: three.js from /vendor/ (the landing, the 404)
  'sha256-eJOh0TP+0fUG7bBfGpI8L/H9EY3/r4TWUxfUgYGsDKQ=', // CASE_REDIRECT: /case/
  ...(GOATCOUNTER_CODE ? ['sha256-+uyItYcpIsRQhh5M70YiRL1TrkX92JLv7PlPFxuP8ow='] : []), // Base.astro: the GoatCounter loader
];
export const CSP = [
  "default-src 'none'",
  "font-src 'self'",
  `img-src 'self'${goatcounter}`,
  `connect-src 'self'${goatcounter}`,
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  ['script-src', "'self'", ...SCRIPT_HASHES.map((h) => `'${h}'`)].join(' '),
  // No <style> element anywhere; the HTML style attributes (the figures' fills and strokes, the /case/ redirect page,
  // and those three.js and the scripts set) are allowed by 'unsafe-inline' on style-src-attr only.
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
].join('; ');
