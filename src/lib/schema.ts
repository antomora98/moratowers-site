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
    causes: z.array(z.object({ id: cause, label: text, n: z.number().int().nonnegative() })),
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
    const slugs = d.ledger.filter((r) => r.slug).map((r) => r.slug).sort();
    const logSlugs = d.log.map((l) => l.slug).sort();
    if (JSON.stringify(slugs) !== JSON.stringify(logSlugs)) {
      ctx.addIssue({ code: 'custom', message: 'the ledger must carry exactly the public slugs of the log' });
    }
  });
export type Landing = z.infer<typeof landingSchema>;

export const timelineSchema = z.array(z.object({ month, lines: z.array(text).min(1) })).min(1);
export type Timeline = z.infer<typeof timelineSchema>;
