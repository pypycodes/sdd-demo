/**
 * Unit tests for AI Service.
 *
 * NOTE: This file previously contained only placeholder `TODO` test bodies
 * that always passed without exercising any real logic (0% effective
 * coverage of retries, JSON extraction, and error handling). Per the
 * project's Test-First policy (Constitution Principle I, 85% minimum
 * coverage), it has been rewritten with real, mocked-OpenAI tests below.
 */

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { Patient } from '../../types/care-journey';

describe('ai-service', () => {
  const ORIGINAL_ENV = process.env;

  const patient: Patient = {
    id: 'P-TEST',
    name: 'Test Patient',
    age: 50,
    gender: 'Male',
    primaryDiagnosis: 'Diabetes',
    conditions: ['Diabetes'],
    careEvents: [],
  };

  const validAiJson = {
    currentPhase: 'Active Treatment',
    journeySummary: 'You are doing well.',
    nextBestActions: [],
    careGaps: [],
    progressPercentage: 50,
  };

  beforeEach(() => {
    jest.resetModules();
    mockCreate.mockReset();
    process.env = { ...ORIGINAL_ENV, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key' };
    delete process.env.AI_MODEL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('getProviderLabel', () => {
    it('should return provider label with model name in parentheses', () => {
      const { getProviderLabel } = require('../ai-service');
      const label = getProviderLabel();
      expect(label).toBeTruthy();
      expect(label).toMatch(/\(/);
      expect(label).toMatch(/\)/);
      expect(label).toMatch(/OpenAI/);
    });

    it('should not expose API keys in the label', () => {
      const { getProviderLabel } = require('../ai-service');
      const label = getProviderLabel();
      expect(label).not.toMatch(/sk-/);
      expect(label).not.toMatch(/gsk_/);
      expect(label).not.toMatch(/AIza/);
    });

    it('should use AI_MODEL env override when provided', () => {
      process.env.AI_MODEL = 'custom-model-x';
      const { getProviderLabel } = require('../ai-service');
      expect(getProviderLabel()).toContain('custom-model-x');
    });
  });

  describe('Provider Configuration', () => {
    it('should throw for an unknown AI_PROVIDER', () => {
      process.env.AI_PROVIDER = 'not-a-real-provider';
      expect(() => require('../ai-service')).toThrow(/Unknown AI_PROVIDER/);
    });

    it('should default to openai when AI_PROVIDER is not set', () => {
      delete process.env.AI_PROVIDER;
      const { getProviderLabel } = require('../ai-service');
      expect(getProviderLabel()).toMatch(/OpenAI/);
    });
  });

  describe('analyzeCareJourney - success paths', () => {
    it('should successfully analyze a care journey and parse a valid JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(validAiJson) } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      });

      const { analyzeCareJourney } = require('../ai-service');
      const result = await analyzeCareJourney(patient);

      expect(result.patientId).toBe('P-TEST');
      expect(result.currentPhase).toBe('Active Treatment');
      expect(result.aiMetadata.tokensTotal).toBe(30);
      expect(result.aiMetadata.tokensPrompt).toBe(10);
      expect(result.aiMetadata.tokensCompletion).toBe(20);
    });

    it('should include provider metadata (provider, model, latencyMs) in the response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(validAiJson) } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });

      const { analyzeCareJourney } = require('../ai-service');
      const result = await analyzeCareJourney(patient);

      expect(result.aiMetadata).toHaveProperty('provider');
      expect(result.aiMetadata).toHaveProperty('model');
      expect(result.aiMetadata).toHaveProperty('latencyMs');
      expect(typeof result.aiMetadata.latencyMs).toBe('number');
    });

    it('should log request/response with attempt number and token count', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(validAiJson) } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });

      const { analyzeCareJourney } = require('../ai-service');
      await analyzeCareJourney(patient);

      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/attempt 1\/3/));
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/tokens in \d+ms/));
      logSpy.mockRestore();
    });

    it('should extract JSON wrapped in markdown code fences', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '```json\n' + JSON.stringify(validAiJson) + '\n```' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });

      const { analyzeCareJourney } = require('../ai-service');
      const result = await analyzeCareJourney(patient);

      expect(result.currentPhase).toBe('Active Treatment');
    });

    it('should extract a JSON object from mixed surrounding text', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: `Sure, here you go:\n${JSON.stringify(validAiJson)}\nHope that helps!` } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });

      const { analyzeCareJourney } = require('../ai-service');
      const result = await analyzeCareJourney(patient);

      expect(result.currentPhase).toBe('Active Treatment');
    });
  });

  describe('analyzeCareJourney - error handling', () => {
    it('should throw a friendly error (no raw API details) when the AI returns no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: {} }],
        usage: { prompt_tokens: 1, completion_tokens: 0, total_tokens: 1 },
      });
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');

      await expect(analyzeCareJourney(patient)).rejects.toThrow('AI service temporarily unavailable');
      errSpy.mockRestore();
    }, 15000);

    it('should throw a friendly error when the AI response cannot be parsed as JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'not valid json at all' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');

      await expect(analyzeCareJourney(patient)).rejects.toThrow('AI service temporarily unavailable');
      errSpy.mockRestore();
    }, 15000);

    it('should not expose raw stack traces or internal error objects in the thrown message', async () => {
      mockCreate.mockRejectedValue(new Error('invalid_api_key: sk-abc123'));
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');

      try {
        await analyzeCareJourney(patient);
        fail('expected analyzeCareJourney to throw');
      } catch (e) {
        const message = (e as Error).message;
        expect(message).not.toMatch(/ at /); // no stack trace pattern
      }
      errSpy.mockRestore();
    });

    it('should retry on a rate-limit (429) error and succeed on the second attempt', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('429 rate limited'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(validAiJson) } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        });
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');
      const result = await analyzeCareJourney(patient);

      expect(result.currentPhase).toBe('Active Treatment');
      expect(mockCreate).toHaveBeenCalledTimes(2);
      logSpy.mockRestore();
    }, 15000);

    it('should retry on a "503 overloaded" error', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('503 service overloaded'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(validAiJson) } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        });
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');
      const result = await analyzeCareJourney(patient);

      expect(result.currentPhase).toBe('Active Treatment');
      expect(mockCreate).toHaveBeenCalledTimes(2);
      logSpy.mockRestore();
    }, 15000);

    it('should not retry on a non-retryable error and fail after a single attempt', async () => {
      mockCreate.mockRejectedValue(new Error('invalid_api_key'));
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');

      await expect(analyzeCareJourney(patient)).rejects.toThrow('AI service temporarily unavailable');
      expect(mockCreate).toHaveBeenCalledTimes(1);
      errSpy.mockRestore();
    });

    it('should give up after MAX_RETRIES (3) attempts for persistent rate-limit errors', async () => {
      mockCreate.mockRejectedValue(new Error('429 rate limited'));
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const { analyzeCareJourney } = require('../ai-service');

      await expect(analyzeCareJourney(patient)).rejects.toThrow('AI service temporarily unavailable');
      expect(mockCreate).toHaveBeenCalledTimes(3);
      logSpy.mockRestore();
      errSpy.mockRestore();
    }, 20000);
  });
});
