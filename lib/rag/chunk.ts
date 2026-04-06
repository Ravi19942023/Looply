import { CHUNK_OVERLAP, CHUNK_SIZE } from "./constants";

export function chunkText(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) {
      chunks.push(trimmed);
    }
  };

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    const candidate = `${current}\n\n${paragraph}`;
    if (candidate.length <= CHUNK_SIZE) {
      current = candidate;
      continue;
    }

    pushCurrent();
    const overlap = current.slice(Math.max(0, current.length - CHUNK_OVERLAP));
    current = overlap ? `${overlap}\n\n${paragraph}` : paragraph;

    while (current.length > CHUNK_SIZE) {
      chunks.push(current.slice(0, CHUNK_SIZE).trim());
      current = current.slice(Math.max(0, CHUNK_SIZE - CHUNK_OVERLAP)).trim();
    }
  }

  pushCurrent();
  return chunks;
}
