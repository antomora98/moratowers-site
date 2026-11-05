import { z } from 'astro/zod';
import rawPages from '../data/pages.json';
import rawCases from '../data/cases.json';
import { text } from './schema';

// The text of About, Story, Rules, the landing and the case pages that the case files, landing.json and
// timeline.json do not hold: copied word for word from the approved design. Parsed here, so a bad
// file fails the build.
const link = z.object({ label: text, href: z.string().url() });
const meta = z.object({ title: text, description: text.optional() });
export const pagesSchema = z.object({
  meta: z.object({ landing: meta, about: meta, story: meta, rules: meta, notfound: meta }),
  // question and result are About's lines; lede and now are the landing's two lines under the glass word.
  landing: z.object({ question: text, result: text, lede: text, now: text, enter_label: text, enter_key: text, enter_tap: text }),
  about: z.object({ results: z.array(text), luck: text, figure_table_caption: text, figure_caption: text, not_advice: text }),
  outside: z.array(link),
  story: z.object({ timeline_label: text, ledgers: z.record(z.string(), z.object({ label: text, rows: z.array(z.tuple([text, text])) })) }),
  rules: z.object({
    intro: text, vet_before: text, vet_word: text, vet_after: text, learned: text, vet_href: z.string().url(),
    vet_anchors: z.record(z.string(), z.string().regex(/^[a-z0-9-]+$/)),
    skills: z.record(z.string(), z.object({ name: text, href: z.string().url() })),
    taught: z.record(z.string(), text),
  }),
  notfound: z.object({ h1: text, back: text }),
  case: z.object({ audit: z.array(text), audit_label: text, index: text }),
});
export const casesSchema = z.record(z.string(), z.object({
  description: text,
  number: z.object({ cells: text, rest: text, sr: text, match: text.optional(), note: text }),
  caption: text,
  attribution: text.optional(),
}));
export const pages = pagesSchema.parse(rawPages);
export const caseExtras = casesSchema.parse(rawCases);
