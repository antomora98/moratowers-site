import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseSchema } from './lib/schema';

const cases = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cases' }),
  schema: caseSchema,
});

export const collections = { cases };
