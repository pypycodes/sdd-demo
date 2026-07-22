# Care Journey Tracker — AI Next Best Action POC

AI-powered patient care journey tracker that visualizes a patient's care timeline and uses **any LLM** to recommend the **next best actions** in their care journey.

Bring your own AI — works with OpenAI, Gemini, Groq, Mistral, Ollama, OpenRouter, and any OpenAI-compatible API.

## Features

- **Visual Care Timeline** — Interactive timeline of visits, labs, procedures, referrals, medications
- **"You Are Here" Marker** — Shows where the patient currently is in their care journey
- **AI Next Best Action** — Any LLM analyzes the journey and recommends next steps with urgency levels
- **Universal AI Provider** — Swap between OpenAI, Gemini, Groq, Ollama, etc. with 3 env vars
- **Care Gap Detection** — Identifies missed or overdue care items
- **Progress Tracking** — Estimated journey completion percentage
- **3 Sample Patients** — Diabetes management, Post-CABG cardiac, Preventive wellness

## Quick Start

### 1. Install dependencies

```bash
cd pcj-ai-proj1
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set AI_BASE_URL, AI_API_KEY, and AI_MODEL for your provider
```

### 3. Run the server

```bash
npm run dev
```

If the Port is already in use, you can kill it with:
```bash
kill $(lsof -t -i:3000) 2>/dev/null; sleep 1 && bash -c 'source ~/.bashrc 2>/dev/null; npx ts-node src/server.ts'
```


### 4. Open in browser

```
http://localhost:3000
```

## How It Works

1. Patient portal auto-loads the logged-in patient's care journey
2. Care timeline renders with "You Are Here" marker and status indicators
3. AI analysis auto-triggers — next best actions, care gaps, and progress appear instantly
4. Switch sample patients via the demo dropdown (top-right)

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: HTML + TailwindCSS (via CDN) + Vanilla JS
- **AI**: Any OpenAI-compatible LLM (configurable via env vars)

## Supported AI Providers

Switch providers by changing 3 env vars in `.env` — no code changes needed:

| Provider | `AI_BASE_URL` | `AI_MODEL` example |
|---|---|---|
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **OpenRouter** (200+ models) | `https://openrouter.ai/api/v1` | `google/gemini-2.0-flash-exp` |
| **Groq** (ultra-fast) | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **Together AI** | `https://api.together.xyz/v1` | `meta-llama/Llama-3-70b-chat-hf` |
| **Mistral** | `https://api.mistral.ai/v1` | `mistral-large-latest` |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` |
| **Ollama** (local, free) | `http://localhost:11434/v1` | `llama3` |

Example — switching from OpenAI to Groq:

```bash
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=gsk_your-groq-key
AI_MODEL=llama-3.3-70b-versatile
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all sample patients |
| GET | `/api/patients/:id` | Get full patient journey |
| POST | `/api/patients/:id/analyze` | AI analysis of care journey |

## Project Structure

```
pcj-ai-proj1/
├── public/               # Frontend
│   ├── index.html        # Main UI
│   └── app.js            # Frontend logic
├── src/                  # Backend (TypeScript)
│   ├── server.ts         # Express server
│   ├── routes/
│   │   └── care-journey.ts
│   ├── services/
│   │   ├── ai-service.ts     # Universal AI client (any provider)
│   │   └── prompt-builder.ts  # Shared prompts
│   ├── types/
│   │   └── care-journey.ts
│   └── data/
│       └── sample-patients.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## EHR Integration Guide — What Data Powers the AI

The AI prompt (in `src/services/prompt-builder.ts`) requires patient data to generate accurate **Next Best Actions** and **"You Are Here"** positioning. Below is what the AI receives today and what to feed it from your EHR for production use.

### Data Currently Sent to the AI

**Patient Profile:**

| Field | Type | Example | Purpose |
|---|---|---|---|
| `name` | string | Maria Garcia | Context |
| `age` | number | 58 | Age-appropriate screening recommendations |
| `gender` | string | Female | Gender-specific guidelines (e.g., mammogram) |
| `primaryDiagnosis` | string | Type 2 Diabetes | Drives the care pathway |
| `conditions[]` | string[] | Diabetes, Hypertension | Comorbidity-aware recommendations |

**Care Events (the timeline — core input):**

