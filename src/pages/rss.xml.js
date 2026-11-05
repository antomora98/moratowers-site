import rss from '@astrojs/rss';
import { getCases } from '../lib/site';
import { pages } from '../lib/pages';

export async function GET(context) {
  const cases = await getCases();
  return rss({
    title: 'moratowers',
    description: pages.meta.landing.description,
    site: context.site,
    items: cases.map((c) => ({ title: c.data.title, description: c.data.list_meta.charAt(0).toUpperCase() + c.data.list_meta.slice(1), link: `/case/${c.id}/` })),
  });
}
