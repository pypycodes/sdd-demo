# Tasks: Care Team Tab Display

> **📝 Amendment (2026-07-09)**: Initial implementation incorrectly added Care Team as a new **sidebar link** / standalone page, which also broke portal login. This was reverted and corrected: Care Team is now a **tab inside the existing "My Care" page** (alongside "Care Journey"), rendering **only `name` and `role`** for each member via a function shared with the Home Page, so both surfaces are always pixel-identical — including the patient's primary doctor (identified via `role`) and every other assigned provider. See `IMPLEMENTATION_REPORT.md` and `CORRECTED_IMPLEMENTATION_FINAL.md` in this folder for full history. All Phase 1-3 tasks below have been updated to reflect the corrected architecture and marked `[x]` where implemented and verified (86/86 tests passing).

**Input**: Design documents from `specs/002-Care-Team-Tab/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: BDD acceptance tests included in spec.md. Unit and integration tests are included below to meet 85%+ coverage requirement per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `- [ ] [TaskID] [P?] [Story] Description with file path`

**Checklist Format**:
- **Checkbox**: `- [ ]` (markdown)
- **Task ID**: T001, T002, T003... (sequential)
- **[P] marker**: Parallelizable tasks (different files, no internal dependencies)
- **[Story] label**: [US1], [US2], [US3], [US4] (maps to user stories)
- **Description**: Clear action with exact file path

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create feature branch `feature/002-care-team-tab` from main
- [ ] T002 Verify project structure and dependencies are installed (`npm install`)
- [ ] T003 Review existing Home Page care team rendering in `public/app.js` (lines 266-278)
- [ ] T004 Verify patient data structure in `public/patients.json` includes `careTeam` field
- [ ] T005 Compile TypeScript without errors: `npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

> **⚠️ CORRECTED ARCHITECTURE**: Care Team is a **tab inside the existing "My Care" page** (alongside "Care Journey"), NOT a new sidebar link and NOT a standalone page. `public/index.html`'s `#page-mycare` already ships with two static tab buttons ("Care Journey" / "Care Team") — these are wired up, not created from scratch. Only `name` and `role` are rendered (no phone number), to be a pixel-perfect match of the Home Page.

### Shared Infrastructure Tasks

- [x] T006 Extract care team rendering function shared by Home Page and Care Team tab in `public/app.js`
  - Create reusable `renderCareTeamList(careTeamArray)` function
  - Renders **only `name` and `role`** per member (matches Home Page exactly — no phone number)
  - Handles both populated and empty arrays (empty/undefined → empty-state HTML)
  - Home Page's `renderHomePage()` calls this same function for `#care-team-list` (single source of truth — no duplicate markup)

- [x] T007 [P] Wire up the existing "Care Team" tab button inside My Care in `public/index.html`
  - The static `<button>Care Team</button>` inside `#page-mycare` gets `onclick="showMyCareCareTab('team')"`
  - The existing `<button>Care Journey</button>` gets `onclick="showMyCareCareTab('journey')"`
  - Do NOT add any new sidebar `<a>` link — Care Team must not appear as a top-level nav item

- [x] T008 [P] Add Care Team content container inside My Care in `public/index.html`
  - Add `<div id="care-team-section" class="hidden lg:col-span-2">` next to the existing Care Journey timeline column
  - Include `<div id="care-team-members" class="flex flex-wrap gap-8"></div>` for dynamic content
  - Care Journey content and Care Team content live side-by-side in the DOM; `showMyCareCareTab` toggles which is visible

- [x] T009 Add tab-switching function in `public/app.js`
  - `showMyCareCareTab(tab)` toggles the `hidden` class between the Care Journey timeline/AI panel and `#care-team-section`
  - Updates active/inactive Tailwind classes on both tab buttons
  - Does not call `showPage()` — stays entirely within the My Care page

- [x] T010 Populate Care Team data when My Care page renders in `public/app.js`
  - Wrap/extend `renderMyCarePage()` so it also populates `#care-team-members` via `renderCareTeamList(currentPatient.careTeam)`
  - Runs every time My Care is opened, so data is always fresh for the current patient
  - Displays empty state automatically (empty state handled inside `renderCareTeamList`)

- [x] T011 Empty state message is built into `renderCareTeamList()` in `public/app.js`
  - Returns user-friendly HTML: "No Care Team Information Available"
  - Includes icon consistent with app design (matches appointments empty-state pattern)
  - Shared by Home Page and Care Team tab — no separate empty-state function needed

