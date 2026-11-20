import { getCollection } from 'astro:content';
import { landing } from './landing';
import { GATE_WORDS } from './schema';
import { parseSections } from './sections';

export const gateWord = (gate: keyof typeof GATE_WORDS) => GATE_WORDS[gate];
export const causeLabel = (id: string) => landing.causes.find((c) => c.id === id)?.short ?? id;

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

// The eval case files in order (n = 1, 2, 3 ...), each with its sections and its question: the Question section's
// first sentence, up to its question mark, which /evals/ lists. A file out of order or with other sections fails the build.
const EVAL_SECTIONS = ['Question', 'Test', 'Result', 'What this does not show', 'Lesson'];
export async function getEvals() {
  const entries = (await getCollection('evals')).sort((a, b) => a.data.n - b.data.n);
  return entries.map((entry, k) => {
    if (entry.data.n !== k + 1) throw new Error(`${entry.id}: numbered ${entry.data.n}, expected ${k + 1}`);
    if (/[$£€]\s*\d/.test(entry.body ?? '')) throw new Error(`${entry.id}: dollar amounts are not allowed in prose`);
    const sections = parseSections(entry.body ?? '');
    if (sections.map((s) => s.h).join('|') !== EVAL_SECTIONS.join('|') || sections.some((s) => !s.paras.length))
      throw new Error(`${entry.id}: expected the sections ${EVAL_SECTIONS.join(', ')}, each with text`);
    const first = sections[0].paras[0];
    if (!first.includes('?')) throw new Error(`${entry.id}: the Question section asks no question`);
    return { entry, sections, question: first.slice(0, first.indexOf('?') + 1) };
  });
}

// Text whose hyphenated words (T-bills, pre-registered) or dates never break at a hyphen: the design's nowrap spans.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
export const nwWords = (s: string) => esc(s).replace(/\b(\w+-\w+)\b/g, (w) => `<span class="nw">${w}</span>`);
export const nwDates = (s: string) => esc(s).replace(/\d{4}-\d{2}-\d{2}/g, (d) => `<span class="nw">${d}</span>`);
