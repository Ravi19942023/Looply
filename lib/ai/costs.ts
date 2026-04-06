type Pricing = {
  inputPer1K: number;
  outputPer1K: number;
};

const DEFAULT_PRICING: Pricing = {
  inputPer1K: 0,
  outputPer1K: 0,
};

const MODEL_PRICING: Record<string, Pricing> = {
  "openai/text-embedding-3-small": {
    inputPer1K: 0.000_02,
    outputPer1K: 0,
  },
  "moonshotai/kimi-k2-0905": {
    inputPer1K: 0.0008,
    outputPer1K: 0.0024,
  },
  "mistral/mistral-small": {
    inputPer1K: 0.0002,
    outputPer1K: 0.0006,
  },
  "gpt-4.1-nano": {
    inputPer1K: 0.0001,
    outputPer1K: 0.0004,
  },
};

export function estimateAiCost({
  completionTokens = 0,
  model,
  promptTokens = 0,
}: {
  completionTokens?: number;
  model?: string | null;
  promptTokens?: number;
}) {
  const pricing = (model && MODEL_PRICING[model]) || DEFAULT_PRICING;

  return Number(
    (
      (promptTokens / 1000) * pricing.inputPer1K +
      (completionTokens / 1000) * pricing.outputPer1K
    ).toFixed(6)
  );
}