| Field | Type | Example | Purpose |
|---|---|---|---|
| `date` | string | 2024-04-15 | Timing, sequence, overdue detection |
| `category` | enum | visit, lab, imaging, medication, referral, procedure, follow-up, education | Determines what type of action is next |
| `title` | string | 3-Month Follow-up | Clinical context |
| `description` | string | HbA1c improved to 7.5%. Metformin increased to 1000mg | **Key clinical detail** — AI reads this for decision-making |
| `status` | enum | completed, in-progress, upcoming, overdue | **Drives "You Are Here"** and care gap detection |
| `provider` | string | Dr. Smith (PCP) | Care coordination context |

### EHR Data Needed for Production Accuracy

#### Tier 1 — Essential (high impact on recommendation quality)

| EHR Data | Why Needed | FHIR Resource | Maps To |
|---|---|---|---|
| **Problem List** | Active diagnoses drive care pathways | `Condition` | `patient.conditions[]` |
| **Medication List** | Drug interactions, adherence gaps | `MedicationRequest` | `careEvent` (category: medication) |
| **Lab Results** (with values) | "HbA1c = 7.5" not just "labs done" | `Observation` | `careEvent.description` |
| **Vital Signs** | BP trends, BMI tracking | `Observation` | `careEvent.description` |
| **Encounter History** | Visit dates, types, no-shows | `Encounter` | `careEvent` (category: visit) |
| **Pending Orders** | What's ordered but not completed | `ServiceRequest` | `careEvent` (status: upcoming) |

#### Tier 2 — Better Recommendations

| EHR Data | Why Needed | FHIR Resource | Maps To |
|---|---|---|---|
| **Immunization History** | Preventive care gaps (flu, pneumonia) | `Immunization` | `careEvent` (category: procedure) |
| **Allergies** | Drug/treatment contraindications | `AllergyIntolerance` | New field or `patient.conditions[]` |
| **Care Plans** | Existing goals and targets | `CarePlan` | New field on `Patient` type |
| **Referral Status** | Pending vs completed referrals | `ServiceRequest` | `careEvent` (category: referral) |
| **Social Determinants** | Transportation, language, insurance barriers | `Observation` (SDOH) | New field on `Patient` type |

#### Tier 3 — Advanced / Personalized

| EHR Data | Why Needed | FHIR Resource | Maps To |
|---|---|---|---|
| **Family History** | Risk-based screening (cancer, cardiac) | `FamilyMemberHistory` | New field on `Patient` type |
| **Patient Preferences** | Communication style, care goals | `Consent` / `Goal` | New field on `Patient` type |
| **Prior Authorization** | Don't recommend what isn't approved | Payer data | New field on `CareEvent` type |
| **Risk Scores** | HCC, readmission risk | Calculated | New field on `Patient` type |

### How to Populate from Your EHR

**Option A — FHIR API (recommended)**

```
EHR (Epic/Cerner/etc.)
  → FHIR R4 API
    → GET /Patient/{id}                    → patient profile
    → GET /Condition?patient={id}          → conditions[]
    → GET /Encounter?patient={id}          → care events (visits)
    → GET /Observation?patient={id}        → labs, vitals
    → GET /MedicationRequest?patient={id}  → medications
    → GET /ServiceRequest?patient={id}     → referrals, orders
  → Transform to Patient + CareEvent[] types
    → Feed to prompt-builder.ts
```

**Option B — HL7v2 / ADT feeds**

```
EHR → HL7v2 messages (ADT, ORU, ORM)
  → Integration engine (Integration Connect)
    → Transform to Patient + CareEvent[] types
      → POST /api/patients (custom endpoint)
```

**Option C — Direct DB query**

```
EHR database (read-only replica)
  → SQL query for patient data
    → Map to Patient + CareEvent[] types
```

### "You Are Here" Logic

The "You Are Here" marker does **not** use AI — it is purely determined by the `status` field:

```
Timeline events sorted by date →
  First event where status !== 'completed' →
    That's "You Are Here"
```

To keep it accurate, ensure your EHR integration updates event statuses:
- Lab ordered → `upcoming` → results received → `completed`
- Referral placed → `upcoming` → past due date without visit → `overdue`
- Visit scheduled → `upcoming` → visit completed → `completed`

## Disclaimer

This is a **proof-of-concept** for demonstration purposes only. It is **not** intended for actual clinical use or medical advice.
