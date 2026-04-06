export const artifactKinds = ["text", "code", "image", "sheet"] as const;

export type ArtifactKind = (typeof artifactKinds)[number];
