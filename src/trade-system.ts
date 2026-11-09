// Playbook of proven buy/sell patterns; one note per pattern.
import { frontmatterField } from "./events";
import { sectionText } from "./markdown-sections";

export const SYSTEM_SECTIONS = ["适用环境", "买入条件", "卖出条件", "风控", "案例", "备注"] as const;
export type SystemSection = typeof SYSTEM_SECTIONS[number];
export interface SystemPattern { title: string; created: string; sections: Record<SystemSection, string>; }

export function systemTemplate(title: string, created: string): string {
  const body = SYSTEM_SECTIONS.map(section => `## ${section}\n`).join("\n");
  return `---\ncreated: "${created}"\n---\n\n# ${title}\n\n${body}`;
}

export function parseSystemNote(markdown: string, fallbackTitle: string): SystemPattern {
  const title = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || fallbackTitle;
  const created = frontmatterField(markdown, "created") || /^(\d{4}-\d{2}-\d{2})/.exec(fallbackTitle)?.[1] || "";
  const sections = Object.fromEntries(SYSTEM_SECTIONS.map(section => [section, sectionText(markdown, section)])) as Record<SystemSection, string>;
  return { title, created, sections };
}
