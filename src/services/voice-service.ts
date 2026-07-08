import OpenAI from 'openai';

/** Voice options for TTS */
export type TtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

/** TTS request */
export interface TtsRequest {
  readonly text: string;
  readonly voice?: TtsVoice;
}

/** TTS response with audio buffer */
export interface TtsResponse {
  readonly audioBuffer: Buffer;
  readonly mimeType: string;
}

/** Resolve OpenAI client for TTS */
function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for TTS. Set it in .env or use browser Web Speech API instead.');
  }
  return new OpenAI({ apiKey });
}

/** Convert text to speech using OpenAI TTS API */
export async function textToSpeech(request: TtsRequest): Promise<TtsResponse> {
  const client = getOpenAiClient();
  const voice = request.voice || 'alloy';
  
  try {
    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: request.text,
      response_format: 'mp3',
    });
    
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return {
      audioBuffer,
      mimeType: 'audio/mpeg',
    };
  } catch (error) {
    console.error('TTS failed:', error);
    throw new Error('Failed to generate speech audio. Please check your OpenAI API key.');
  }
}
