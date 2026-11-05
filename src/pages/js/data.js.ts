import { getCases } from '../../lib/site';
import { landing } from '../../lib/landing';
import { GATE_WORDS } from '../../lib/schema';

// /js/data.js: the record the rain and the landing import (the design's data.js, same four exports), built from
// landing.json and the five case files.
export async function GET() {
  const cases = await getCases();
  const CASES = Object.fromEntries(cases.map((c) => [c.id, {
    gate: c.data.gate, cause: c.data.cause, n: c.data.n, audit: c.data.audit, title: c.data.title, evidence: c.data.evidence,
  }]));
  const CAUSE_LABEL = Object.fromEntries(landing.causes.map((c) => [c.id, c.label]));
  const LEDGER = landing.ledger.map((r) => [r.n, r.gate, r.cause, r.slug ?? null]);
  const body = '// Built from the site\'s landing.json and the five public case files. Public data only.\n'
    + `export const GATE_WORD = ${JSON.stringify(GATE_WORDS)};\n`
    + `export const CAUSE_LABEL = ${JSON.stringify(CAUSE_LABEL)};\n`
    + `export const CASES = ${JSON.stringify(CASES)};\n`
    + `export const LEDGER = ${JSON.stringify(LEDGER)};\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
}
