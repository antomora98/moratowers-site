export interface Section { h: string; paras: string[] }

// A case file body is Markdown: "## Heading" blocks of plain paragraphs.
export function parseSections(body: string): Section[] {
  return body
    .split(/^## /m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [h, ...rest] = chunk.split(/\n\s*\n/);
      return { h: h.trim(), paras: rest.map((p) => p.trim()).filter(Boolean) };
    });
}
