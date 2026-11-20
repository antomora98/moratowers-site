import { landing } from './landing';
import { pages } from './pages';

// Structured data for search engines (schema.org JSON-LD), built from approved visible text only. The Person holds the
// name, the site and the public profile links, nothing else. Base.astro prints it as a <script type="application/ld+json">
// data block, which browsers never run; scripts/cspcheck.mjs accepts that one type only when its body parses as JSON.
const SITE = 'https://moratowers.dev/';
const PROFILES = pages.about.contact.channels.filter((c) => c.me).map((c) => c.href);
export const person = { '@type': 'Person', '@id': `${SITE}#person`, name: landing.about.name, url: SITE, sameAs: PROFILES };
const website = { '@type': 'WebSite', '@id': `${SITE}#website`, url: SITE, name: landing.name, description: pages.meta.landing.description, image: `${SITE}icon-512.png`, author: { '@id': person['@id'] } };
const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });

export const homeLd = () => graph(website, person);
export const aboutLd = () => graph({ '@type': 'ProfilePage', url: `${SITE}about/`, name: pages.meta.about.title, isPartOf: { '@id': website['@id'] }, mainEntity: person });
// The five cases went public together when the site went live (2026-11-05). A case added later takes its own date.
const CASES_PUBLISHED = '2026-11-05';
export const caseLd = (slug: string, headline: string, description: string) =>
  graph({ '@type': 'Article', headline, description, url: `${SITE}case/${slug}/`, datePublished: CASES_PUBLISHED, author: person, isPartOf: { '@id': website['@id'] } });
// JSON inside an HTML script element must never hold "<", or a string could close the element.
export const ldText = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');
