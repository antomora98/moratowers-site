import { z } from 'astro/zod';
import rawPages from '../data/pages.json';
import rawCases from '../data/cases.json';
import rawEvals from '../data/evals.json';
import { text } from './schema';

// The text of About, the cases page, Story, Rules, Evals, the landing and the case pages that the case files, landing.json and
// timeline.json do not hold: copied word for word from the approved design and copy. Parsed here, so a bad
// file fails the build.
const link = z.object({ label: text, href: z.string().url() });
// A link on this site (a path) or to another one (https).
const href = z.string().refine((s) => s.startsWith('/') || s.startsWith('https://'), 'a path or an https URL');
const slugRef = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const meta = z.object({ title: text, description: text.optional() });
export const pagesSchema = z.object({
  // The cases page's description is its question and result (case/index.astro).
  meta: z.object({ landing: meta, about: meta, cases: meta, story: meta, rules: meta, evals: meta, notfound: meta }),
  // lede is the landing's line under the mark. ways: the two questions, each a command, its question and one line on
  // how it is tested (how), every sentence copied from an inner page.
  landing: z.object({ lede: text, ways: z.array(z.object({ label: text, href: z.string().startsWith('/'), text, how: text })).min(1) }),
  about: z.object({
    // lines: who I am, one paragraph each. ways: the two ways on, a command and its question each.
    lines: z.array(text).min(1),
    photo_alt: text,
    ways: z.array(z.object({ label: text, href: z.string().startsWith('/'), text })).min(1),
    not_advice: text,
    contact: z.object({ h: text, intro: text, channels: z.array(z.object({ label: text, href, me: z.boolean() })).min(1) }),
  }),
  // /case/, the cases page: the trading question and its result, the audit and luck lines, fig. 1's caption (its text
  // only; the page prints "fig. 1" before it), the line
  // over the five cases and the ledger's row under them, then what is next and what would help.
  cases: z.object({
    prompt: text, h1: text, question: text, result: text, results: z.array(text), luck: text, figure_caption: text,
    list_intro: text, ledger: z.object({ label: text, href: z.string().startsWith('/'), text }),
    next: z.object({ h: text, date: text, items: z.array(text).min(1) }),
    help: z.object({ h: text, intro: text, items: z.array(z.object({ text, case: slugRef.optional() })).min(1) }),
  }),
  // The link to About's contact section, in the footer of every inner page.
  contact_link: z.object({ label: text, href: z.string().startsWith('/about/#') }),
  // The footer's line (WordFooter.astro): the name and 'updated' before the date, then the error log; contact_link
  // follows it.
  footer: z.object({ errors: z.object({ label: text, href: z.string().startsWith('/') }), updated: text }),
  // The menu on every page, in order (TopNav.astro).
  nav: z.array(z.object({ label: text, href: z.string().startsWith('/') })).min(1),
  outside: z.array(link),
  // Story's headings: each covers about.story[from..to] (landing.json), checked in story.astro.
  story: z.object({ sections: z.array(z.object({ h: text, sub: text.optional(), from: z.number().int().positive(), to: z.number().int().positive() })).min(1), timeline_label: text, ledgers: z.record(z.string(), z.object({ label: text, rows: z.array(z.tuple([text, text])) })) }),
  rules: z.object({
    intro: text, vet_before: text, vet_word: text, vet_after: text, learned: text, vet_href: z.string().url(),
    vet_anchors: z.record(z.string(), z.string().regex(/^[a-z0-9-]+$/)),
    skills: z.record(z.string(), z.object({ name: text, href: z.string().url() })),
    taught: z.record(z.string(), text),
  }),
  // The text of the old /evals/ list page. /evals/ now forwards to the first eval card (evals.astro), so nothing shows
  // this; it is kept until Antonio says where its approved lines go.
  evals: z.object({
    prompt: text, h1: text, intro: z.array(text).min(1),
    items: z.array(z.object({ label: text, href, text })).min(1),
    end: z.object({ label: text, href: z.string().startsWith('/') }),
  }),
  notfound: z.object({ h1: text, back: text }),
  case: z.object({ audit: z.array(text), audit_label: text }),
});
export const casesSchema = z.record(z.string(), z.object({
  description: text,
  number: z.object({ cells: text, rest: text, sr: text, match: text.optional(), note: text }),
  caption: text,
  attribution: text.optional(),
}));
// The eval cards' extras (evals.json), as cases.json is for the trading cases: the plain word beside each card's mark,
// the number, and the caption of the card's figure (src/lib/charts.ts draws it and returns this caption).
export const evalsSchema = z.record(z.string(), z.object({
  word: text,
  number: z.object({ cells: text, rest: text, sr: text, match: text.optional(), note: text }),
  caption: text.optional(),
}));
export const pages = pagesSchema.parse(rawPages);
export const caseExtras = casesSchema.parse(rawCases);
export const evalExtras = evalsSchema.parse(rawEvals);
