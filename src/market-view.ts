// One persistent overall-view note; the dashboard edits it in place.
export const MARKET_VIEW_TITLE = "整体观点";

export function marketViewTemplate(): string {
  return `# ${MARKET_VIEW_TITLE}\n\n`;
}

export function marketViewBody(markdown: string): string {
  const front = /^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/.exec(markdown)?.[1] ?? "";
  return markdown
    .slice(front.length)
    .replace(/^\s+/, "")
    .replace(/^#\s+[^\r\n]*(?:\r?\n)?/, "")
    .trim();
}

export function updateMarketView(markdown: string, view: string): string {
  const front = /^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/.exec(markdown)?.[1] ?? "";
  const rest = markdown.slice(front.length).replace(/^\s+/, "");
  const heading = /^#\s+[^\r\n]+/.exec(rest)?.[0] ?? `# ${MARKET_VIEW_TITLE}`;
  return `${front}${heading}\n\n${view.trim()}\n`;
}
