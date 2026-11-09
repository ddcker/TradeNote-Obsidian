// Daily gut-feel notes for A-shares and US markets, one note per day.
import { replaceSection, sectionText } from "./markdown-sections";

export const MARKET_FEEL_TITLE = "大盘体感";
export const MARKET_FEEL_HEADINGS = { a: "A股", us: "美股" } as const;
export type MarketFeelSideKey = keyof typeof MARKET_FEEL_HEADINGS;

export interface MarketFeelSide { score: number; note: string; }
export interface MarketFeelSides { a: MarketFeelSide; us: MarketFeelSide; }

export function normalizeMarketFeelScore(value: number): number {
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
}

function sideBody(side: MarketFeelSide): string {
  const score = normalizeMarketFeelScore(side.score);
  const note = side.note.trim();
  return `体感：${score ? `${score}/5` : "未评分"}${note ? `\n\n${note}` : ""}`;
}

export function marketFeelTemplate(date: string): string {
  return `# ${date} ${MARKET_FEEL_TITLE}\n\n## ${MARKET_FEEL_HEADINGS.a}\n\n体感：未评分\n\n## ${MARKET_FEEL_HEADINGS.us}\n\n体感：未评分\n`;
}

export function parseMarketFeelSide(markdown: string, side: MarketFeelSideKey): MarketFeelSide {
  const content = sectionText(markdown, MARKET_FEEL_HEADINGS[side]);
  const match = /体感\s*[:：]\s*([1-5])\s*\/\s*5/.exec(content);
  const note = content
    .replace(/^[ \t]*体感\s*[:：]\s*(?:[1-5]\s*\/\s*5|未评分)[ \t]*(?:\r?\n)?/, "")
    .trim();
  return { score: match ? Number(match[1]) : 0, note };
}

export function parseMarketFeelNote(markdown: string): MarketFeelSides {
  return { a: parseMarketFeelSide(markdown, "a"), us: parseMarketFeelSide(markdown, "us") };
}

export function updateMarketFeelNote(markdown: string, date: string, sides: MarketFeelSides): string {
  const base = markdown.trim() ? markdown : marketFeelTemplate(date);
  let result = replaceSection(base, MARKET_FEEL_HEADINGS.a, sideBody(sides.a));
  result = replaceSection(result, MARKET_FEEL_HEADINGS.us, sideBody(sides.us));
  return `${result.replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

export function averageMarketFeel(records: Array<Record<MarketFeelSideKey, MarketFeelSide>>, side: MarketFeelSideKey, limit = 5): number | null {
  const scores = records
    .slice(0, limit)
    .map(record => normalizeMarketFeelScore(record[side].score))
    .filter(score => score > 0);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}
