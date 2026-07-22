# Data Model: Care Team Tab Display

**Date**: 2026-07-09  
**Feature**: Display Care Team Information on MyCare > Care Team Tab  
**Status**: Phase 1 Design

---

## Overview

This document defines the data entities, structures, and relationships required for the Care Team Tab feature. The feature reuses existing data models without requiring new entities or schema changes.

---

## Data Entities

### Entity 1: Patient (Existing - No Changes)

**Purpose**: Represents a patient user of the MyCare portal with their demographic and clinical information.

**Type Definition**:
```typescript
interface Patient {
  readonly id: string;                           // Unique patient identifier (e.g., "P001")
  readonly name: string;                         // Patient full name
  readonly age: number;                          // Patient age
  readonly gender: string;                       // Patient gender
  readonly primaryDiagnosis: string;             // Primary diagnosis
  readonly conditions: readonly string[];        // List of patient conditions
  readonly careTeam?: readonly CareTeamMember[]; // **NEW**: Care team members (optional)
  readonly careEvents: readonly CareEvent[];     // Timeline of care events
  readonly messages?: readonly Message[];        // Messages from providers
  readonly upcomingAppointments?: readonly UpcomingAppointment[]; // Scheduled appointments
  readonly billing?: BillingSummary;            // Billing summary
}
```

**Source**: `src/types/care-journey.ts` (existing)

**Notes**:
- `careTeam` field is optional to handle patients with no assigned care team
- Field already exists in current type definition
- No schema migration required

---

### Entity 2: CareTeamMember (Existing - No Changes)

**Purpose**: Represents a healthcare provider assigned to a patient's care journey.

**Type Definition**:
```typescript
interface CareTeamMember {
  readonly name: string;    // Provider full name
  readonly role: string;    // Professional role/title (e.g., "Primary Care Physician", "Diabetes Educator")
  readonly phone: string;   // Contact phone number
}
```

**Source**: Embedded in Patient type and `public/patients.json`

**Constraints**:
- `name`: Non-empty string, max 100 characters
- `role`: Non-empty string, max 150 characters (supports long titles like "Board Certified Endocrinologist")
- `phone`: Valid phone number format (currently stored as string, e.g., "(555) 612-4789")

**Relationships**:
- One-to-many: A Patient has one or more CareTeamMembers
- One-to-many: A CareTeamMember may be associated with multiple Patients (not enforced at data model level)

**Example Data**:
```json
{
  "name": "Dr. Sarah Mitchell",
  "role": "Primary Care Physician",
  "phone": "(555) 612-4789"
}
```

---

## Data Flow & Access Patterns

### Read Pattern: Patient Login/Switch

**Sequence**:
1. User logs in or switches patient
2. Frontend calls `GET /api/patients/{patientId}`
3. Backend loads patient from `public/patients.json` via `src/data/sample-patients.ts`
4. Server returns full Patient object including `careTeam` array
5. Frontend stores result in `currentPatient` global variable
6. Data available for rendering Home Page and Care Team tab

**Code Paths**:
- Backend: `src/routes/care-journey.ts` - `/api/patients/:id` endpoint
- Data Loading: `src/data/sample-patients.ts` - `loadPatientsFromJson()`
- Frontend: `public/app.js` - `handleLogin()`, `switchPatient()`

### Read Pattern: Care Team Tab Display

**Sequence**:
1. User clicks "Care Team" tab
2. Frontend calls `showPage('care-team')`
3. `renderCareTeamPage()` executes
4. Function accesses `currentPatient.careTeam` (already in memory)
5. Renders care team member cards to DOM
6. If empty, shows "No care team information available" message

**Performance**: ~<100ms synchronous DOM operation

---

## Data State Transitions

### Patient State Lifecycle

```
┌─────────────┐
│   Not Logged In     │
└────────┬────────────┘
         │ User logs in
         ↓
┌──────────────────────┐
│ Logged In (Patient 1)│ ← currentPatient = {id, name, careTeam[], ...}
└────┬─────────────────┘
     │ User switches patient
     ↓
┌──────────────────────┐
│ Logged In (Patient 2)│ ← currentPatient = {id, name, careTeam[], ...}
└──────────────────────┘
```

### Care Team Data States

```
Patient.careTeam States:
├── undefined              → No care team assigned
├── []                     → Empty array, same as undefined (but explicit)
└── [{...}, {...}, ...]   → List of CareTeamMembers
```

**UI Rendering Decision**:
```javascript
if (!currentPatient.careTeam || currentPatient.careTeam.length === 0) {
  // Render empty state
} else {
  // Render care team members
}
```

---

## JSON Schema (patients.json)

**File Location**: `public/patients.json`

**Structure**:
```json
{
  "patients": [
    {
      "id": "P001",
      "name": "David Kumar",
      "age": 52,
      "gender": "Male",
      "primaryDiagnosis": "Type 2 Diabetes Mellitus",
      "conditions": ["Type 2 Diabetes Mellitus"],
      "careTeam": [
        {
          "name": "Dr. Sarah Mitchell",
          "role": "Primary Care Physician",
          "phone": "(555) 612-4789"
        },
        {
          "name": "Linda Torres",
          "role": "Certified Diabetes Educator",
          "phone": "(555) 612-4790"
        }
      ],
      "careEvents": [...],
      "messages": [...],
      "upcomingAppointments": [...]
    }
  ]
}
```

