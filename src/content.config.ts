import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseSchema, evalSchema } from './lib/schema';

const cases = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cases' }),
  schema: caseSchema,
});

// The eval case files, shown on /evals/ and each at /evals/<file name>/.
const evals = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/evals' }),
  schema: evalSchema,
});

export const collections = { cases, evals };
