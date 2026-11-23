import "server-only";
import OpenAI from "openai";
import { aiConfig } from "./config";
import { AIError } from "@/domains/ai/errors";

export type AIProviderResult = {
  id: string;
  text: string;
  model: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
  };
};
export type AIProviderInput = {
  instructions: string;
  input: Array<{ role: "user" | "assistant"; content: string }>;
  signal?: AbortSignal;
  maxOutputTokens?: number;
};
export interface AIProvider {
  respond(input: AIProviderInput): Promise<AIProviderResult>;
}

export class OpenAIResponsesProvider implements AIProvider {
  private readonly client: OpenAI;
  constructor() {
    if (!process.env.OPENAI_API_KEY)
      throw new AIError(
        "PROVIDER_UNAVAILABLE",
        "O tutor não está configurado neste ambiente.",
      );
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: aiConfig.timeoutMs,
      maxRetries: 1,
    });
  }
  async respond(input: AIProviderInput): Promise<AIProviderResult> {
    try {
      const response = await this.client.responses.create(
        {
          model: aiConfig.model,
          store: false,
          instructions: input.instructions,
          input: input.input,
          max_output_tokens: input.maxOutputTokens ?? aiConfig.maxOutputTokens,
        },
        { signal: input.signal },
      );
      return {
        id: response.id,
        text: response.output_text,
        model: response.model,
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          cachedInputTokens:
            response.usage?.input_tokens_details?.cached_tokens,
        },
      };
    } catch (error) {
      if (error instanceof OpenAI.RateLimitError)
        throw new AIError(
          "RATE_LIMITED",
          "O provedor está temporariamente congestionado. Tente novamente em instantes.",
        );
      if (error instanceof OpenAI.APIUserAbortError) throw error;
      throw new AIError(
        "PROVIDER_UNAVAILABLE",
        "Não foi possível obter uma resposta do tutor agora.",
      );
    }
  }
}