- [x] T012 Add unit tests for `renderCareTeamList()` in `specs/002-Care-Team-Tab/tests/care-team.test.ts`
  - Test: renders care team members with correct HTML structure (name + role only, no phone)
  - Test: renders empty state when array is empty
  - Test: renders empty state when array is undefined
  - Test: primary doctor (role contains "Primary Care Physician") renders alongside other members
  - Test: handles special characters in names

---

## Phase 3: User Story 1 - Patient Views Care Team on Care Team Tab (Priority: P1) 🎯 MVP

**Story Goal**: A patient can navigate to "My Care" → "Care Team" tab and see their primary doctor plus every other assigned care team member, displayed exactly as on the Home Page.

**Independent Test Criteria**:
- ✅ "Care Team" tab appears inside the My Care page (next to "Care Journey"), not in the sidebar
- ✅ Clicking the Care Team tab displays the patient's primary doctor and all other care team members
- ✅ Each member shows only name and role (no phone number) — exact match with Home Page
- ✅ Display matches Home Page care team layout exactly (same shared function, same markup)
- ✅ Page loads in < 2 seconds
- ✅ No console errors
- ✅ Works for patients with 1-5 care team members, including those with only a primary doctor

### Implementation for User Story 1

- [x] T013 [US1] Wire `renderCareTeamList()` into the Care Team tab in `public/app.js`
  - `renderMyCarePage()` calls `renderCareTeamList(currentPatient.careTeam)` and sets `#care-team-members` innerHTML
  - Uses the exact same function/output as the Home Page's `#care-team-list`

- [x] T014 [US1] Reuse existing Tailwind utility classes for Care Team tab content (no new CSS needed)
  - `#care-team-section` and `#care-team-members` reuse `card`, `flex flex-wrap gap-8`, and the same member-card classes as Home Page
  - Verified responsive layout on desktop and tablet widths

- [x] T015 [P] [US1] Add integration test for Care Team tab navigation in `specs/002-Care-Team-Tab/tests/api-integration.test.ts`
  - Test: GET /api/patients/P001 returns careTeam field
  - Test: careTeam array contains expected member objects (including a "Primary Care Physician" role)
  - Test: careTeam data matches sample in public/patients.json

- [x] T016 [P] [US1] Add rendering-logic test for Care Team tab in `specs/002-Care-Team-Tab/tests/care-team-ui.test.ts`
  - Test: primary doctor identified via `role` containing "Primary Care" (no separate flag)
  - Test: `renderCareTeamList` output contains primary doctor AND all other members
  - Test: output never contains phone number (exact Home Page parity)
  - Test: patients with only a primary doctor (no additional members) render correctly
  - Test: no member is omitted or duplicated (card count === careTeam.length)

- [x] T017 [US1] Verify Home Page care team section still renders correctly (regression test)
  - Confirmed `renderHomePage()` calls the same shared `renderCareTeamList()` function
  - Verified Home Page displays identical data/markup as before
  - No changes to Home Page styling, layout, or the `#care-team-list` element

- [x] T018 [US1] Manual testing: Patient with care team views Care Team tab
  - Login as David Kumar (P001)
  - Navigate to "My Care" → click "Care Team" tab
  - Verified primary doctor "Dr. Sarah Mitchell (Primary Care Physician)" displays
  - Verified additional member "Linda Torres (Certified Diabetes Educator)" also displays
  - Verified no phone numbers are shown (matches Home Page exactly)
  - Verified page loads < 2 seconds and login/patient-switch continue to work afterward (81→86 automated tests passing)

---

## Phase 4: User Story 2 - Patient Sees Empty State When No Care Team (Priority: P1)

**Story Goal**: A patient with no assigned care team members sees a clear, friendly message on the Care Team tab instead of a blank page.

**Independent Test Criteria**:
- ✅ Empty state message displays clearly
- ✅ Message text is user-friendly: "No care team information available"
- ✅ Icon/visual indicator present
- ✅ Page layout is intact (navigation still works)
- ✅ No errors or warnings in console
- ✅ Can switch to other tabs from Care Team tab

### Implementation for User Story 2

- [ ] T019 [US2] Update `renderCareTeamPage()` to handle undefined careTeam in `public/app.js`
  - Check if `!currentPatient.careTeam || currentPatient.careTeam.length === 0`
  - Call empty state function if true
  - Otherwise call `renderCareTeamList()`

- [ ] T020 [US2] Implement empty state rendering in `public/app.js`
  - Create `renderCareTeamEmptyState()` function
  - Returns HTML with message, icon, and styling
  - Matches visual style of other empty states (appointments, etc.)

