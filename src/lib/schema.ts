import { z } from 'astro/zod';

export const GATE_WORDS = {
  no_edge: 'NO EDGE',
  not_established: 'NOT ESTABLISHED',
  undecidable: 'UNDECIDABLE',
} as const;
export type Gate = keyof typeof GATE_WORDS;

export const CAUSES = [
  'priced_right',
  'undecidable',
  'blocked',
  'queue_adverse_selection',
  'capacity',
  'supply',
  'lookahead_invalid',
] as const;

// No money anywhere: no currency sign before a digit.
const MONEY = /[$£€]\s*\d/;
export const text = z.string().min(1).refine((s) => !MONEY.test(s), 'dollar amounts are not allowed');

const gate = z.enum(['no_edge', 'not_established', 'undecidable']);
const cause = z.enum(CAUSES);
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const month = z.string().regex(/^\d{4}-\d{2}$/);

// Results are optional: some case files are words only.
export const caseSchema = z.object({
  title: text,
  gate,
  cause,
  list_meta: text,
  n: z.number().int().positive(),
  of: z.number().int().positive(),
  reviewed: isoDate,
  // The audit's label beside the recorded verdict, in stamp words (the status bar shows it).
  audit: z.enum(['NO EDGE', 'NOT ESTABLISHED', 'UNDECIDABLE']),
  evidence: z.enum(['result table with interval', 'result table, no interval', 'memo']),
  lesson: text.optional(),
});

// An eval case file (src/content/evals): the same case design as the trading cases, with its own fields. The body's
// sections are Question, Test, Result, What this does not show and Lesson (checked in src/lib/site.ts). The front
// matter holds the verdict, the rest of the label block in order, the figure (model-scores, or else the card's own in
// src/data/figures/evals/), and the links of the label block's record row.
export const evalSchema = z.object({
  title: text,
  n: z.number().int().positive(),
  verdict: text,
  label: z.array(z.tuple([text, text])).min(1),
  // model-scores: the vet-bench post's figure (src/posts/figures/), with the post's caption.
  figure: z.enum(['model-scores']).optional(),
  links: z.array(z.object({ label: text, href: z.string().refine((s) => s.startsWith('/') || s.startsWith('https://'), 'a path or an https URL') })).min(1),
  // What is planned next for this eval, under the lesson, as the cases page lists its own: a date line and the items.
  next: z.object({ date: text, items: z.array(text).min(1) }).optional(),
});

export const landingSchema = z
  .object({
    name: text,
    domain: text,
    note: text.optional(),
    home: text,
    counts: z.object({
      tested: z.number().int().positive(),
      closed: z.number().int().positive(),
      months: z.number().int().positive(),
      months_word: text,
      commits: z.number().int().positive(),
    }),
    // label: the cause's short name on the cards, the ledger and the rain. short, meaning and group: fig. 1 on /case/,
    // which groups the causes into plain endings (groups, in the figure's order), then the ideas not closed (open_group).
    causes: z.array(z.object({ id: cause, label: text, n: z.number().int().nonnegative(), short: text, meaning: text, group: z.string() })),
    groups: z.array(z.object({ id: z.string().regex(/^[a-z_]+$/), label: text })).min(1),
    open_group: z.object({ label: text, short: text, meaning: text }),
    log: z.array(z.object({ slug, gate, cause })),
    // One row per closed idea. Only the five public rows carry a slug; the rest read "not published".
    ledger: z.array(z.object({ n: z.number().int().positive(), gate, cause, slug: slug.optional() }).strict()),
    rules: z.array(z.object({ id: z.literal('fills').optional(), rule: text, taught: text.optional() })),
    about: z.object({
      name: text,
      // The page's text, one paragraph per entry, in order.
      story: z.array(text).min(1),
    }),
  })
  .superRefine((d, ctx) => {
    const sum = d.causes.reduce((a, c) => a + c.n, 0);
    if (sum !== d.counts.closed) {
      ctx.addIssue({ code: 'custom', message: `cause counts sum to ${sum}, closed is ${d.counts.closed}` });
    }
    if (d.ledger.length !== d.counts.closed) {
      ctx.addIssue({ code: 'custom', message: `ledger has ${d.ledger.length} rows, closed is ${d.counts.closed}` });
    }
    for (const c of d.causes) {
      if (!d.groups.some((g) => g.id === c.group)) ctx.addIssue({ code: 'custom', message: `cause ${c.id}: no group ${c.group}` });
    }
    for (const g of d.groups) {
      if (!d.causes.some((c) => c.group === g.id)) ctx.addIssue({ code: 'custom', message: `group ${g.id} has no cause` });
    }
    const slugs = d.ledger.filter((r) => r.slug).map((r) => r.slug).sort();
    const logSlugs = d.log.map((l) => l.slug).sort();
    if (JSON.stringify(slugs) !== JSON.stringify(logSlugs)) {
      ctx.addIssue({ code: 'custom', message: 'the ledger must carry exactly the public slugs of the log' });
    }
  });
export type Landing = z.infer<typeof landingSchema>;

export const timelineSchema = z.array(z.object({ month, lines: z.array(text).min(1) })).min(1);
export type Timeline = z.infer<typeof timelineSchema>;
