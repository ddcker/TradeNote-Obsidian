// Long-form notes kept in one folder; the page lists and previews them.
export interface TrackData { title: string; text: string; }

export function trackTemplate(title: string): string {
  return `# ${title}\n\n`;
}

export function parseTrack(markdown: string, fallbackTitle: string): TrackData {
  const front = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(markdown)?.[0] ?? "";
  const body = markdown.slice(front.length);
  const title = /^#\s+(.+)$/m.exec(body)?.[1]?.trim() || fallbackTitle;
  const text = body
    .replace(/^\s*#\s+[^\r\n]*(?:\r?\n)?/, "")
    .replace(/^[ \t]*(?:##[ \t]+(?:逻辑|记录|结论)|###[ \t]+\d{4}-\d{2}-\d{2})[ \t]*(?:\r?\n)?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, text };
}
