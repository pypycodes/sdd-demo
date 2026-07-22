# Technical Research: Care Team Tab Display

**Date**: 2026-07-09  
**Feature**: Display Care Team Information on MyCare > Care Team Tab  
**Status**: Complete

---

## Research Summary

This document consolidates technical research decisions for the Care Team Tab feature. All clarification questions from the specification have been resolved through codebase analysis and architectural review.

---

## R-001: Care Team Data Structure & Storage

**Question**: How is care team data currently structured and accessed?

**Decision**: Use existing care team data structure already in place.

**Rationale**:
- Care team data is stored in `public/patients.json` as part of the Patient object
- Structure: `careTeam: Array<{name, role, phone}>`
- Already loaded into memory by `src/data/sample-patients.ts` via `loadPatientsFromJson()`
- No database or external API calls required for this feature

**Alternatives Considered**:
- Create new dedicated care team API endpoint - **Rejected**: Unnecessary, patient data already includes careTeam
- Use separate care team database - **Rejected**: Out of scope, feature requires data reuse from existing structure

**Implementation Impact**: Zero impact on backend. Frontend receives careTeam via existing patient API response.

---

## R-002: Frontend Architecture & Tab Navigation

**Question**: How are tabs currently implemented in the portal? How should Care Team tab integrate?

**Decision**: Add Care Team tab to existing vanilla JavaScript tab navigation system.

**Rationale**:
- Portal uses vanilla JavaScript (no framework like React/Vue)
- Existing tabs: "Home", "My Care", "Health", "Todo" - implemented in `public/app.js`
- Tab switching via `showPage(pageName)` function (line 233 in app.js)
- Each page has corresponding render function (e.g., `renderHomePage()`, `renderMyCarePage()`)

**Alternatives Considered**:
- Use third-party tab library - **Rejected**: Not consistent with existing architecture
- Add as modal/overlay - **Rejected**: Requirements ask for dedicated tab

**Implementation Impact**: 
- Add "Care Team" to tab navigation in `public/index.html`
- Create `renderCareTeamPage()` function in `public/app.js`
- Add tab click handler for "Care Team"

---

## R-003: Care Team Rendering on Home Page

**Question**: How is care team currently displayed on Home Page? Can logic be reused?

**Decision**: Extract care team rendering logic into reusable function.

**Rationale**:
- Home Page renders care team at lines 266-278 in `public/app.js`
- Uses horizontal card layout with profile icons, names, roles
- Current implementation can be duplicated for Care Team tab OR extracted to reusable function
- Extraction prevents duplication and simplifies future updates

**Alternatives Considered**:
- Duplicate code in Care Team tab - **Rejected**: Violates DRY principle, increases maintenance burden
- Link from Care Team tab to Home Page section - **Rejected**: Doesn't meet "dedicated Care Team tab" requirement

**Implementation Impact**:
- Create `renderCareTeamList(careTeam)` function that handles both Home Page and Care Team tab rendering
- Update `renderHomePage()` to call this function
- Call same function from new `renderCareTeamPage()`

---

## R-004: Empty State Handling

**Question**: What should display when patient has no care team members?

**Decision**: Display user-friendly "No care team information available" message.

**Rationale**:
- Specification AC4 requires appropriate message when no care team assigned
- Matches pattern used elsewhere in portal (e.g., "No Upcoming Appointments" - line 311 in app.js)
- Provides clear user guidance instead of blank page

**Alternatives Considered**:
- Show error state - **Rejected**: Not an error, valid state for some patients
- Hide Care Team tab entirely - **Rejected**: Reduces discoverability as per requirements

**Implementation Impact**:
- Check if `currentPatient.careTeam` exists and has length > 0
- Render empty state UI with helpful message and icon
- Follow existing empty state styling patterns from appointments section

---

## R-005: Security & Access Control

**Question**: How are existing security and access controls implemented? Must this feature respect them?

**Decision**: Reuse existing security mechanisms without modification.