- [ ] T021 [P] [US2] Add unit test for empty state in `public/app.js` tests
  - Test: Empty careTeam array renders empty state
  - Test: Undefined careTeam renders empty state
  - Test: Empty state message is visible
  - Test: Empty state contains appropriate icon

- [ ] T022 [P] [US2] Add integration test for empty state scenario in `tests/integration/care-team-tab.test.js`
  - Test: Patient with no careTeam sees empty state
  - Test: Care team list is empty/hidden
  - Test: Empty state message element is visible

- [ ] T023 [US2] Manual testing: Patient without care team views Care Team tab
  - Create test patient with empty careTeam array in public/patients.json
  - Login as test patient
  - Click Care Team tab
  - Verify "No care team information available" message displays
  - Verify message is clear and helpful
  - Verify can switch tabs normally

---

## Phase 5: User Story 3 - Home Page Care Team Section Remains Unchanged (Priority: P1)

**Story Goal**: Ensure backward compatibility - the existing care team display on Home Page continues to function exactly as before, with no visual or functional regressions.

**Independent Test Criteria**:
- ✅ Home Page care team section displays with same styling
- ✅ All care team members visible on Home Page
- ✅ No broken CSS or layout issues
- ✅ Data updates correctly when switching patients
- ✅ All interactions work as before
- ✅ No performance degradation on Home Page

### Implementation for User Story 3

- [ ] T024 [US3] Refactor Home Page rendering to use extracted `renderCareTeamList()` in `public/app.js`
  - Update `renderHomePage()` to call `renderCareTeamList(currentPatient.careTeam)`
  - Ensure returned HTML is inserted into correct DOM element
  - Maintain exact visual appearance (no CSS changes needed)

- [ ] T025 [US3] Verify Home Page styling is unchanged in `public/style.css`
  - Check `.care-team-section` and related classes remain identical
  - No modifications to spacing, colors, fonts
  - Review responsive styles still work

- [ ] T026 [P] [US3] Add regression tests for Home Page care team in `src/routes/__tests__/care-journey.test.ts`
  - Test: GET /api/patients/:id still returns careTeam
  - Test: careTeam data structure unchanged
  - Test: All patient fields still present

- [ ] T027 [P] [US3] Add DOM regression test for Home Page in `tests/integration/home-page.test.js` (new file)
  - Test: renderHomePage() displays care team section
  - Test: Care team members rendered with correct structure
  - Test: No console errors when rendering Home Page
  - Test: CSS classes are applied correctly

- [ ] T028 [US3] Manual testing: Home Page care team section works identically to before
  - Login as David Kumar (P001)
  - View Home Page (default tab)
  - Verify care team section displays
  - Verify 2 members visible
  - Verify styling identical to previous implementation
  - Switch to different patient
  - Verify Home Page updates correctly
  - Switch back to David Kumar
  - Verify original care team reappears

---

## Phase 6: User Story 4 - Authorized Users Access Care Team Tab (Priority: P1)

**Story Goal**: Only authorized patients can view the Care Team tab and access their own care team information, with existing security controls enforced.

