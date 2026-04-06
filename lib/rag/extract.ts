import mammoth from "mammoth";
// Import the library entry directly to avoid the package root debug wrapper.
import pdf from "pdf-parse/lib/pdf-parse";

interface TextExtractionResult {
  method: "mammoth" | "pdf-parse" | "utf8";
  text: string;
}

export function isReadableExtractedText(text: string): boolean {
  const normalized = text.trim();

  if (normalized.length < 10) {
    return false;
  }

  const alphanumericCount = normalized.match(/[A-Za-z0-9]/g)?.length ?? 0;
  const controlCharacterCount = Array.from(normalized).reduce((count, char) => {
    const code = char.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13
      ? count + 1
      : count;
  }, 0);
  const controlCharacterRatio = controlCharacterCount / normalized.length;
  const hasZipSignature = normalized.startsWith("PK");

  if (controlCharacterRatio > 0.05) {
    return false;
  }

  if (hasZipSignature && alphanumericCount < 20) {
    return false;
  }

  return alphanumericCount >= 5 && /[A-Za-z0-9]{3,}/.test(normalized);
}

export async function extractText(
  buffer: Buffer,
  contentType: string
): Promise<TextExtractionResult> {
  switch (contentType) {
    case "application/pdf": {
      try {
        const data = await pdf(buffer);
        return {
          method: "pdf-parse",
          text: data.text ?? "",
        };
      } catch (_error) {
        throw new Error(
          "This PDF could not be parsed. The file may be malformed, encrypted, or use an unsupported structure."
        );
      }
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      try {
        const data = await mammoth.extractRawText({ buffer });
        return {
          method: "mammoth",
          text: data.value ?? "",
        };
      } catch (_error) {
        throw new Error(
          "This DOCX file could not be parsed. The file may be malformed or unsupported."
        );
      }
    }
    default:
      return {
        method: "utf8",
        text: buffer.toString("utf8"),
      };
  }
}
