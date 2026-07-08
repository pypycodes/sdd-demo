import * as fs from 'fs';
import * as path from 'path';
import { VoiceConversation, VoiceTranscriptEntry } from '../types/care-journey';

/** Storage file for voice conversations */
const TRANSCRIPTS_FILE = path.join(__dirname, '../../public/voice-transcripts.json');

/** Load all voice conversations from JSON file */
function loadTranscripts(): VoiceConversation[] {
  try {
    if (!fs.existsSync(TRANSCRIPTS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(TRANSCRIPTS_FILE, 'utf-8');
    const data = JSON.parse(content);
    return data.transcripts || [];
  } catch (error) {
    console.error('Failed to load transcripts:', error);
    return [];
  }
}

/** Save all voice conversations to JSON file */
function saveTranscripts(transcripts: VoiceConversation[]): void {
  try {
    const data = { transcripts };
    fs.writeFileSync(TRANSCRIPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save transcripts:', error);
    throw new Error('Failed to save transcript');
  }
}

/** Generate a unique conversation ID */
function generateConversationId(): string {
  return `VC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Save a new voice conversation */
export function saveConversation(conversation: Omit<VoiceConversation, 'id'>): VoiceConversation {
  const transcripts = loadTranscripts();
  const newConversation: VoiceConversation = {
    id: generateConversationId(),
    ...conversation,
  };
  transcripts.push(newConversation);
  saveTranscripts(transcripts);
  return newConversation;
}

/** Get all conversations for a patient */
export function getConversationsByPatient(patientId: string): VoiceConversation[] {
  const transcripts = loadTranscripts();
  return transcripts.filter(c => c.patientId === patientId);
}

/** Get a specific conversation by ID */
export function getConversationById(conversationId: string): VoiceConversation | undefined {
  const transcripts = loadTranscripts();
  return transcripts.find(c => c.id === conversationId);
}

/** Delete a conversation by ID */
export function deleteConversation(conversationId: string): boolean {
  const transcripts = loadTranscripts();
  const index = transcripts.findIndex(c => c.id === conversationId);
  if (index === -1) return false;
  transcripts.splice(index, 1);
  saveTranscripts(transcripts);
  return true;
}