**Validation Rules**:
- `patients`: Array of Patient objects
- Each patient MUST have `id`, `name`, `age`, `gender`, `primaryDiagnosis`, `conditions`, `careEvents`
- `careTeam`: Optional array. If present, each member MUST have `name`, `role`, `phone`
- All string fields should not be empty or null

---

## API Response Contract

### GET /api/patients/:id

**Request**:
```http
GET /api/patients/P001
Content-Type: application/json
```

**Response** (Success 200):
```typescript
{
  "success": true,
  "data": {
    "id": "P001",
    "name": "David Kumar",
    "age": 52,
    "gender": "Male",
    "primaryDiagnosis": "Type 2 Diabetes Mellitus",
    "conditions": ["Type 2 Diabetes Mellitus"],
    "careTeam": [
      {
        "name": "Dr. Sarah Mitchell",
        "role": "Primary Care Physician",
        "phone": "(555) 612-4789"
      },
      {
        "name": "Linda Torres",
        "role": "Certified Diabetes Educator",
        "phone": "(555) 612-4790"
      }
    ],
    "careEvents": [...],
    "messages": [...]
  }
}
```

**Response** (Not Found 404):
```json
{
  "success": false,
  "error": "Patient not found"
}
```

**Notes**:
- `careTeam` field is included if patient has care team members
- Field is omitted if patient has no care team (or included as empty array)
- No new endpoint required for this feature

---

## Immutability & Type Safety

### Readonly Enforcement

Per project constitution (Principle II), all data must use readonly modifiers:

```typescript
// ✅ Correct - readonly fields
interface CareTeamMember {
  readonly name: string;
  readonly role: string;
  readonly phone: string;
}

interface Patient {
  readonly careTeam?: readonly CareTeamMember[];
}

// ❌ Incorrect - mutable fields
interface CareTeamMember {
  name: string;      // Missing readonly
  role: string;      // Missing readonly
  phone: string;     // Missing readonly
}
```

### Compilation Safety

TypeScript will catch attempts to mutate readonly data:

```typescript
const patient = currentPatient;

// ❌ Compilation error - cannot mutate
patient.careTeam[0].name = "New Name";

// ❌ Compilation error - cannot reassign
patient.careTeam = [];

// ✅ OK - read access
const name = patient.careTeam[0].name;
```

---

## Data Validation Rules

### For CareTeamMember

| Field | Rule | Example |
|-------|------|---------|
| `name` | Non-empty, max 100 chars | "Dr. Sarah Mitchell" |
| `role` | Non-empty, max 150 chars | "Primary Care Physician" |
| `phone` | Non-empty, valid phone format | "(555) 612-4789" |

### For Patient.careTeam

| Rule | Enforcement |
|------|-------------|
| Array items are CareTeamMember objects | Type system (TypeScript) |
| No duplicate members | Application logic (optional, not required) |
| Array can be empty or undefined | Both are valid empty states |
| Maximum array size | No constraint (but ~5 members is typical) |

---

## Storage & Persistence

**Current Implementation**:
- Care team data is stored in `public/patients.json`
- Loaded into memory via `src/data/sample-patients.ts` at server startup
- No database connection required
- No real-time updates needed

**Data Immutability**:
- Data is read-only from JSON file
- No write operations to care team data
- No mutations allowed per type system

**Future Extensibility**:
If real-time updates are needed, this model supports:
- Webhook updates to refresh patient data
- WebSocket connections for live updates
- REST API polling (inefficient)

Current implementation is sufficient for requirements (static data display).

---

## Related Entities

### CareEvent (Related)

Care Team information is complementary to `CareEvent`. Both represent aspects of a patient's care journey:

```typescript
interface CareEvent {
  readonly provider: string;  // Name of provider who performed event
  // ... other fields
}

// CareTeamMember provides more detailed info about providers
interface CareTeamMember {
  readonly name: string;
  readonly role: string;
  readonly phone: string;
}
```

**Relationship**: CareEvent.provider name may refer to a CareTeamMember, but there's no formal database relationship (both are read from JSON).

### Message (Related)

Messages from providers also reference care team:

```typescript
interface Message {
  readonly providerId: string;
  readonly providerName: string;
  readonly providerSpecialty: string;
  // Message content...
}

// CareTeamMember provides full contact and role information
```

---

## Summary

**No new entities required** for this feature. The existing `Patient` and `CareTeamMember` types already model all required data. Implementation focuses on:

1. **Frontend UI**: Rendering careTeam array on Care Team tab
2. **Data Access**: Reusing existing `/api/patients/:id` endpoint
3. **Empty States**: Handling undefined or empty careTeam array gracefully
4. **Type Safety**: Enforcing readonly properties via TypeScript

All data structures are immutable and follow project constitution principles.
