// Free-form trading playbook; one blank note per pattern.
import { frontmatterField } from "./events";

export interface SystemPattern { title: string; created: string; body: string; }

export function parseSystemNote(markdown: string, fallbackTitle: string): SystemPattern {
  const title = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || fallbackTitle;
  const created = frontmatterField(markdown, "created") || /^(\d{4}-\d{2}-\d{2})/.exec(fallbackTitle)?.[1] || "";
  return { title, created, body: markdown.trim() };
}
