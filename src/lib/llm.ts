import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

const apiKey = process.env.LLM_PROVIDER_API_KEY;
if (!apiKey) {
  throw new Error("LLM_PROVIDER_API_KEY is not set");
}

export const llm = new OpenAI({
  apiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

export const LLM_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

export async function chatCompletionWithRetry(
  params: ChatCompletionCreateParamsNonStreaming,
  retries = 3
): Promise<ChatCompletion> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await llm.chat.completions.create(params);
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (status !== 429 && status !== 503) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}
