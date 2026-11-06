// Native Obsidian tags used at paragraph level, e.g. #救市政策 or #来源/北漠海.
export interface TagInsertion { line: number; ch: number; text: string; duplicate?: boolean; error?: string; }

const TAG_PATTERN = /(^|\s)#([\p{L}\p{N}_/-]+)/gu;
const TAG_NAME = /^[\p{L}\p{N}_/-]+$/u;

export function normalizeTag(input: string): string {
  const name = input.trim().replace(/^#+/, "").trim();
  if (!name || !TAG_NAME.test(name) || !/[^\p{N}]/u.test(name)) return "";
  if (name.startsWith("/") || name.endsWith("/") || name.includes("//")) return "";
  return name;
}

export function extractTags(text: string): string[] {
  const tags = new Map<string, string>();
  for (const match of stripCode(text).matchAll(TAG_PATTERN)) {
    const name = normalizeTag(match[2]);
    if (!name) continue;
    const key = name.toLowerCase();
    if (!tags.has(key)) tags.set(key, name);
  }
  return [...tags.values()];
}

export function mergeTags(...groups: string[][]): string[] {
  const tags = new Map<string, string>();
  for (const group of groups) for (const item of group) {
    const name = normalizeTag(item);
    if (!name) continue;
    const key = name.toLowerCase();
    if (!tags.has(key)) tags.set(key, name);
  }
  return [...tags.values()];
}

export function stripCode(text: string): string {
  let fence = "";
  const kept = text.split(/\r?\n/).map(line => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1] ?? "";
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = "";
      return "";
    }
    return fence ? "" : line;
  });
  return kept.join("\n").replace(/`[^`\n]*`/g, "").replace(/<!--[\s\S]*?-->/g, "");
}

export function planTagInsertion(lines: string[], cursorLine: number, input: string): TagInsertion {
  const tag = normalizeTag(input);
  if (!tag) return { line: Math.max(0, cursorLine), ch: 0, text: "", error: "请输入有效标签，标签不能包含空格" };
  if (cursorLine < 0 || cursorLine >= lines.length) return { line: 0, ch: 0, text: "", error: "请将光标放在正文段落中" };
  const codeLines = codeLineFlags(lines);
  if (codeLines[cursorLine]) return { line: cursorLine, ch: 0, text: "", error: "不能在代码块中插入标签" };
  if (isHeading(lines[cursorLine])) return { line: cursorLine, ch: 0, text: "", error: "标题行不能插入标签" };
  if (!isParagraphLine(lines[cursorLine], codeLines[cursorLine])) return { line: cursorLine, ch: 0, text: "", error: "请将光标放在正文段落中" };
  let start = cursorLine;
  while (start > 0 && isParagraphLine(lines[start - 1], codeLines[start - 1])) start -= 1;
  let end = cursorLine;
  while (end + 1 < lines.length && isParagraphLine(lines[end + 1], codeLines[end + 1])) end += 1;
  const paragraph = lines.slice(start, end + 1).join("\n");
  if (extractTags(paragraph).some(existing => existing.toLowerCase() === tag.toLowerCase())) return { line: end, ch: lines[end].length, text: "", duplicate: true };
  const separator = lines[end].length > 0 && !/\s$/.test(lines[end]) ? " " : "";
  return { line: end, ch: lines[end].length, text: `${separator}#${tag}` };
}

function isHeading(line: string): boolean { return /^\s*#{1,6}(\s|$)/.test(line); }
function isParagraphLine(line: string, inCode: boolean): boolean { return !inCode && line.trim().length > 0 && !isHeading(line) && !/^\s*(`{3,}|~{3,})/.test(line); }

function codeLineFlags(lines: string[]): boolean[] {
  let fence = "";
  return lines.map(line => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1] ?? "";
    if (marker) {
      if (!fence) { fence = marker; return true; }
      if (marker[0] === fence[0] && marker.length >= fence.length) { fence = ""; return true; }
    }
    return Boolean(fence);
  });
}
