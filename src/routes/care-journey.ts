import { Router, Request, Response } from 'express';
import { SAMPLE_PATIENTS, findPatientById } from '../data/sample-patients';
import { analyzeCareJourney, getProviderLabel } from '../services/ai-service';
import { textToSpeech } from '../services/voice-service';
import { saveConversation, getConversationsByPatient, getConversationById, deleteConversation } from '../services/transcript-service';
import { ApiResponse, JourneyAnalysis, Patient, VoiceConversation, VoiceTranscriptEntry } from '../types/care-journey';

const router = Router();

/** GET /api/patients — List all sample patients */
router.get('/patients', (_req: Request, res: Response): void => {
  const summary = SAMPLE_PATIENTS.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    primaryDiagnosis: p.primaryDiagnosis,
    totalEvents: p.careEvents.length,
    completedEvents: p.careEvents.filter((e) => e.status === 'completed').length,
    overdueEvents: p.careEvents.filter((e) => e.status === 'overdue').length,
  }));
  const response: ApiResponse<typeof summary> = { success: true, data: summary };
  res.json(response);
});

/** GET /api/patients/:id — Get full patient journey */
router.get('/patients/:id', (req: Request, res: Response): void => {
  const patient: Patient | undefined = findPatientById(req.params.id);
  if (!patient) {
    const response: ApiResponse<never> = { success: false, error: 'Patient not found' };
    res.status(404).json(response);
    return;
  }
  const response: ApiResponse<Patient> = { success: true, data: patient };
  res.json(response);
});

/** POST /api/patients/:id/analyze — AI analysis of care journey */
router.post('/patients/:id/analyze', async (req: Request, res: Response): Promise<void> => {
  const patient: Patient | undefined = findPatientById(req.params.id);
  if (!patient) {
    const response: ApiResponse<never> = { success: false, error: 'Patient not found' };
    res.status(404).json(response);
    return;
  }
  try {
    const analysis: JourneyAnalysis = await analyzeCareJourney(patient);
    const response: ApiResponse<JourneyAnalysis> = { success: true, data: analysis };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`AI analysis failed [${getProviderLabel()}]:`, message);
    const response: ApiResponse<never> = { success: false, error: `AI analysis failed: ${message}` };
    res.status(500).json(response);
  }
});

/** POST /api/voice/tts — Convert text to speech */
router.post('/voice/tts', async (req: Request, res: Response): Promise<void> => {
  const { text, voice } = req.body;
  if (!text) {
    const response: ApiResponse<never> = { success: false, error: 'Text is required' };
    res.status(400).json(response);
    return;
  }
  try {
    const result = await textToSpeech({ text, voice });
    res.set('Content-Type', result.mimeType);
    res.send(result.audioBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = { success: false, error: `TTS failed: ${message}` };
    res.status(500).json(response);
  }
});

/** POST /api/voice/conversations — Save a voice conversation */
router.post('/voice/conversations', (req: Request, res: Response): void => {
  const { patientId, transcript, duration, summary } = req.body;
  if (!patientId || !transcript) {
    const response: ApiResponse<never> = { success: false, error: 'patientId and transcript are required' };
    res.status(400).json(response);
    return;
  }
  try {
    const conversation = saveConversation({
      patientId,
      transcript,
      duration: duration || 0,
      summary,
      timestamp: new Date().toISOString(),
    });
    const response: ApiResponse<VoiceConversation> = { success: true, data: conversation };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = { success: false, error: `Failed to save conversation: ${message}` };
    res.status(500).json(response);
  }
});

/** GET /api/voice/conversations/:patientId — Get all conversations for a patient */
router.get('/voice/conversations/:patientId', (req: Request, res: Response): void => {
  const { patientId } = req.params;
  const conversations = getConversationsByPatient(patientId);
  const response: ApiResponse<VoiceConversation[]> = { success: true, data: conversations };
  res.json(response);
});

/** DELETE /api/voice/conversations/:id — Delete a conversation */
router.delete('/voice/conversations/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const deleted = deleteConversation(id);
  const response: ApiResponse<{ deleted: boolean }> = { success: true, data: { deleted } };
  res.json(response);
});

export default router;
