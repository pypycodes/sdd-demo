/**
 * Additional integration tests for care-journey routes that require mocking
 * downstream services (AI, TTS, transcript storage) to avoid slow network
 * calls or mutating real files on disk during tests.
 */

jest.mock('../../services/ai-service', () => ({
  analyzeCareJourney: jest.fn(),
  getProviderLabel: jest.fn(() => 'MockProvider (mock-model)'),
}));

jest.mock('../../services/voice-service', () => ({
  textToSpeech: jest.fn(),
}));

jest.mock('../../services/transcript-service', () => ({
  saveConversation: jest.fn(),
  getConversationsByPatient: jest.fn(),
  getConversationById: jest.fn(),
  deleteConversation: jest.fn(),
}));

import request from 'supertest';
import express from 'express';
import careJourneyRoutes from '../care-journey';
import { analyzeCareJourney } from '../../services/ai-service';
import { textToSpeech } from '../../services/voice-service';
import { saveConversation, getConversationsByPatient, deleteConversation } from '../../services/transcript-service';

const app = express();
app.use(express.json());
app.use('/api', careJourneyRoutes);

describe('Care Journey Routes - AI analysis endpoint', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the AI analysis for a valid patient', async () => {
    (analyzeCareJourney as jest.Mock).mockResolvedValue({
      patientId: 'P001',
      currentPhase: 'Active Treatment',
      journeySummary: 'Doing great',
      nextBestActions: [],
      careGaps: [],
      progressPercentage: 80,
      aiMetadata: { provider: 'Mock', model: 'mock', tokensPrompt: 1, tokensCompletion: 1, tokensTotal: 2, latencyMs: 5 },
    });

    const response = await request(app).post('/api/patients/P001/analyze');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.currentPhase).toBe('Active Treatment');
  });

  it('should return 404 for an unknown patient', async () => {
    const response = await request(app).post('/api/patients/UNKNOWN_ID/analyze');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Patient not found');
  });

  it('should return 500 with a friendly error when AI analysis fails', async () => {
    (analyzeCareJourney as jest.Mock).mockRejectedValue(new Error('AI service temporarily unavailable'));

    const response = await request(app).post('/api/patients/P001/analyze');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('AI analysis failed');
  });
});

describe('Care Journey Routes - Messages endpoints', () => {
  it('should return unread count and latest message shape for a valid patient', async () => {
    const response = await request(app).get('/api/patients/P001/messages/unread-count');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('patientId', 'P001');
    expect(response.body.data).toHaveProperty('unreadCount');
    expect(response.body.data).toHaveProperty('latestMessage');
  });

  it('should return 404 for unread-count on an unknown patient', async () => {
    const response = await request(app).get('/api/patients/UNKNOWN_ID/messages/unread-count');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 when marking a non-existent message as read', async () => {
    const response = await request(app).post('/api/patients/P001/messages/does-not-exist/mark-read');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Failed to mark message as read');
  });
});

describe('Care Journey Routes - Voice TTS endpoint', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when text is missing', async () => {
    const response = await request(app).post('/api/voice/tts').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Text is required');
  });

  it('should return audio buffer with correct content-type on success', async () => {
    (textToSpeech as jest.Mock).mockResolvedValue({
      audioBuffer: Buffer.from('fake-audio'),
      mimeType: 'audio/mpeg',
    });

    const response = await request(app).post('/api/voice/tts').send({ text: 'Hello' });

    expect(response.status).toBe(200);
    expect(response.header['content-type']).toContain('audio/mpeg');
  });

  it('should return 500 with a friendly error when TTS fails', async () => {
    (textToSpeech as jest.Mock).mockRejectedValue(new Error('Failed to generate speech audio'));

    const response = await request(app).post('/api/voice/tts').send({ text: 'Hello' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('TTS failed');
  });
});

describe('Care Journey Routes - Voice conversations endpoints', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when patientId or transcript is missing', async () => {
    const response = await request(app).post('/api/voice/conversations').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('patientId and transcript are required');
  });

  it('should save a conversation successfully', async () => {
    (saveConversation as jest.Mock).mockReturnValue({
      id: 'VC-1',
      patientId: 'P001',
      transcript: [],
      duration: 30,
      timestamp: '2026-01-01T00:00:00Z',
    });

    const response = await request(app)
      .post('/api/voice/conversations')
      .send({ patientId: 'P001', transcript: [{ speaker: 'patient', text: 'hi' }], duration: 30 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('VC-1');
  });

  it('should return 500 with a friendly error when saving fails', async () => {
    (saveConversation as jest.Mock).mockImplementation(() => {
      throw new Error('disk full');
    });

    const response = await request(app)
      .post('/api/voice/conversations')
      .send({ patientId: 'P001', transcript: [] });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Failed to save conversation');
  });

  it('should list conversations for a patient', async () => {
    (getConversationsByPatient as jest.Mock).mockReturnValue([
      { id: 'VC-1', patientId: 'P001', transcript: [], duration: 1, timestamp: 't' },
    ]);

    const response = await request(app).get('/api/voice/conversations/P001');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it('should delete a conversation and report deleted=true', async () => {
    (deleteConversation as jest.Mock).mockReturnValue(true);

    const response = await request(app).delete('/api/voice/conversations/VC-1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);
  });

  it('should report deleted=false when the conversation does not exist', async () => {
    (deleteConversation as jest.Mock).mockReturnValue(false);

    const response = await request(app).delete('/api/voice/conversations/VC-missing');

    expect(response.status).toBe(200);
    expect(response.body.data.deleted).toBe(false);
  });
});
