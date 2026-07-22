# Implementation Plan: Care Team Tab Display

**Branch**: `feature/002-care-team-tab` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-Care-Team-Tab/spec.md`

## Summary

Add a "Care Team" tab inside the existing **My Care** page (alongside the existing "Care Journey" tab), showing the patient's primary doctor and any other assigned care team members. The tab reuses the exact same data and the exact same shared rendering function as the Home Page care team section, so both surfaces are always pixel-identical (name + role only). This feature improves discoverability of care provider information without modifying the existing Home Page display, without adding a new sidebar link, and without breaking any existing portal functionality (login, patient switching, other pages).

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js (Express backend)

**Primary Dependencies**: Express 4.21.0, Vanilla JavaScript (frontend), CORS 2.8.5

**Storage**: Patient care team data loaded from JSON file (`public/patients.json`) - no new persistence layer required

**Testing**: Jest 30.4.2 with ts-jest integration, existing test patterns for backend routes and frontend components

**Target Platform**: Web application (desktop/tablet compatible), MyCare portal accessible via browser

**Project Type**: Full-stack web application with vanilla JavaScript frontend and Node.js/Express backend

**Performance Goals**: Care Team tab data loads in < 2 seconds (p95), matching existing Home Page performance standards

**Constraints**: Must comply with existing HIPAA/healthcare security controls, patient data isolation (patients see only own care team), no breaking changes to Home Page

**Scale/Scope**: Single patient portal with sample patient data (5-10 patients for testing), care teams of 2-5 members per patient

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Healthcare Safety & Data Protection First**: Feature respects existing patient access controls and data isolation. Care team information is clinical metadata and requires same security as Home Page display.

✅ **Type Safety & Immutability**: Care team data uses readonly fields in TypeScript types. No mutations to patient data structures.

✅ **Data-Driven JSON Responses**: Backend API responses follow strict JSON schema. Frontend renders structured data without mixing HTML/text.

✅ **Observable Error Handling**: Feature will include error states when care team data unavailable or service fails.

✅ **API Response Time**: Non-AI endpoints must return ≤ 100ms (p95), ≤ 200ms (p99). Care Team tab reuses existing patient API.

✅ **No New Security Requirements**: Uses existing authentication and authorization mechanisms already in place.

**Gate Status**: ✅ PASS - Feature aligns with all constitutional principles. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-Care-Team-Tab/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Technical research and decisions (Phase 0)
├── data-model.md        # Data entities and contracts (Phase 1)
├── quickstart.md        # Validation scenarios (Phase 1)
├── contracts/           # API and data contracts (Phase 1)
├── checklists/
│   └── requirements.md   # Specification quality checklist
└── tasks.md             # Implementation tasks (Phase 2 output)
```

### Source Code (repository root)

```text
public/
├── index.html           # Main portal page (will add Care Team tab)
├── app.js               # Frontend application logic
├── patients.json        # Sample patient data (existing)
└── style.css            # Portal styling

src/
├── server.ts            # Express server setup
├── types/
│   └── care-journey.ts  # TypeScript type definitions (includes CareTeamMember)
├── services/
│   ├── message-service.ts
│   └── [existing services]
├── routes/
│   └── care-journey.ts  # API endpoints
└── data/
    └── sample-patients.ts  # Patient data loader

tests/
├── integration/         # Integration tests for new endpoints
└── unit/               # Unit tests for new functions
```

**Structure Decision**: Single full-stack project with no new services or repositories needed. Backend API (`src/routes/care-journey.ts`) already provides patient data endpoint. Frontend (`public/app.js`) will be enhanced with Care Team tab rendering. Patient data already includes `careTeam` field, so no schema changes required.

## Complexity Tracking

> No constitutional violations. No complexity justification needed.

---

## Phase 0: Research & Technical Decisions

**Research Questions Resolved**:

1. **Care Team Data Structure**: Confirmed in `src/data/sample-patients.ts` - `careTeam` is array of objects with `{name, role, phone}` properties already loaded from `patients.json`. Only `name` and `role` are ever rendered in the UI today; `phone` is present in the data but not displayed.

2. **Primary Doctor Identification**: There is no `isPrimary` boolean field. The primary doctor is identified purely by the `role` string (e.g., "Primary Care Physician"). The Care Team tab does not need to special-case this — it simply renders every member in `careTeam`, in the order provided, and the primary doctor naturally appears among them.

3. **Home Page Implementation**: Located at `public/app.js` in `renderHomePage()`. Uses horizontal card layout with profile icons, names, and roles, targeting the `#care-team-list` element. Extracted into a reusable `renderCareTeamList(careTeam)` function so Home Page and the new Care Team tab call the exact same code (single source of truth) — eliminating any risk of visual drift between the two.

4. **My Care Page Tab Structure**: `public/index.html` (`#page-mycare`) already has two static tab buttons ("Care Journey" / "Care Team") from the original template. These were wired up with `onclick="showMyCareCareTab(...)"` handlers rather than adding a new sidebar link, per corrected requirements — Care Team is a tab within My Care, not a standalone page.

