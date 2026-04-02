const BOILERPLATE_PATTERNS: RegExp[] = [
  /^©.*$/gim,
  /^copyright\s+.*$/gim,
  /^confidential.*$/gim,
  /^all rights reserved.*$/gim,
  /^draft\s*[-–—]?\s*(not for distribution)?.*$/gim,
];

const PAGE_NUMBER_PATTERN =
  /^(?:page\s+\d+|\d+\s+of\s+\d+|-\s*\d+\s*-)$/gim;

const MIN_SECTION_LENGTH = 10;
const HEADER_FREQUENCY_THRESHOLD = 0.5;
const HEADER_MAX_LENGTH = 100;

function normalizeUnicode(text: string): string {
  return text.normalize("NFC");
}

function removeNullBytes(text: string): string {
  return text.replace(/\u0000/g, "");
}

function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2026/g, "...");
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function fixHyphenation(text: string): string {
  return text.replace(/([a-z])-\n([a-z])/g, "$1$2");
}

function removePageNumbers(text: string): string {
  return text.replace(PAGE_NUMBER_PATTERN, "");
}

function removeRepeatedHeaders(text: string): string {
  const pages = text.split("\n\n");

  if (pages.length < 3) {
    return text;
  }

  const lineFrequency = new Map<string, number>();

  for (const page of pages) {
    const lines = page.split("\n").map((l) => l.trim());
    const uniqueLines = new Set(lines);

    for (const line of uniqueLines) {
      if (line.length > 0 && line.length < HEADER_MAX_LENGTH) {
        lineFrequency.set(line, (lineFrequency.get(line) ?? 0) + 1);
      }
    }
  }

  const repeatedLines = new Set<string>();
  const threshold = pages.length * HEADER_FREQUENCY_THRESHOLD;

  for (const [line, count] of lineFrequency) {
    if (count >= threshold) {
      repeatedLines.add(line);
    }
  }

  if (repeatedLines.size === 0) {
    return text;
  }

  const resultLines: string[] = [];
  const seenRepeated = new Set<string>();

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (repeatedLines.has(trimmed)) {
      if (seenRepeated.has(trimmed)) {
        continue;
      }
      seenRepeated.add(trimmed);
    }
    resultLines.push(line);
  }

  return resultLines.join("\n");
}

function removeBoilerplate(text: string): string {
  let result = text;

  for (const pattern of BOILERPLATE_PATTERNS) {
    result = result.replace(pattern, "");
  }

  return result;
}

function filterEmptySections(text: string): string {
  return text
    .split("\n\n")
    .filter((section) => section.trim().length >= MIN_SECTION_LENGTH)
    .join("\n\n");
}

export class TextPreprocessor {
  process(raw: string): string {
    if (!raw || raw.trim().length === 0) {
      return "";
    }

    let text = raw;
    text = normalizeUnicode(text);
    text = removeNullBytes(text);
    text = normalizeQuotes(text);
    text = normalizeWhitespace(text);
    text = fixHyphenation(text);
    text = removePageNumbers(text);
    text = removeRepeatedHeaders(text);
    text = removeBoilerplate(text);
    text = filterEmptySections(text);

    return normalizeWhitespace(text);
  }
}
