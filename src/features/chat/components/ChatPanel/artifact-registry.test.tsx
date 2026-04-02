// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { getArtifactDefinition, applyArtifactStreamPart } from "./artifact-registry";
import { INITIAL_ARTIFACT } from "../../hooks/usePersistentChat.helpers";

describe("artifact registry", () => {
  it("returns the matching definition for supported kinds", () => {
    expect(getArtifactDefinition("text").label).toBe("Document");
    expect(getArtifactDefinition("code").label).toBe("Code");
    expect(getArtifactDefinition("sheet").label).toBe("Spreadsheet");
  });

  it("falls back to the text definition for legacy diagram artifacts", () => {
    expect(getArtifactDefinition("diagram").kind).toBe("text");
  });

  it("applies text stream updates to the shared artifact state", () => {
    let artifact = { ...INITIAL_ARTIFACT };

    applyArtifactStreamPart({
      setArtifact: (updater) => {
        artifact = typeof updater === "function" ? updater(artifact) : updater;
      },
      streamPart: {
        type: "data-textDelta",
        data: "# Draft",
      },
    });

    expect(artifact.content).toBe("# Draft");
    expect(artifact.isVisible).toBe(true);
    expect(artifact.status).toBe("streaming");
  });

  it("ignores unknown stream events", () => {
    let artifact = { ...INITIAL_ARTIFACT };

    applyArtifactStreamPart({
      setArtifact: (updater) => {
        artifact = typeof updater === "function" ? updater(artifact) : updater;
      },
      streamPart: {
        type: "data-unknown",
        data: "noop",
      },
    });

    expect(artifact).toEqual(INITIAL_ARTIFACT);
  });
});
