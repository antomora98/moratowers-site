import rss from '@astrojs/rss';
import { getCases, getEvals } from '../lib/site';
import { pages } from '../lib/pages';

export async function GET(context) {
  const cases = await getCases();
  const evals = await getEvals();
  return rss({
    title: 'moratowers',
    description: pages.meta.landing.description,
    site: context.site,
    items: [
      ...evals.map((e) => ({ title: e.entry.data.title, description: e.question, link: `/evals/${e.entry.id}/` })),
      ...cases.map((c) => ({ title: c.data.title, description: c.data.list_meta.charAt(0).toUpperCase() + c.data.list_meta.slice(1), link: `/case/${c.id}/` })),
    ],
  });
}