**Rationale**:
- Authentication: Managed via `currentPatient` global variable set during login
- Authorization: Patient can only see their own data (enforced at route level in `src/routes/care-journey.ts`)
- Care team is part of patient record, already protected by existing security
- No sensitive data in care team (names, roles, phone - same as shown on Home Page)

**Alternatives Considered**:
- Add new authentication layer - **Rejected**: Unnecessary, existing system sufficient
- Create separate access control for care team - **Rejected**: Inconsistent with requirements

**Implementation Impact**: Zero impact. Feature uses existing security infrastructure.

---

## R-006: API & Data Flow

**Question**: Will new API endpoints be required? What's the data flow?

**Decision**: No new endpoints required. Reuse existing `/api/patients/:id` endpoint.

**Rationale**:
- `GET /api/patients/:id` in `src/routes/care-journey.ts` returns full Patient object
- Patient object includes `careTeam` field loaded from JSON
- Frontend already fetches patient data during login/patient switch
- careTeam data is already in memory, no additional API call needed

**Data Flow**:
```
User logs in
  ↓
GET /api/patients/:id (existing endpoint)
  ↓
Server loads patient from JSON (includes careTeam)
  ↓
Frontend stores currentPatient in global variable
  ↓
User clicks "Care Team" tab
  ↓
renderCareTeamPage() displays currentPatient.careTeam
```

**Alternatives Considered**:
- Create `/api/patients/:id/care-team` endpoint - **Rejected**: Adds complexity, data already available
- Fetch care team separately - **Rejected**: Performance penalty for already-loaded data

**Implementation Impact**: Zero backend changes needed.

---

## R-007: Performance & Load Time

**Question**: How should the Care Team tab meet the <2 second load performance target?

**Decision**: No additional network calls needed; rendering pure JavaScript on already-loaded data.

**Rationale**:
- Patient data already loaded in memory via `currentPatient` global
- Care Team tab rendering is synchronous DOM manipulation
- No API calls, database queries, or async operations
- Rendering ~5 care team members takes <100ms in vanilla JavaScript

**Performance Path**:
- User clicks Care Team tab
- `showPage('care-team')` called
- `renderCareTeamPage()` executes synchronously
- DOM updated in <100ms
- Page visible to user <100ms from click (well under 2s requirement)

**Alternatives Considered**:
- Implement lazy loading - **Rejected**: Unnecessary, already fast
- Add caching - **Rejected**: Data already cached in memory

**Implementation Impact**: No special performance handling needed. Feature will be fast by design.

---

## R-008: Test Strategy

**Question**: What testing approach should be used?

**Decision**: Extend existing Jest test patterns with unit and integration tests.

**Rationale**:
- Project uses Jest 30.4.2 with ts-jest for backend tests
- Existing patterns in `src/routes/__tests__/` and `src/services/__tests__/`
- Frontend testing limited by vanilla JS (no testing library), but can test render functions
- Integration tests can verify tab appears and displays correctly

**Test Coverage Areas**:
1. **Backend Route** (existing endpoint, verify careTeam is included):
   - GET /api/patients/:id returns careTeam array

2. **Frontend Functions** (new):
   - `renderCareTeamList(careTeam)` returns correct HTML
   - Empty state renders when careTeam is empty
   - Tab click handler calls showPage('care-team')

3. **Integration** (e.g., browser automation or manual):
   - User can navigate to Care Team tab
   - Care team information displays correctly
   - Home Page still works unchanged

**Alternatives Considered**:
- No new tests - **Rejected**: Violates constitution requirement for 85%+ coverage
- E2E testing only - **Rejected**: Need unit tests for core logic

**Implementation Impact**: Add test files matching existing patterns.

---

## R-009: HTML & CSS Changes

**Question**: What changes to public/index.html and CSS are required?

**Decision**: Minimal HTML changes, reuse existing CSS classes.

**Rationale**:
- Add Care Team tab button to navigation
- Add Care Team tab content container (hidden by default)
- Reuse existing CSS classes for card layout, spacing, typography
- Match styling of Home Page care team section for consistency