5. **Backend API**: Express route at `/api/patients/{id}` returns full patient object including careTeam. No new endpoint needed.

6. **Security & Access**: Existing authentication via `currentPatient` global variable. Authorization already enforced at route level.

**Decisions Made**:

- **Rendering**: Single shared `renderCareTeamList(careTeam)` function used by both Home Page (`#care-team-list`) and My Care > Care Team tab (`#care-team-members`) — guarantees exact parity, including for the primary doctor and all other members
- **Navigation**: Care Team is a **tab inside My Care** (toggled via `showMyCareCareTab('team')`), NOT a new sidebar link — this avoids adding new navigation surface area and keeps the change minimal and low-risk
- **Fields Displayed**: Only `name` and `role` — matches Home Page exactly; phone number is intentionally NOT shown, since Home Page doesn't show it either
- **Data Fetching**: Reuse existing `/api/patients/{id}` endpoint - no new backend endpoints required
- **Empty State**: Display "No Care Team Information Available" message when `careTeam` is empty or undefined
- **Performance**: Data already loaded with patient object, no additional API call needed
- **Regression Safety**: All changes are additive (new tab content + one shared function); no existing IDs, routes, or functions were removed, preserving login, patient-switching, and all other pages

---

## Phase 1: Design & Contracts

### Data Model

**Existing Entities** (no changes required):

```typescript
// From src/types/care-journey.ts
export interface Patient {
  readonly id: string;
  readonly name: string;
  readonly careTeam?: Array<{
    readonly name: string;
    readonly role: string;
    readonly phone: string;
  }>;
  // ... other fields
}
```

**No new entities needed** - Care Team information already modeled in existing Patient type.

### API Contracts

**Frontend data source**: The frontend loads patient/care-team data via `GET /patients.json`
(static file, fetched directly at login in `public/app.js`) and finds the current patient by ID
client-side. This is the source `currentPatient.careTeam` uses for both the Home Page and the
Care Team tab.

**Backend gap found & fixed**: `GET /api/patients/:id` (used for AI analysis, messages, etc.)
previously mapped JSON → the backend `Patient` TypeScript type in `src/data/sample-patients.ts`
without including `careTeam` — it was present in the raw `JsonPatient` interface but silently
dropped when building the returned `Patient` object, and the `Patient` interface in
`src/types/care-journey.ts` didn't declare `careTeam` at all. **This has been fixed**:
- Added `CareTeamMember` interface and `careTeam?: readonly CareTeamMember[]` to `Patient` in
  `src/types/care-journey.ts`
- Added the missing `careTeam` mapping in `loadPatientsFromJson()` in `src/data/sample-patients.ts`
- `GET /api/patients/:id` now correctly returns `careTeam` — verified via `curl` and 3 new
  integration tests in `src/routes/__tests__/care-journey.test.ts`

**No new endpoints required** for this feature — the fix was to the existing endpoint's data
mapping only.

### UI/Frontend Contracts

**Care Team Tab Location**: The Care Team tab lives **inside the existing "My Care" page**, as a second tab alongside the existing "Care Journey" tab — it is NOT a new top-level sidebar link.

**Care Team Tab HTML Structure** (within `#page-mycare`):
```html
<div class="flex gap-4 border-b border-gray-200 mb-6">
  <button onclick="showMyCareCareTab('journey')" class="... text-brand-blue border-b-2 border-brand-blue">Care Journey</button>
  <button onclick="showMyCareCareTab('team')" class="... text-gray-500 hover:text-gray-700">Care Team</button>
</div>

<!-- existing Care Journey timeline content -->

<div id="care-team-section" class="hidden lg:col-span-2">
  <div class="card p-5">
    <h3 class="font-semibold text-gray-800 mb-6">Care Team</h3>
    <div id="care-team-members" class="flex flex-wrap gap-8"></div>
  </div>
</div>
```

**Shared Rendering Function**: `renderCareTeamList(careTeam)` is the **single source of truth** used by BOTH the Home Page (`#care-team-list`) and the My Care > Care Team tab (`#care-team-members`). It renders **only `name` and `role`** for each member (no phone number), exactly matching what the Home Page currently shows. The patient's primary doctor is simply the member whose `role` contains a primary-care designation (e.g., "Primary Care Physician") — rendered in the same list as all other members, in data order.

**Tab Switching**: `showMyCareCareTab('journey' | 'team')` toggles visibility between the Care Journey timeline/AI-insights panel and the Care Team section, and updates the active tab's styling. It does not affect any other page or global state.

### Quickstart Validation Scenarios

See `quickstart.md` for detailed runnable validation scenarios including:
- Patient with care team views tab and sees all members
- Patient without care team sees empty state message
- Home Page care team section still displays after changes
- Care team information matches between Home Page and Care Team tab
- Page loads within performance target (< 2 seconds)
