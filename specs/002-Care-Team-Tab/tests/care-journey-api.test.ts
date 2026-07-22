import request from 'supertest';
import express from 'express';
import careJourneyRoutes from '../care-journey';

/**
 * Integration tests for Care Journey Routes
 * 
 * These tests validate:
 * - API response structure (ApiResponse<T>)
 * - Patient data retrieval
 * - AI analysis endpoint
 * - Voice conversation endpoints
 * - Error handling with user-friendly messages
 */

const app = express();
app.use(express.json());
app.use('/api', careJourneyRoutes);

describe('Care Journey Routes', () => {
  describe('GET /api/patients', () => {
    it('should return list of patients with success=true', async () => {
      const response = await request(app).get('/api/patients');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include patient summary fields', async () => {
      const response = await request(app).get('/api/patients');

      if (response.body.data.length > 0) {
        const patient = response.body.data[0];
        expect(patient).toHaveProperty('id');
        expect(patient).toHaveProperty('name');
        expect(patient).toHaveProperty('age');
        expect(patient).toHaveProperty('primaryDiagnosis');
        expect(patient).toHaveProperty('totalEvents');
        expect(patient).toHaveProperty('completedEvents');
        expect(patient).toHaveProperty('overdueEvents');
      }
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should return full patient journey with success=true', async () => {
      // Assuming patient with id "1" exists in sample data
      const response = await request(app).get('/api/patients/1');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', '1');
        expect(response.body.data).toHaveProperty('careEvents');
        expect(Array.isArray(response.body.data.careEvents)).toBe(true);
      }
    });

    it('should return 404 with user-friendly error for nonexistent patient', async () => {
      const response = await request(app).get('/api/patients/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Patient not found');
    });

    it('should NOT expose internal errors to user', async () => {
      const response = await request(app).get('/api/patients/999999');

      expect(response.body.error).not.toMatch(/Error:/);
      expect(response.body.error).not.toMatch(/at /); // Stack trace pattern
    });

    it('should include careTeam array for a patient that has one (Care Team Tab feature)', async () => {
      const response = await request(app).get('/api/patients/P001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('careTeam');
      expect(Array.isArray(response.body.data.careTeam)).toBe(true);
      expect(response.body.data.careTeam.length).toBeGreaterThan(0);
    });

    it('should include the primary doctor identified via role, plus other members', async () => {
      const response = await request(app).get('/api/patients/P001');

      const careTeam = response.body.data.careTeam as Array<{ name: string; role: string; phone: string }>;
      const primaryDoctor = careTeam.find((m) => m.role.toLowerCase().includes('primary care'));

      expect(primaryDoctor).toBeDefined();
      expect(primaryDoctor).toHaveProperty('name');
      expect(primaryDoctor).toHaveProperty('role');
      expect(careTeam.length).toBeGreaterThanOrEqual(1);
    });

    it('each careTeam member should have name, role, and phone fields', async () => {
      const response = await request(app).get('/api/patients/P001');

      const careTeam = response.body.data.careTeam as Array<{ name: string; role: string; phone: string }>;
      careTeam.forEach((member) => {
        expect(typeof member.name).toBe('string');
        expect(member.name.length).toBeGreaterThan(0);
        expect(typeof member.role).toBe('string');
        expect(member.role.length).toBeGreaterThan(0);
        expect(typeof member.phone).toBe('string');
      });
    });
  });

  describe('POST /api/patients/:id/analyze', () => {
    it('should return JourneyAnalysis with AI metadata', async () => {
      // TODO: Mock analyzeCareJourney to return valid response
      // Post to /api/patients/1/analyze
      // Verify response includes:
      // - success: true
      // - data.currentPhase (string)
      // - data.journeySummary (string)
      // - data.nextBestActions (array)
      // - data.careGaps (array)
      // - data.progressPercentage (number)
      // - data.aiMetadata (object with provider, model, tokens, latencyMs)
    });

    it('should use second-person language in summary', async () => {
      // TODO: Mock analyzeCareJourney
      // Verify journeySummary uses "you" or "your"
      // Verify journeySummary does NOT contain patient name
    });

    it('should return user-friendly error if AI service fails', async () => {
      // TODO: Mock analyzeCareJourney to throw error
      // Verify response.error contains: "AI service temporarily unavailable"
      // Verify response.error does NOT contain raw API error
    });

    it('should validate patient exists before calling AI', async () => {
      const response = await request(app)
        .post('/api/patients/999999/analyze');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Patient not found');
    });
  });

  describe('POST /api/voice/conversations', () => {
    it('should require patientId and transcript', async () => {
      const response = await request(app)
        .post('/api/voice/conversations')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should save conversation with metadata', async () => {
      // TODO: Mock saveConversation
      // Post with valid patientId, transcript, duration, summary
      // Verify response includes conversation object with id and timestamp
    });

    it('should NOT persist PII in transcript storage', async () => {
      // TODO: Verify conversation storage does not contain patient names
      // This is a documentation test - ensure in-memory only
    });
  });

  describe('GET /api/voice/conversations/:patientId', () => {
    it('should return array of conversations for patient', async () => {
      // TODO: Mock getConversationsByPatient
      // Get /api/voice/conversations/1
      // Verify response is array of VoiceConversation objects
    });

    it('should return empty array if no conversations', async () => {
      // TODO: Mock getConversationsByPatient to return []
      // Verify response.data is empty array
      // Verify response.success is true
    });
  });

  describe('DELETE /api/voice/conversations/:id', () => {
    it('should return deleted flag', async () => {
      // TODO: Mock deleteConversation
      // Delete /api/voice/conversations/some-id
      // Verify response includes { deleted: true }
    });
  });

  describe('API Response Structure', () => {
    it('should always return valid JSON', async () => {
      const response = await request(app).get('/api/patients');

      expect(response.type).toMatch(/json/);
      expect(response.body).toBeTruthy();
      expect(typeof response.body).toBe('object');
    });

    it('should always include success field', async () => {
      const responses = [
        await request(app).get('/api/patients'),
        await request(app).get('/api/patients/1'),
        await request(app).get('/api/patients/999999'),
      ];

      responses.forEach((response) => {
        expect(response.body).toHaveProperty('success');
        expect(typeof response.body.success).toBe('boolean');
      });
    });
  });
});