**Independent Test Criteria**:
- ✅ Only logged-in patients see Care Team tab
- ✅ Patient data is isolated (cannot see other patients' care team)
- ✅ Care team data updates correctly when switching patients
- ✅ Existing authentication/authorization mechanisms enforced
- ✅ No data leakage via console, localStorage, or DOM

### Implementation for User Story 4

- [ ] T029 [US4] Verify security controls on `/api/patients/:id` endpoint in `src/routes/care-journey.ts`
  - Check authentication is enforced (patient must be logged in)
  - Check authorization (patient can only request their own data)
  - Existing security should be sufficient - no new code needed

- [ ] T030 [US4] Verify `currentPatient` global variable is set correctly in `public/app.js`
  - Only set after successful login via `handleLogin()`
  - Only set to authenticated user's patient object
  - Cleared on logout via `handleLogout()`

- [ ] T031 [US4] Verify `renderCareTeamPage()` uses `currentPatient` safely in `public/app.js`
  - Always uses `currentPatient` (set after authentication)
  - No hardcoded patient data
  - Displays only current patient's care team

- [ ] T032 [P] [US4] Add security test for data isolation in `tests/integration/security.test.js` (new file)
  - Test: Patient 1 cannot access Patient 2's data via API
  - Test: Patient 1 logged in cannot see Patient 2's careTeam in UI
  - Test: Switching patients updates displayed care team correctly
  - Test: No cross-patient data leakage in DOM

- [ ] T033 [P] [US4] Add unit test for patient data isolation in `public/app.js` tests
  - Test: renderCareTeamPage() uses currentPatient
  - Test: No hardcoded patient IDs in rendering code
  - Test: Care team data comes from currentPatient.careTeam only

- [ ] T034 [US4] Manual testing: Security and data isolation
  - Login as Patient 1 (P001)
  - View Care Team tab
  - Note care team members
  - Switch to Patient 2
  - Verify different care team displays
  - Verify Patient 1's members NOT visible
  - Switch back to Patient 1
  - Verify original care team returns
  - Test browser console (no patient data exposed)

---

## Phase 7: Performance & Optimization

- [ ] T035 [P] Performance test: Care Team tab load time < 2 seconds in `tests/integration/performance.test.js` (new file)
  - Measure time from tab click to page fully rendered
  - Verify no new network requests (data already loaded)
  - Check JavaScript execution time
  - Verify rendering time < 100ms

- [ ] T036 [P] Performance test: Compare Home Page vs Care Team tab load times
  - Both should be < 100ms (synchronous DOM operations)
  - Both should use same data (no extra API calls)
  - Memory usage should be similar

- [ ] T037 Manual performance testing
  - Open DevTools Network tab
  - Click Care Team tab
  - Verify no new HTTP requests
  - Verify page interactive < 2 seconds
  - Check console for errors or warnings

---

## Phase 8: Test Coverage & Documentation

- [ ] T038 Run full test suite to verify 85%+ coverage: `npm test`
  - Minimum coverage: 85% lines, branches, functions, statements
  - Note any coverage gaps
  - Add additional tests if needed

- [ ] T039 [P] Generate test coverage report: `npm run test:coverage`
  - Review coverage report
  - Target: ≥ 85% for all metrics
  - Flag any coverage below 80%

- [ ] T040 [P] Add JSDoc comments to new functions in `public/app.js`
  - Document `renderCareTeamList(careTeamArray)`: purpose, parameters, return value
  - Document `renderCareTeamEmptyState()`: purpose and return value
  - Document `renderCareTeamPage()`: purpose and dependencies
  - Include examples in comments

- [ ] T041 [P] Update project README.md if needed
  - Note new Care Team tab feature
  - Add screenshot or description
  - Update feature list if present

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T042 Run lint checks: `npm run lint`
  - Fix any style issues
  - Ensure code follows project style guide
  - Run prettier if available: `npm run lint:fix`

- [ ] T043 Type-check TypeScript: `npm run type-check`
  - Ensure no TypeScript compilation warnings
  - All types properly defined
  - No implicit `any` types

- [ ] T044 [P] Accessibility review for Care Team tab
  - Ensure tab button is keyboard accessible
  - Verify care team member cards are readable
  - Check color contrast meets WCAG standards
  - Test with screen reader if possible

- [ ] T045 [P] Manual cross-browser testing (if applicable)
  - Test in Chrome, Firefox, Safari, Edge
  - Verify responsive design on tablet and desktop
  - Check for any rendering issues

- [ ] T046 Create or update BDD feature file in `.features/` or `tests/` if not already present
  - Document acceptance scenarios from spec.md
  - Include all 5 BDD scenarios from spec
  - Format for automated testing (Cucumber, Jest, etc.)

- [ ] T047 Final code review
  - Review all new/modified files
  - Check for code quality
  - Verify no debugging code left in place
  - Confirm all tasks completed

- [ ] T048 Create pull request and request review
  - Title: "Feature: Display Care Team Information on Care Team Tab"
  - Description: Link to spec.md and plan.md
  - List of changes and testing performed
  - Request review from team lead

---

## Dependencies & Execution Order

```
Phase 1: Setup (Prerequisite for all)
  ↓
Phase 2: Foundational (Blocking prerequisite for all user stories)
  ↓
Phase 3, 4, 5, 6: User Stories (CAN RUN INDEPENDENTLY IN PARALLEL after Phase 2)
  │
  ├─→ US1 (MVP Core Feature)
  ├─→ US2 (Empty State - Independent)
  ├─→ US3 (Home Page Regression - Independent)
  └─→ US4 (Security - Independent)
  ↓
Phase 7, 8, 9: Testing & Polish (After all user stories complete)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (US1 MVP) → Phase 7-9

**Parallel Opportunities**:
- T007, T008 (HTML structure) can run in parallel
- T012 can start while T010 is being coded
- US2, US3, US4 can run in parallel after Phase 2 complete
- T025, T026, T027 (US3) can run while US1 is being completed
- T044, T045, T046 can run in parallel while other testing continues

---

## Parallel Example: User Story 1 (MVP)

**Team of 2 developers working on US1 in parallel**:

**Developer A**:
- T013: Integrate renderCareTeamList() into Care Team tab
- T014: Style Care Team tab content
- T018: Manual testing

**Developer B** (simultaneously):
- T015: Backend integration test
- T016: Frontend/DOM integration test
- T017: Regression test on Home Page

**Merge Point**: Both complete, then proceed to US2, US3, US4 or Phase 7 (Testing & Polish)

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
**Estimated effort**: 3-4 hours for single developer

Complete these to have working MVP:
1. Phase 1: Setup (1 hour)
2. Phase 2: Foundational (1 hour)
3. Phase 3: User Story 1 (1-2 hours including T013-T018)

**Result**: Patients can view their care team on a dedicated tab (core feature working)

### Phase 2: Add Robustness (1-2 hours)
Add US2, US3, US4:
- Phase 4: Empty state handling (30 min)
- Phase 5: Home Page regression (30 min)
- Phase 6: Security verification (30 min)

### Phase 3: Polish (1-2 hours)
- Phase 7: Performance testing
- Phase 8: Coverage & docs
- Phase 9: Cross-browser, accessibility, PR

### Incremental Delivery Timeline
- **Day 1 - Morning**: Phases 1-2 + MVP (US1) = 2.5 hours
- **Day 1 - Afternoon**: US2, US3, US4 = 2 hours
- **Day 2 - Morning**: Testing, coverage, documentation = 2 hours
- **Day 2 - Afternoon**: Accessibility, cross-browser, PR review = 1.5 hours

**Total estimated effort**: 7-8 hours for one developer (or 3-4 hours with parallel team)

### Team Scaling
- **Solo developer**: Follow sequential order, ~8 hours total
- **2 developers**: Split US1-4 work, reduce to ~4-5 hours
- **3+ developers**: Phase 1-2 in parallel, US1-4 in parallel, ~2-3 hours

---

## Notes

### Testing Philosophy
- **Unit tests**: Focus on rendering functions, data handling, edge cases
- **Integration tests**: Verify API responses, patient data flow, tab switching
- **Manual tests**: User workflows, performance, cross-browser compatibility
- **BDD scenarios**: Document acceptance criteria from spec.md

### Code Quality Standards (from Constitution)
- ✅ Type safety: All TypeScript types use readonly modifiers
- ✅ Test coverage: Maintain 85%+ line/branch/function/statement coverage
- ✅ Security: Enforce patient data isolation, no mutations
- ✅ Performance: API responses ≤100ms (p95), ≤200ms (p99)
- ✅ Accessibility: WCAG AA compliance
- ✅ Healthcare Safety: No medical advice, proper disclaimers if needed

### File Organization
- **Frontend**: All changes in `public/` (app.js, index.html, style.css)
- **Backend**: Changes in `src/` if needed (none for this feature, data already available)
- **Tests**: New test files follow pattern: `src/__tests__/`, `tests/integration/`, `tests/unit/`

### Debugging Tips
- **DevTools**: Monitor Network tab for unintended API calls (should be zero new calls)
- **Console**: Check for JavaScript errors, type warnings
- **Performance tab**: Verify DOM rendering takes <100ms
- **Accessibility**: Use Chrome DevTools accessibility panel

---

## Task Checklist Summary

**Total Tasks**: 48
**Setup Phase**: 5 tasks
**Foundational Phase**: 7 tasks
**User Story 1 (US1)**: 6 tasks
**User Story 2 (US2)**: 5 tasks
**User Story 3 (US3)**: 5 tasks
**User Story 4 (US4)**: 6 tasks
**Performance**: 3 tasks
**Testing & Coverage**: 4 tasks
**Polish & QA**: 6 tasks

**Parallelizable Tasks**: 17 ([P] marked)
**Sequential Tasks**: 31

---

## Success Criteria Checklist

- [ ] All 48 tasks completed
- [ ] All unit tests pass (`npm test`)
- [ ] Coverage ≥ 85% (`npm run test:coverage`)
- [ ] No lint errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Care Team tab visible and functional
- [ ] Patient can view own care team members
- [ ] Empty state displays when appropriate
- [ ] Home Page unchanged (regression test passes)
- [ ] Patient data isolation verified
- [ ] Performance < 2 seconds measured
- [ ] BDD scenarios documented
- [ ] Manual testing complete
- [ ] Code reviewed and approved
- [ ] PR merged to main branch
