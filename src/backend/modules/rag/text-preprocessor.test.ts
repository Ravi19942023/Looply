import { describe, expect, it } from "vitest";

import { TextPreprocessor } from "./text-preprocessor";

describe("TextPreprocessor", () => {
  const processor = new TextPreprocessor();

  describe("normalizeUnicode", () => {
    it("converts text to NFC form", () => {
      const input = "e\u0301"; // e + combining acute accent
      const result = processor.process(input);
      // After NFC + filterEmptySections (needs >= 10 chars), single char is filtered
      expect(result).toBe("");
    });
  });

  describe("removeNullBytes", () => {
    it("removes null bytes from text", () => {
      const input = "hello\u0000world this is enough text to survive filtering";
      expect(processor.process(input)).toBe("helloworld this is enough text to survive filtering");
    });

    it("handles multiple null bytes", () => {
      const input = "a\u0000b\u0000c this is enough text to survive the filtering step";
      expect(processor.process(input)).toBe("abc this is enough text to survive the filtering step");
    });
  });

  describe("normalizeQuotes", () => {
    it("converts curly quotes to straight quotes", () => {
      const input = "\u201CHello\u201D and \u2018world\u2019 this is long enough for filter";
      const result = processor.process(input);
      expect(result).toContain("Hello");
      expect(result).toContain("and");
      expect(result).toContain("world");
    });

    it("converts em-dashes and en-dashes", () => {
      const input = "word\u2013word \u2014 word with enough text for the filter";
      expect(processor.process(input)).toContain("word-word -- word");
    });

    it("converts ellipsis", () => {
      const input = "wait\u2026 this has enough text for the section filter";
      expect(processor.process(input)).toContain("wait...");
    });
  });

  describe("normalizeWhitespace", () => {
    it("converts \\r\\n to \\n", () => {
      const input = "line1\r\nline2 with enough text to survive the section filter";
      expect(processor.process(input)).toContain("line1\nline2");
    });

    it("collapses multiple spaces", () => {
      const input = "hello    world this is enough text to survive the section filter";
      expect(processor.process(input)).toContain("hello world");
    });

    it("collapses 3+ newlines to 2", () => {
      const input = "line1 with enough text here\n\n\n\nline2 with enough text here too";
      expect(processor.process(input)).toContain("line1 with enough text here\n\nline2 with enough text here too");
    });

    it("trims trailing whitespace per line", () => {
      const input = "line1   \nline2\t\t with enough content for the filter";
      expect(processor.process(input)).toContain("line1");
      expect(processor.process(input)).toContain("line2");
    });

    it("converts tabs to spaces", () => {
      const input = "col1\tcol2 with enough text for the section filter to keep it";
      expect(processor.process(input)).toContain("col1 col2");
    });
  });

  describe("fixHyphenation", () => {
    it("re-joins words split across line breaks", () => {
      const input = "this is a docu-\nment split across lines with enough text";
      expect(processor.process(input)).toContain("document");
    });

    it("does not join non-lowercase characters", () => {
      const input = "UPPER-\nCASE word with enough text for the section filter";
      const result = processor.process(input);
      expect(result).not.toContain("UPPERCASE");
    });
  });

  describe("removePageNumbers", () => {
    it("removes 'Page N' lines", () => {
      const input = "content\nPage 3\nmore content with enough text for filter";
      expect(processor.process(input)).not.toContain("Page 3");
    });

    it("removes 'N of M' lines", () => {
      const input = "content\n3 of 45\nmore content with enough text for filter";
      expect(processor.process(input)).not.toContain("3 of 45");
    });

    it("removes '- N -' lines", () => {
      const input = "content\n- 12 -\nmore content with enough text for filter";
      expect(processor.process(input)).not.toContain("- 12 -");
    });
  });

  describe("removeRepeatedHeaders", () => {
    it("removes lines repeated across many sections but keeps the first occurrence", () => {
      const pages = Array.from(
        { length: 10 },
        (_, i) => `Acme Corp Annual Report\n\nActual content on page ${i} with unique text per section`,
      );
      const input = pages.join("\n\n");
      const result = processor.process(input);
      expect(result).toContain("Actual content");
      expect(result).toContain("Acme Corp Annual Report");

      // Verify it's only there once
      const matches = result.match(/Acme Corp Annual Report/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe("removeBoilerplate", () => {
    it("removes copyright notices", () => {
      const input = "content\ncopyright 2024 Acme Corp\nmore content with enough text";
      expect(processor.process(input)).not.toContain("copyright 2024");
    });

    it("removes confidential notices", () => {
      const input = "content\nConfidential - Internal Use Only\nmore content with enough text";
      expect(processor.process(input)).not.toContain("Confidential");
    });

    it("removes 'all rights reserved'", () => {
      const input = "content\nAll Rights Reserved 2024\nmore content with enough text here";
      expect(processor.process(input)).not.toContain("All Rights Reserved");
    });
  });

  describe("filterEmptySections", () => {
    it("removes sections with fewer than 10 characters", () => {
      const input = "valid section here with enough text\n\nshort\n\nanother valid section with text";
      const result = processor.process(input);
      expect(result).not.toContain("short");
      expect(result).toContain("valid section here");
    });
  });

  describe("full pipeline", () => {
    it("handles empty input", () => {
      expect(processor.process("")).toBe("");
      expect(processor.process("   ")).toBe("");
    });

    it("processes a complex document through all steps", () => {
      const input = [
        "\u201CHeading text with enough content\u201D",
        "",
        "This is a docu-",
        "ment with \u0000 weird chars\u2026 and more content here",
        "",
        "Page 3",
        "",
        "copyright 2024 Acme",
        "",
        "Real content goes here with enough text to survive filtering.",
        "",
        "- 12 -",
        "",
        "Another section with enough text to survive the filter",
      ].join("\n");

      const result = processor.process(input);

      expect(result).toContain("document with weird chars...");
      expect(result).not.toContain("Page 3");
      expect(result).not.toContain("copyright 2024");
      expect(result).toContain("Real content goes here");
    });

    it("preserves legitimate content while removing artifacts", () => {
      const input = `# Report Title

This is the executive summary of our Q3 performance.

## Revenue

Total revenue reached $4.2M, a 15% increase YoY.

7 of 45

Copyright 2024 Looply Inc.

## Recommendations

Based on the data, we recommend:
- Increasing ad spend on channel A
- Reducing churn through targeted campaigns
`;

      const result = processor.process(input);

      expect(result).toContain("Report Title");
      expect(result).toContain("executive summary");
      expect(result).toContain("$4.2M");
      expect(result).toContain("Recommendations");
      expect(result).not.toContain("Copyright 2024");
    });
  });
});
