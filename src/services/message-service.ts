import { Message, Patient } from '../types/care-journey';
import { SAMPLE_PATIENTS } from '../data/sample-patients';

// Get patients data from sample data
const getPatientsData = (): readonly Patient[] => {
  return SAMPLE_PATIENTS;
};

/**
 * Get the unread message count for a patient
 * @param patientId - The patient ID
 * @returns The number of unread messages
 */
export function getUnreadCount(patientId: string): number {
  const patient = getPatientsData().find((p: Patient) => p.id === patientId);
  if (!patient || !patient.messages) {
    return 0;
  }
  return patient.messages.filter((m: Message) => !m.isRead).length;
}

/**
 * Get the latest unread message for a patient
 * @param patientId - The patient ID
 * @returns The latest unread message, or null if none exist
 */
export function getLatestUnreadMessage(patientId: string): Message | null {
  const patient = getPatientsData().find((p: Patient) => p.id === patientId);
  if (!patient || !patient.messages) {
    return null;
  }
  
  const unreadMessages = patient.messages.filter((m: Message) => !m.isRead);
  if (unreadMessages.length === 0) {
    return null;
  }
  
  // Sort by timestamp descending and return first (latest)
  return unreadMessages.sort((a: Message, b: Message) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
}

/**
 * Mark a message as read
 * @param patientId - The patient ID
 * @param messageId - The message ID to mark as read
 */
export function markMessageAsRead(patientId: string, messageId: string): void {
  const patient = getPatientsData().find((p: Patient) => p.id === patientId);
  
  if (!patient || !patient.messages) {
    throw new Error(`Patient ${patientId} not found or has no messages`);
  }
  
  const message = patient.messages.find((m: Message) => m.id === messageId);
  if (!message) {
    throw new Error(`Message ${messageId} not found for patient ${patientId}`);
  }
  
  // Update the message - note: In a real app, this would update the database
  // For now, we mutate the object (which is only safe in-memory for this POC)
  (message as any).isRead = true;
}

/**
 * Get all messages for a patient (read and unread)
 * @param patientId - The patient ID
 * @returns Array of all messages for the patient
 */
export function getAllMessages(patientId: string): Message[] {
  const patient = getPatientsData().find((p: Patient) => p.id === patientId);
  if (!patient || !patient.messages) {
    return [];
  }
  
  // Return sorted by timestamp (most recent first)
  return [...patient.messages].sort((a: Message, b: Message) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Format an ISO timestamp as a relative time string (e.g., "2 hours ago")
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Relative time string
 */
export function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older messages, show the date
  return date.toLocaleDateString();
}

/**
 * Truncate message content for preview display
 * @param content - The full message content
 * @param maxLength - Maximum length (default 100)
 * @returns Truncated content with "..." if needed
 */
export function truncateMessage(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
}
