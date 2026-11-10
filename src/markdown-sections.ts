// Heading/section helpers shared by daily reviews and event notes.
interface SectionHeading { index: number; title: string; }

function sectionHeadings(lines: string[]): SectionHeading[] {
  const headings: SectionHeading[] = [];
  let fence = "";
  for (let index = 0; index < lines.length; index += 1) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(lines[index])?.[1];
    if (marker) { if (!fence) fence = marker; else if (marker[0] === fence[0] && marker.length >= fence.length) fence = ""; continue; }
    if (fence) continue;
    const heading = /^#{1,2}[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(lines[index]);
    if (heading) headings.push({ index, title: heading[1] });
  }
  return headings;
}

export function sectionText(markdown: string, title: string): string {
  const lines = markdown.split(/\r?\n/);
  const headings = sectionHeadings(lines);
  const index = headings.findIndex(heading => heading.title === title);
  if (index < 0) return "";
  const end = headings[index + 1]?.index ?? lines.length;
  return lines.slice(headings[index].index + 1, end).join("\n").trim();
}

export function replaceSection(markdown: string, title: string, value: string): string {
  const lines = markdown.split(/\r?\n/);
  const headings = sectionHeadings(lines);
  const index = headings.findIndex(heading => heading.title === title);
  const body = value.trim();
  const bodyLines = body ? body.split(/\r?\n/) : [];
  if (index < 0) return `${markdown.trimEnd()}\n\n## ${title}\n\n${body}\n`.replace(/\n{3,}/g, "\n\n");
  const heading = headings[index];
  const end = headings[index + 1]?.index ?? lines.length;
  const result = [...lines.slice(0, heading.index + 1), "", ...bodyLines, "", ...lines.slice(end)].join("\n");
  return `${result.replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

export function renameSectionHeading(markdown: string, from: string, to: string): string {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return markdown.replace(new RegExp(`^(#{1,2})[ \\t]+${escaped}[ \\t]*$`, "gm"), `$1 ${to}`);
}
