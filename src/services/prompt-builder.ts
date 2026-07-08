import { Patient, CareEvent, UpcomingAppointment, BillingSummary } from '../types/care-journey';

/** Format care events into a readable timeline for the AI prompt */
function formatCareTimeline(events: readonly CareEvent[]): string {
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted
    .map((e, i) => `${i + 1}. [${e.date}] ${e.category.toUpperCase()} - ${e.title} (${e.status}): ${e.description}`)
    .join('\n');
}

/** Build the system prompt for care journey analysis */
export function buildSystemPrompt(): string {
  return `You are a friendly, empathetic AI health assistant built into a patient portal. The patient is logged in and reading your analysis directly. ALWAYS address the patient in second person — use "you" and "your", never refer to them by name or in third person.

Your role is to analyze the patient's care journey and provide:

1. **Current Phase**: Where they are in their care journey (e.g., "Post-Diagnosis Monitoring", "Active Treatment", "Recovery & Follow-up")
2. **Journey Summary**: A 2-3 sentence warm, plain-language summary addressed directly to the patient (e.g., "You've made great progress with..." not "Maria has made progress...")
3. **Next Best Actions**: The top 3-5 recommended next steps, each with:
   - action: What the patient should do, written as a direct recommendation (e.g., "Schedule your annual eye exam" not "Patient should schedule eye exam")
   - reason: Why it matters to them personally (e.g., "This helps protect your vision" not "Important for diabetic patients")
   - urgency: "routine" | "soon" | "urgent" | "emergency"
   - timeframe: When it should happen (e.g., "Within 1 week", "Within 30 days")
   - category: "visit" | "lab" | "imaging" | "medication" | "referral" | "procedure" | "follow-up" | "education"
4. **Care Gaps**: Any missed or overdue items, phrased for the patient (e.g., "Your annual diabetic eye exam is overdue" not "Diabetic eye exam overdue")
5. **Progress Percentage**: Estimated journey completion (0-100)
6. **Appointment Preparation** (if patient has upcoming appointments): For the NEXT upcoming appointment, provide:
   - appointmentId: The ID of the appointment
   - suggestedQuestions: 3-5 personalized questions the patient should ask their provider, based on their specific care history, recent events, and conditions
   - relevantHistory: 2-3 recent care events or health data points relevant to this specific visit
7. **Cost Explainer** (if patient has billing/balance due): Help the patient understand their bill in plain language:
   - summaryInPlainLanguage: A friendly 2-3 sentence explanation of what they owe and why (e.g., "Your recent visits totaled $847, and after your insurance paid their portion, you're responsible for $107.50. You've already paid $25, so your remaining balance is $82.50.")
   - insuranceExplanation: Explain what insurance covered and any adjustments in simple terms
   - paymentOptions: 2-3 payment options available (e.g., "Pay online", "Set up a payment plan", "Contact billing office")
   - questionsToAsk: 2-3 questions the patient might want to ask the billing department

TONE GUIDELINES:
- Warm, supportive, and encouraging — like a caring nurse or health coach.
- Use "you" and "your" throughout. Never use the patient's name in the summary or actions.
- Keep language simple and jargon-free. Explain medical terms briefly if used.
- Celebrate completed milestones (e.g., "Great job staying on track with your labs!").

CRITICAL SAFETY RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
- This is a DEMO/POC only. You are NOT a doctor, nurse, pharmacist, or any healthcare professional.
- NEVER suggest, recommend, or name any specific medications, drugs, supplements, or dosages.
- NEVER suggest, recommend, or name any specific lab tests, blood work, scans, imaging, or diagnostic procedures.
- NEVER suggest alternative medications, treatments, therapies, or tests.
- NEVER interpret lab values, vital signs, symptoms, or diagnoses.
- NEVER tell the patient what is wrong with them or provide any clinical assessment.
- ONLY remind the patient about upcoming or overdue appointments and general care coordination.
- Frame ALL actions as appointment/scheduling reminders (e.g., "It looks like it's time to check in with your care team" not "You need an HbA1c test").
- Use ONLY phrases like: "Reach out to your care team", "Consider scheduling a visit with your doctor", "Your records show you have an upcoming appointment", "Talk to your provider about your next steps".
- Always include the disclaimer that this is for informational purposes only and is NOT a substitute for professional medical advice.
- Always flag overdue items as care gaps but phrase them as scheduling reminders, not clinical recommendations.
- Respond ONLY with valid JSON matching the specified schema.`;
}

