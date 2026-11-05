# moratowers

Source for [moratowers.dev](https://moratowers.dev): research and writing by Antonio Mora (@moratowers).

The first project asks whether AI agents can find a trading edge. The site opens on the name, drawn in glass. About gives the result of an audit of 53 trading ideas, with a figure of how each one ended. Story tells how the work went, month by month. Five case files are public: logical arbitrage on Polymarket, a fifteen-minute reversal, Novig favorites, the CME bitcoin futures basis, and pump.fun graduations. Rules lists the rules the work taught, most with the failure behind it. The audit's plan was frozen before its two programs were written; separately briefed AI agents wrote one to compute it and one to check every number in its table.

This site is not advice and gives no signals or trade ideas.

## How it's built

- **Astro, static.** Every page is plain HTML rendered at build time. Turn JavaScript off and you can still read every page.
- **Motion is an extra, not a requirement.** The glass word, the rain and the page transitions switch on after the page has loaded, and stay off if your system asks for reduced motion (`prefers-reduced-motion`).
- **Nothing from a CDN.** The fonts (Geist, Geist Mono, Geist Serif and IBM Plex Mono, all under the SIL Open Font License) are self-hosted in `public/fonts/`. three.js 0.170.0 and the glass model are copies in `public/vendor/` and `public/models/`, checked by sha256 in the firewall below.
- **A strict content security policy.** Each page writes its policy first in `<head>`; `scripts/cspcheck.mjs` fails the build if it moves.
- **Analytics after the page.** GoatCounter loads a second after the page has loaded, so it never blocks reading.
- **A small house-style lint.** The build fails if the rendered pages contain an em dash or a dollar sign directly before a digit (`scripts/contentlint.mjs`).

The words live in `src/content/` (the case files) and `src/data/` (every other page).

## Run it locally

You need Node 22.12 or newer and npm.

```
npm install
npm run dev        # dev server with live reload
npm run build      # astro build, then the house-style lint and the CSP check over dist/
npm run preview    # serve the built site
```

`npm install` also points git at `.githooks` (the `prepare` script). Those hooks call the content firewall below, which refuses to run without a pattern list. If you are just reading or forking the code, skip the hooks:

```
git config core.hooksPath ""
```

## Deploy

`.github/workflows/deploy.yml` builds the site on every push to `main` (and on demand) with `npm ci` and `npm run build`, so the house-style lint runs in CI, and publishes `dist/` to GitHub Pages with the official Pages actions, each pinned to a full commit SHA. It uses no secrets. `public/CNAME` names the domain.

The content firewall does not run in CI, because its pattern list never leaves my machine. It runs locally: in the git hooks on every commit, and as a full history scan before each push.

## The content firewall

Before anything is committed or published, I want a machine to check it, not my memory.

`scripts/firewall.mjs` is a scanner. Three git hooks run it: pre-commit over the staged files, commit-msg over the message, and pre-push over the whole history. Run by hand it scans `src/`, `public/`, the built output in `dist/` and the last commit message; with `--history` it scans everything a push could send: every file version in every commit, every commit message and every branch and tag name. If a line matches a banned pattern, it prints the rule name and the file, never the matched text, and exits non-zero. `package-lock.json` is exempt, since it holds no prose.

The banned-pattern list itself is not in this repository. The checker reads it from a file whose path is set in the `FIREWALL_PATTERNS` environment variable. This repo holds the checker code and never the list, because a public list of things I must not say would just be a map to them. With no list set, the scanner fails closed: it stops rather than passing everything.

```
FIREWALL_PATTERNS=/path/to/your/patterns.tsv npm run firewall
FIREWALL_PATTERNS=/path/to/your/patterns.tsv npm run firewall -- --history
```

A pattern file is one rule per line: `rule<TAB>regex<TAB>options`. A regex that starts with `(?i)` ignores case; the options are `skip=` (file extensions to skip in `dist/`) and `scope=` (path prefixes the rule applies to), each a comma-separated list. Write your own if you want the same guard on your site.

## Credits

- Typefaces: Geist, Geist Mono and Geist Serif by Vercel, under the SIL Open Font License 1.1 (`public/fonts/GEIST-OFL.txt`); IBM Plex Mono, Copyright 2017 IBM Corp., under the same license (`public/fonts/OFL.txt`).
- three.js 0.170.0, MIT (`public/vendor/three-0.170.0/LICENSE`).
- Pump.fun data: Slink Dev (slink21taken), PumpFun Launch Corpus, 2026, CC BY 4.0.

## License

Code is MIT (see `LICENSE`). The written case files and site text are CC BY-NC-ND 4.0 (see `LICENSE-CONTENT.md`). The fonts keep their OFL licenses and three.js its MIT license.
