/** Status of a care event in the journey */
export type CareEventStatus = 'completed' | 'in-progress' | 'upcoming' | 'overdue' | 'cancelled';

/** Category of a care event */
export type CareEventCategory = 'visit' | 'lab' | 'imaging' | 'medication' | 'referral' | 'procedure' | 'follow-up' | 'education';

/** Urgency level for next best action */
export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'emergency';

/** A single care event in the patient journey */
export interface CareEvent {
  readonly id: string;
  readonly date: string;
  readonly category: CareEventCategory;
  readonly title: string;
  readonly description: string;
  readonly provider: string;
  readonly status: CareEventStatus;
  readonly details?: string;
}

/** Upcoming appointment for appointment preparation feature */
export interface UpcomingAppointment {
  readonly id: string;
  readonly date: string;
  readonly time: string;
  readonly provider: string;
  readonly specialty: string;
  readonly type: string;
  readonly location: string;
  readonly reason: string;
  readonly priorAuthRequired?: boolean;
}

/** Billing line item */
export interface BillingItem {
  readonly service: string;
  readonly date: string;
  readonly provider: string;
  readonly chargedAmount: number;
  readonly insurancePaid: number;
  readonly adjustments: number;
  readonly patientResponsibility: number;
  readonly status: 'paid' | 'pending' | 'overdue';
}

/** Patient billing summary */
export interface BillingSummary {
  readonly totalCharges: number;
  readonly insurancePaid: number;
  readonly adjustments: number;
  readonly patientResponsibility: number;
  readonly amountPaid: number;
  readonly balanceDue: number;
  readonly paymentPlanAvailable: boolean;
  readonly items: readonly BillingItem[];
}

/** Patient demographic and clinical summary */
export interface Patient {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly gender: string;
  readonly primaryDiagnosis: string;
  readonly conditions: readonly string[];
  readonly careEvents: readonly CareEvent[];
  readonly upcomingAppointments?: readonly UpcomingAppointment[];
  readonly billing?: BillingSummary;
}

/** AI-generated next best action recommendation */
export interface NextBestAction {
  readonly action: string;
  readonly reason: string;
  readonly urgency: UrgencyLevel;
  readonly timeframe: string;
  readonly category: CareEventCategory;
}

/** AI provider and token usage metadata */
export interface AiMetadata {
  readonly provider: string;
  readonly model: string;
  readonly tokensPrompt: number;
  readonly tokensCompletion: number;
  readonly tokensTotal: number;
  readonly latencyMs: number;
}

/** AI-generated appointment preparation content (personalized, not handled by Luma) */
export interface AppointmentPrep {
  readonly appointmentId: string;
  readonly suggestedQuestions: readonly string[];
  readonly relevantHistory: readonly string[];
}

/** AI-generated cost/payment explanation (not handled by Luma/Nia) */
export interface CostExplainer {
  readonly summaryInPlainLanguage: string;
  readonly insuranceExplanation: string;
  readonly paymentOptions: readonly string[];
  readonly questionsToAsk: readonly string[];
}

/** Full AI analysis response for a patient journey */
export interface JourneyAnalysis {
  readonly patientId: string;
  readonly currentPhase: string;
  readonly journeySummary: string;
  readonly nextBestActions: readonly NextBestAction[];
  readonly careGaps: readonly string[];
  readonly progressPercentage: number;
  readonly appointmentPrep?: AppointmentPrep;
  readonly costExplainer?: CostExplainer;
  readonly aiMetadata: AiMetadata;
}

/** API response wrapper */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

/** Voice conversation transcript entry */
export interface VoiceTranscriptEntry {
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly timestamp: string;
  readonly audioUrl?: string;
}

/** Voice conversation for elderly care */
export interface VoiceConversation {
  readonly id: string;
  readonly patientId: string;
  readonly timestamp: string;
  readonly transcript: readonly VoiceTranscriptEntry[];
  readonly duration: number;
  readonly summary?: string;
}
