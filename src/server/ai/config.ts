import "server-only";

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const aiConfig = {
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  timeoutMs: numberFromEnv("AI_TIMEOUT_MS", 30_000),
  maxOutputTokens: numberFromEnv("AI_MAX_OUTPUT_TOKENS", 1_500),
  requestsPerDay: numberFromEnv("AI_REQUESTS_PER_DAY", 20),
  tokensPerDay: numberFromEnv("AI_TOKENS_PER_DAY", 50_000),
  maxConcurrent: numberFromEnv("AI_MAX_CONCURRENT_PER_USER", 1),
  contextMessages: numberFromEnv("AI_CONTEXT_MESSAGES", 8),
  retrievalLimit: numberFromEnv("AI_RETRIEVAL_LIMIT", 5),
} as const;
