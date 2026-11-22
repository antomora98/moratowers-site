import { execFileSync } from 'node:child_process';
// The date in the footer: the last commit's date, in UTC, read from git when the site is built. The build fails if git
// gives no date; the footer never prints a guessed one.
const iso = execFileSync('git', ['log', '-1', '--format=%cI'], { encoding: 'utf8' }).trim();
const when = new Date(iso);
if (!iso || Number.isNaN(when.getTime())) throw new Error('footer: git gave no commit date');
export const UPDATED = when.toISOString().slice(0, 10);