**Changes Needed**:
1. `public/index.html`: Add tab button and content div
2. `public/style.css`: No new classes needed if reusing existing patterns
3. `public/app.js`: Add tab handler and render function

**Alternatives Considered**:
- Create new custom CSS for Care Team tab - **Rejected**: Inconsistent with design
- Add separate stylesheet - **Rejected**: Unnecessary complexity

**Implementation Impact**: Minimal, <10 lines in HTML, 0 CSS changes if using existing classes.

---

## R-010: Browser & Device Compatibility

**Question**: What browsers and devices must be supported?

**Decision**: Support same targets as existing portal (modern browsers, desktop/tablet).

**Rationale**:
- Existing portal is web-based vanilla JavaScript
- No special features required (no WebGL, canvas, service workers)
- Vanilla JS, CSS Grid/Flexbox widely supported (>95% of users)
- Mobile support possible but not required per spec (mentions "MyCare portal", existing desktop-first design)

**Browser Support**:
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (modern evergreen browsers)
- IE11 not required (not in existing support matrix)

**Alternatives Considered**:
- Mobile-first redesign - **Rejected**: Out of scope, existing design is desktop-focused
- IE11 support - **Rejected**: Out of scope, not required for existing portal

**Implementation Impact**: No polyfills or special handling needed.

---

## R-011: Data Mutation & Type Safety

**Question**: How should TypeScript types be structured? Any mutations allowed?

**Decision**: Maintain readonly property structure per constitution.

**Rationale**:
- Project constitution (Principle II) requires readonly modifiers
- Existing Patient type has readonly fields
- careTeam array should be readonly to prevent accidental mutations

**Type Definition**:
```typescript
interface Patient {
  readonly careTeam?: readonly Array<{
    readonly name: string;
    readonly role: string;
    readonly phone: string;
  }>;
}
```

**Alternatives Considered**:
- Allow mutations for future features - **Rejected**: Violates constitution

**Implementation Impact**: Enforce readonly in TypeScript compilation and linting.

---

## R-012: JSON Data Format

**Question**: Is the JSON format in patients.json correct and complete?

**Decision**: Confirmed - careTeam field exists and is properly structured.

**Rationale**:
- Examined `public/patients.json` - careTeam field present in patient objects
- Structure matches expected interface: `{name, role, phone}`
- All sample patients have careTeam data
- Loading works correctly in `src/data/sample-patients.ts`

**Example Data**:
```json
{
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
  ]
}
```

**Alternatives Considered**:
- Restructure JSON - **Rejected**: Existing format is sufficient and consistent

**Implementation Impact**: Zero - use data as-is from existing JSON.

---

## Decisions Summary Table

| # | Question | Decision | Impact |
|---|----------|----------|--------|
| R-001 | Care team data structure | Reuse existing JSON structure | No backend changes |
| R-002 | Tab implementation | Add to existing vanilla JS tabs | Minimal frontend changes |
| R-003 | Code reuse | Extract render function | Prevent duplication |
| R-004 | Empty state | Show "No care team available" message | ~20 lines UI code |
| R-005 | Security | Reuse existing controls | Zero impact |
| R-006 | API endpoints | No new endpoints needed | Zero backend impact |
| R-007 | Performance | Already fast by design | No special handling |
| R-008 | Testing | Jest unit + integration tests | Add test files |
| R-009 | HTML/CSS | Minimal, reuse existing styles | <50 lines of markup |
| R-010 | Browser support | Modern browsers, desktop/tablet | No polyfills needed |
| R-011 | Type safety | Enforce readonly properties | TypeScript compilation |
| R-012 | JSON format | Confirmed correct | Use as-is |

---

## Conclusion

All technical clarifications have been resolved through codebase analysis. The feature can proceed to task generation with confidence. No new dependencies, infrastructure, or architectural changes required. Feature is a pure UI enhancement that reuses existing backend infrastructure and data structures.
