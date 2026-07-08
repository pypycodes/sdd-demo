import OpenAI from 'openai';
import { Patient, JourneyAnalysis, AiMetadata } from '../types/care-journey';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder';

/** Provider preset: base URL, default model, and which env var holds the API key */
interface ProviderPreset {
  readonly label: string;
  readonly baseURL: string;
  readonly defaultModel: string;
  readonly keyEnvVar: string;
}

/** Built-in provider presets — add new providers here */
const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyEnvVar: 'OPENAI_API_KEY',
  },
  groq: {
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyEnvVar: 'GROQ_API_KEY',
  },
  gemini: {
    label: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-3.5-flash',
    keyEnvVar: 'GEMINI_API_KEY',
  },
  openrouter: {
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-exp',
    keyEnvVar: 'OPENROUTER_API_KEY',
  },
  together: {
    label: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
    keyEnvVar: 'TOGETHER_API_KEY',
  },
  mistral: {
    label: 'Mistral',
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    keyEnvVar: 'MISTRAL_API_KEY',
  },
  ollama: {
    label: 'Ollama (local)',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    keyEnvVar: 'OLLAMA_API_KEY',
  },
} as const;

/** Resolve the active provider config from env */
function resolveProvider(): { label: string; baseURL: string; model: string; apiKey: string } {
  const providerName = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const preset = PROVIDER_PRESETS[providerName];
  if (!preset) {
    const available = Object.keys(PROVIDER_PRESETS).join(', ');
    throw new Error(`Unknown AI_PROVIDER "${providerName}". Available: ${available}`);
  }
  const apiKey = process.env[preset.keyEnvVar] || process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || preset.defaultModel;
  return { label: preset.label, baseURL: preset.baseURL, model, apiKey };
}

const provider = resolveProvider();

/** Universal OpenAI-compatible client */
const client = new OpenAI({
  baseURL: provider.baseURL,
  apiKey: provider.apiKey,
});

/** Get a human-readable label for the current provider */
export function getProviderLabel(): string {
  return `${provider.label} (${provider.model})`;
}

/** Extract JSON from AI response, handling markdown fences and partial output */
function extractJson<T>(raw: string): T {
  let text = raw.trim();
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: find the first { ... } block
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1)) as T;
    }
    throw new Error(`Failed to parse AI response as JSON. Raw response:\n${raw.substring(0, 300)}...`);
  }
}

/** Sleep helper for retry delays */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Analyze a patient's care journey using any OpenAI-compatible LLM */
export async function analyzeCareJourney(patient: Patient): Promise<JourneyAnalysis> {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 2000;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`AI request → ${getProviderLabel()} (attempt ${attempt}/${MAX_RETRIES})`);
      const startTime = Date.now();
      const response = await client.chat.completions.create({
        model: provider.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(patient) },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });
      const latencyMs = Date.now() - startTime;
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`No response from ${getProviderLabel()}`);
      }
      const usage = response.usage;
      const aiMetadata: AiMetadata = {
        provider: provider.label,
        model: provider.model,
        tokensPrompt: usage?.prompt_tokens ?? 0,
        tokensCompletion: usage?.completion_tokens ?? 0,
        tokensTotal: usage?.total_tokens ?? 0,
        latencyMs,
      };
      console.log(`AI response ← ${aiMetadata.tokensTotal} tokens in ${latencyMs}ms`);
      const parsed = extractJson<Omit<JourneyAnalysis, 'patientId' | 'aiMetadata'>>(content);
      return {
        patientId: patient.id,
        ...parsed,
        aiMetadata,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRetryable = lastError.message.includes('503') || 
                          lastError.message.includes('429') || 
                          lastError.message.includes('rate') ||
                          lastError.message.includes('overloaded');
      if (isRetryable && attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`AI request failed (${lastError.message}), retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      } else {
        break;
      }
    }
  }
  console.error(`AI analysis failed [${getProviderLabel()}]:`, lastError?.message);
  throw new Error(`AI service temporarily unavailable. Please try again in a few seconds. (${lastError?.message || 'Unknown error'})`);
}
