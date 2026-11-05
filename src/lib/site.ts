import { getCollection } from 'astro:content';
import { landing } from './landing';
import { GATE_WORDS } from './schema';

export const gateWord = (gate: keyof typeof GATE_WORDS) => GATE_WORDS[gate];
export const causeLabel = (id: string) => landing.causes.find((c) => c.id === id)?.label ?? id;

// Cases in the order the landing log lists them; a log entry without a file fails the build.
export async function getCases() {
  const entries = await getCollection('cases');
  return landing.log.map((item) => {
    const entry = entries.find((e) => e.id === item.slug);
    if (!entry) throw new Error(`log entry ${item.slug} has no case file`);
    // Frontmatter is checked by the schema; the prose body is checked here.
    if (/[$£€]\s*\d/.test(entry.body ?? '')) throw new Error(`${item.slug}: dollar amounts are not allowed in prose`);
    return entry;
  });
}

// Text whose hyphenated words (T-bills, pre-registered) or dates never break at a hyphen: the design's nowrap spans.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
export const nwWords = (s: string) => esc(s).replace(/\b(\w+-\w+)\b/g, (w) => `<span class="nw">${w}</span>`);
export const nwDates = (s: string) => esc(s).replace(/\d{4}-\d{2}-\d{2}/g, (d) => `<span class="nw">${d}</span>`);
