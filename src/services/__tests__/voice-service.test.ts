const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      speech: {
        create: mockCreate,
      },
    },
  }));
});

describe('voice-service', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockCreate.mockReset();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should throw a friendly error when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const { textToSpeech } = require('../voice-service');

    await expect(textToSpeech({ text: 'Hello' })).rejects.toThrow(
      'OPENAI_API_KEY is required for TTS'
    );
  });

  it('should return an mp3 audio buffer on success', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      arrayBuffer: async () => new TextEncoder().encode('fake-audio-data').buffer,
    });

    const { textToSpeech } = require('../voice-service');
    const result = await textToSpeech({ text: 'Hello world' });

    expect(result.mimeType).toBe('audio/mpeg');
    expect(Buffer.isBuffer(result.audioBuffer)).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'tts-1', input: 'Hello world', voice: 'alloy' })
    );
  });

  it('should use the requested voice when provided', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockResolvedValue({
      arrayBuffer: async () => new TextEncoder().encode('data').buffer,
    });

    const { textToSpeech } = require('../voice-service');
    await textToSpeech({ text: 'Hi', voice: 'nova' });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ voice: 'nova' }));
  });

  it('should throw a friendly error when the OpenAI call fails', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    mockCreate.mockRejectedValue(new Error('network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { textToSpeech } = require('../voice-service');

    await expect(textToSpeech({ text: 'Hello' })).rejects.toThrow(
      'Failed to generate speech audio'
    );
    consoleSpy.mockRestore();
  });
});
