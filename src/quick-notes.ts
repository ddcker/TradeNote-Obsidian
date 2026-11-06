// One quick-note file per day; entries are appended under "## HH:mm" headings.
import { extractTags, normalizeTag } from "./review-tags";

export interface QuickNoteEntry { date: string; time: string; text: string; tags: string[]; }

export function quickNoteHeader(date: string): string { return `# ${date} 随手记`; }

export function formatQuickNoteBlock(time: string, text: string, tags: string[]): string {
  const body = text.trim();
  if (!body) return "";
  const tagsByName = new Map<string, string>();
  for (const item of tags) {
    const tag = normalizeTag(item);
    if (tag && !tagsByName.has(tag.toLowerCase())) tagsByName.set(tag.toLowerCase(), tag);
  }
  const tagLine = tagsByName.size ? `\n\n${[...tagsByName.values()].map(tag => `#${tag}`).join(" ")}` : "";
  return `## ${time}\n\n${body}${tagLine}`;
}

export function appendQuickNote(existing: string, date: string, time: string, text: string, tags: string[]): string {
  const block = formatQuickNoteBlock(time, text, tags);
  if (!block) return existing;
  const base = existing.trim() ? `${existing.trimEnd()}\n\n` : `${quickNoteHeader(date)}\n\n`;
  return `${base}${block}\n`;
}

export function parseQuickNotes(date: string, markdown: string): QuickNoteEntry[] {
  const entries: QuickNoteEntry[] = [];
  let time = "";
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) entries.push({ date, time, text, tags: extractTags(text) });
    lines = [];
  };
  for (const line of markdown.replace(/^\s*#\s+.*(?:\r?\n)?/, "").split(/\r?\n/)) {
    const heading = /^##\s+(\d{2}:\d{2})\s*$/.exec(line);
    if (heading) { flush(); time = heading[1]; continue; }
    lines.push(line);
  }
  flush();
  if (!entries.length && markdown.trim()) {
    const text = markdown.replace(/^\s*#\s+.*(?:\r?\n)?/, "").trim();
    if (text) entries.push({ date, time: "", text, tags: extractTags(text) });
  }
  return entries;
}

export function quickNoteBody(text: string): string {
  return text.split(/\r?\n/).filter(line => !/^\s*(#[^\s#]+\s*)+$/.test(line)).join("\n").trim();
}
