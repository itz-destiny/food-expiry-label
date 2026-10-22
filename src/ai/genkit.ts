import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
});

// "-latest" aliases keep working when Google retires a model version. Gemini
// regularly returns 503 "high demand", so callers fall through this list.
export const VISION_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'].map((name) =>
  googleAI.model(name)
);
export const visionModel = VISION_MODELS[0];

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|503|429|overloaded|high demand|DEADLINE_EXCEEDED/i.test(msg);
}

/** Runs `attempt` with each vision model in turn until one isn't overloaded. */
export async function withModelFallback<T>(attempt: (model: (typeof VISION_MODELS)[number]) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of VISION_MODELS) {
    try {
      return await attempt(model);
    } catch (err) {
      lastError = err;
      if (!isTransient(err)) throw err;
    }
  }
  throw lastError;
}
