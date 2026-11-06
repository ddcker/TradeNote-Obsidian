// Event notes: countdown events and after-close event-driven records.
import { replaceSection, sectionText } from "./markdown-sections";

export interface EventData { title: string; date: string; expectation: string; actual: string; }
export interface EventCountdown { days: number; tradingDays: number; label: string; }
export interface EventDrivenData { title: string; date: string; time: string; event: string; expectation: string; result: string; reaction: string; }

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const DAY_MS = 86400000;

export function normalizeEventTitle(title: string): string { return title.replace(/\s+/g, " ").trim(); }

export function eventSlug(title: string): string {
  return normalizeEventTitle(title)
    .replace(/[\\/:*?"<>|#^\[\]\r\n\t]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 48) || "事件";
}

function frontmatterField(markdown: string, key: string): string {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!front) return "";
  const line = front[1].split(/\r?\n/).find(value => new RegExp(`^${key}\\s*:`).test(value));
  return line ? line.replace(new RegExp(`^${key}\\s*:\\s*`), "").trim().replace(/^["']|["']$/g, "") : "";
}

function updateFrontmatter(markdown: string, fields: Record<string, string>): string {
  const keys = Object.keys(fields);
  const written = Object.entries(fields).filter(([, value]) => value).map(([key, value]) => `${key}: "${value}"`);
  if (/^---\r?\n[\s\S]*?\r?\n---/.test(markdown)) {
    return markdown.replace(/^---\r?\n([\s\S]*?)\r?\n---/, (_block, body: string) => {
      const kept = body.split(/\r?\n/).filter(line => !keys.some(key => new RegExp(`^${key}\\s*:`).test(line)));
      return `---\n${[...written, ...kept].filter(Boolean).join("\n")}\n---`;
    });
  }
  return `---\n${written.join("\n")}\n---\n\n${markdown}`;
}

function setTitle(markdown: string, title: string): string {
  const name = normalizeEventTitle(title);
  if (/^#\s+.*$/m.test(markdown)) return markdown.replace(/^#\s+.*$/m, `# ${name}`);
  const front = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(markdown);
  return front ? `${markdown.slice(0, front[0].length)}# ${name}\n\n${markdown.slice(front[0].length)}` : `# ${name}\n\n${markdown}`;
}

export function eventTemplate(title: string, date: string): string {
  return `---\ndate: "${date}"\n---\n\n# ${normalizeEventTitle(title)}\n\n## 预期\n\n## 实际\n`;
}

export function parseEventMeta(markdown: string, fallbackTitle: string): { title: string; date: string; time: string } {
  const date = frontmatterField(markdown, "date") || /^(\d{4}-\d{2}-\d{2})/.exec(fallbackTitle)?.[1] || "";
  const time = frontmatterField(markdown, "time");
  const titleMatch = /^#\s+(.+)$/m.exec(markdown);
  return { title: titleMatch ? titleMatch[1].trim() : fallbackTitle, date, time };
}

export function parseEventNote(markdown: string, fallbackTitle: string): { title: string; date: string } {
  const { title, date } = parseEventMeta(markdown, fallbackTitle);
  return { title, date };
}

export function updateEventNote(markdown: string, title: string, date: string, expectation: string, actual: string): string {
  let result = updateFrontmatter(markdown, { date });
  result = setTitle(result, title);
  result = replaceSection(result, "预期", expectation);
  result = replaceSection(result, "实际", actual);
  return `${result.replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

export function eventSections(markdown: string): { expectation: string; actual: string } {
  return { expectation: sectionText(markdown, "预期"), actual: sectionText(markdown, "实际") };
}

export function eventDrivenTemplate(title: string, date: string, time: string): string {
  const meta = [`date: "${date}"`, time ? `time: "${time}"` : ""].filter(Boolean).join("\n");
  return `---\n${meta}\n---\n\n# ${normalizeEventTitle(title)}\n\n## 事件\n\n## 预期\n\n## 结果\n\n## 次日反应\n`;
}

export function updateEventDrivenNote(markdown: string, data: EventDrivenData): string {
  let result = updateFrontmatter(markdown, { date: data.date, time: data.time });
  result = setTitle(result, data.title);
  result = replaceSection(result, "事件", data.event);
  result = replaceSection(result, "预期", data.expectation);
  result = replaceSection(result, "结果", data.result);
  result = replaceSection(result, "次日反应", data.reaction);
  return `${result.replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

export function eventDrivenSections(markdown: string): { event: string; expectation: string; result: string; reaction: string } {
  return {
    event: sectionText(markdown, "事件"),
    expectation: sectionText(markdown, "预期"),
    result: sectionText(markdown, "结果"),
    reaction: sectionText(markdown, "次日反应"),
  };
}

export function eventDrivenStatus(result: string): "pending" | "done" { return result.trim() ? "done" : "pending"; }

function utcDay(date: string): number { const [year, month, day] = date.split("-").map(Number); return Date.UTC(year, month - 1, day); }
function addDays(date: string, offset: number): string { return new Date(utcDay(date) + offset * DAY_MS).toISOString().slice(0, 10); }

export function naturalDaysBetween(from: string, to: string): number {
  return Math.round((utcDay(to) - utcDay(from)) / DAY_MS);
}

export function tradingDaysBetween(from: string, to: string, isTradingDay: (date: string) => boolean): number {
  if (from === to) return 0;
  const direction = to > from ? 1 : -1;
  let cursor = from;
  let count = 0;
  let guard = 0;
  while (cursor !== to && guard < 4000) {
    cursor = addDays(cursor, direction);
    if (isTradingDay(cursor)) count += direction;
    guard += 1;
  }
  return count;
}

export function eventCountdown(eventDate: string, today: string, isTradingDay: (date: string) => boolean): EventCountdown {
  const days = naturalDaysBetween(today, eventDate);
  const tradingDays = tradingDaysBetween(today, eventDate, isTradingDay);
  const label = days === 0 ? "今天" : days > 0 ? `还有 ${days} 个自然日 · ${tradingDays} 个A股交易日` : `已发生 ${-days} 个自然日 · ${-tradingDays} 个A股交易日`;
  return { days, tradingDays, label };
}

export function eventWeekday(date: string): string { return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]; }