/** Format upcoming appointments for the prompt */
function formatUpcomingAppointments(appointments: readonly UpcomingAppointment[] | undefined): string {
  if (!appointments || appointments.length === 0) return 'None scheduled';
  return appointments
    .map((a, i) => `${i + 1}. [${a.date} ${a.time}] ${a.type} with ${a.provider} (${a.specialty}) - Reason: ${a.reason} - Location: ${a.location}${a.priorAuthRequired ? ' [Prior Auth Required]' : ''} (ID: ${a.id})`)
    .join('\n');
}

/** Format billing summary for the prompt */
function formatBillingSummary(billing: BillingSummary | undefined): string {
  if (!billing) return 'No billing information available';
  const itemsList = billing.items
    .map((item, i) => `  ${i + 1}. ${item.service} (${item.date}) - Charged: $${item.chargedAmount.toFixed(2)}, Insurance Paid: $${item.insurancePaid.toFixed(2)}, Your Responsibility: $${item.patientResponsibility.toFixed(2)} [${item.status}]`)
    .join('\n');
  return `Total Charges: $${billing.totalCharges.toFixed(2)}
Insurance Paid: $${billing.insurancePaid.toFixed(2)}
Adjustments: $${billing.adjustments.toFixed(2)}
Your Responsibility: $${billing.patientResponsibility.toFixed(2)}
Amount Already Paid: $${billing.amountPaid.toFixed(2)}
Balance Due: $${billing.balanceDue.toFixed(2)}
Payment Plan Available: ${billing.paymentPlanAvailable ? 'Yes' : 'No'}

Line Items:
${itemsList}`;
}

/** Build the user prompt with patient context */
export function buildUserPrompt(patient: Patient): string {
  const timeline = formatCareTimeline(patient.careEvents);
  const appointments = formatUpcomingAppointments(patient.upcomingAppointments);
  const billing = formatBillingSummary(patient.billing);
  const hasAppointments = patient.upcomingAppointments && patient.upcomingAppointments.length > 0;
  const hasBilling = patient.billing && patient.billing.balanceDue > 0;
  return `The following patient is logged into their portal and will read your analysis directly. Analyze their care journey and provide personalized next best action recommendations. Address them as "you"/"your" throughout.

**Patient Profile:**
- Name: ${patient.name}
- Age: ${patient.age}, Gender: ${patient.gender}
- Primary Diagnosis: ${patient.primaryDiagnosis}
- Conditions: ${patient.conditions.join(', ')}

**Care Timeline:**
${timeline}

**Upcoming Appointments:**
${appointments}

**Billing Summary:**
${billing}

**Today's Date:** ${new Date().toISOString().split('T')[0]}

Respond with JSON in this exact format:
{
  "currentPhase": "string",
  "journeySummary": "string",
  "nextBestActions": [
    {
      "action": "string",
      "reason": "string",
      "urgency": "routine|soon|urgent|emergency",
      "timeframe": "string",
      "category": "visit|lab|imaging|medication|referral|procedure|follow-up|education"
    }
  ],
  "careGaps": ["string"],
  "progressPercentage": number${hasAppointments ? `,
  "appointmentPrep": {
    "appointmentId": "string (use the ID from the NEXT upcoming appointment)",
    "suggestedQuestions": ["string (3-5 personalized questions based on patient's specific care history)"],
    "relevantHistory": ["string (2-3 recent care events relevant to this visit)"]
  }` : ''}${hasBilling ? `,
  "costExplainer": {
    "summaryInPlainLanguage": "string (friendly 2-3 sentence explanation of what they owe)",
    "insuranceExplanation": "string (what insurance covered in simple terms)",
    "paymentOptions": ["string (2-3 payment options)"],
    "questionsToAsk": ["string (2-3 questions for billing department)"]
  }` : ''}
}`;
}
