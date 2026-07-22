# Implementation Report: Care Team Tab Display

**Spec**: 002-Care-Team-Tab
**Status**: ✅ Implemented & Corrected
**Last Updated**: 2026-07-09

---

## Final Architecture (Corrected)

The Care Team feature is a **tab inside the existing "My Care" page**, next to the existing
"Care Journey" tab. It is **NOT** a sidebar link and **NOT** a standalone page.

```
Sidebar: Home | To Do | My Care | Messages | Health Summary   ← unchanged, no new link
                          │
                          ▼
              My Care page opens with two tabs:
              ┌─────────────────┬────────────┐
              │  Care Journey ● │  Care Team │
              └─────────────────┴────────────┘
                          │
              Click "Care Team" →
              Shows the patient's primary doctor + every other
              assigned provider, name + role only — identical to
              the Home Page care team section.
```

### Correction History

Two issues were found and fixed during implementation review:

1. **Wrong navigation surface**: An earlier iteration added Care Team as a brand-new
   sidebar link and, separately, as a standalone page. This did not match the requirement
   ("Care Team" is a tab within "My Care", same as it already listed "Care Journey").
   **Fixed**: reverted `public/index.html`/`public/app.js` to the last known-good state,
   then wired the two *existing* static tab buttons inside `#page-mycare` to a new
   `showMyCareCareTab('journey' | 'team')` toggle function.

2. **Field mismatch with Home Page**: The tab initially rendered a phone number that the
   Home Page does not display, breaking the "exact match" requirement.
   **Fixed**: `renderCareTeamList()` now renders only `name` and `role` — nothing else —
   and this single function is called by **both** the Home Page and the Care Team tab, so
   the two views can never drift apart again.

3. **Broken login (regression)**: A prior edit accidentally corrupted `public/index.html` /
   `public/app.js`, breaking the patient login screen.
   **Fixed**: `git checkout` restored both files to the last committed good state before
   re-applying the (corrected) Care Team changes on top.

4. **Backend API gap (pre-existing, found during review)**: `GET /api/patients/:id` never
   returned `careTeam` — the field existed in the raw JSON and in a local parsing interface, but
   was silently dropped when mapping to the backend `Patient` type, and `Patient` itself never
   declared a `careTeam` field. This didn't affect the UI (which loads data from
   `/patients.json` directly), but was a real inconsistency between the documented API contract
   and reality.
   **Fixed**: Added `CareTeamMember` + `careTeam?: readonly CareTeamMember[]` to `Patient` in
   `src/types/care-journey.ts`, and added the missing mapping in `loadPatientsFromJson()` in
   `src/data/sample-patients.ts`. Verified via `curl http://localhost:3000/api/patients/P001`
   and 3 new integration tests.

5. **Care Team tab showed "AI Insights" instead of care team members (critical, user-reported)**:
   When the earlier `git checkout` was used to restore `public/index.html`/`public/app.js` after
   the broken-login incident (#3 above), the `#care-team-section` / `#care-team-members` HTML
   elements that the JS relies on were **not re-added** — only the JS functions were restored.
   Clicking "Care Team" correctly hid the Care Journey timeline column, but since
   `document.getElementById('care-team-section')` returned `null`, nothing replaced it, leaving
   only the (untouched) AI Insights panel visible — which is exactly what the user saw and
   reported.
   **Fixed**:
   - Re-added `#care-team-section` (with `#care-team-members` inside) to `public/index.html`,
     next to the Care Journey column
   - Gave the Care Journey column (`#mycare-journey-content`) and the AI panel
     (`#mycare-ai-panel`) explicit IDs, and the two tab buttons explicit IDs
     (`#mycare-tab-journey` / `#mycare-tab-team`) — replacing the previous fragile
     `parentElement.parentElement` / `:nth-of-type` DOM traversal in `showMyCareCareTab()`
   - `showMyCareCareTab('team')` now explicitly hides **both** the Care Journey column **and**
     the AI Insights panel, and shows Care Team; `showMyCareCareTab('journey')` does the reverse
   - Added **6 regression-guard tests** in `care-team-ui.test.ts` that parse the real
     `index.html`/`app.js` files and fail loudly if any of these required elements/IDs are ever
     removed again

---

## What Was Implemented

### `public/index.html`
- The two pre-existing static buttons inside `#page-mycare` ("Care Journey" / "Care Team")
  were wired up with `onclick="showMyCareCareTab('journey')"` / `onclick="showMyCareCareTab('team')"`.
- A new `#care-team-section` container (hidden by default) with an inner `#care-team-members`
  div was added next to the existing Care Journey timeline column.
- **No new sidebar link was added.**

### `public/app.js`
- `renderCareTeamList(careTeam)` — shared rendering function. Renders one card per member
  with **name + role only** (no phone), or an empty-state message when `careTeam` is
  empty/undefined. Used by both `renderHomePage()` (`#care-team-list`) and the Care Team tab
  (`#care-team-members`).
- `showMyCareCareTab(tab)` — toggles visibility between the Care Journey timeline/AI-insights
  panel and `#care-team-section`, and updates the active/inactive tab button styling.
- `renderMyCarePage()` was extended (via wrapper) to populate `#care-team-members` every time
  the My Care page is rendered, using the current patient's data.
- `renderHomePage()`'s inline care-team markup was replaced with a call to the same shared
  `renderCareTeamList()`, removing duplicate HTML and guaranteeing parity going forward.

---

## Primary Doctor Handling

There is no `isPrimary` boolean in the data model. The **primary doctor is identified purely
by the `role` string** (e.g., `"Primary Care Physician"`). The Care Team tab does not filter
or reorder members — it renders the full `careTeam` array exactly as provided, so the primary
doctor and every other provider (specialists, educators, coordinators, etc.) all appear
together, in the same order as on the Home Page.

---

## Test Coverage

All Care Team feature tests live in `specs/002-Care-Team-Tab/tests/` (and are mirrored into
`src/services/__tests__/` for `npm test` to discover, per project test configuration):

| File | Tests | Focus |
|---|---|---|
| `care-team.test.ts` | 10 | Data integrity, empty team, immutability |
| `api-integration.test.ts` | 10 | API response shape, field validation |
| `care-team-ui.test.ts` | 21 | Rendering, empty state, primary doctor identification, no-phone parity, no omission/duplication, **DOM structure regression guard (6 tests)** |
| `care-journey-api.test.ts` (backend route) | +3 | `GET /api/patients/:id` now actually returns `careTeam`, includes primary doctor, all fields typed correctly |

**Full suite result**: `95/95 tests passing` (`npm test`)

---

## Verification Checklist

- [x] Care Team is a tab inside "My Care" (not a sidebar link, not a standalone page)
- [x] Primary doctor displays (identified via `role`, e.g. "Primary Care Physician")
- [x] All other care team members display alongside the primary doctor
- [x] Only `name` + `role` are shown — exact match with Home Page (no phone number)
- [x] Home Page and Care Team tab share the same rendering function (no drift possible)
- [x] Home Page care team section unchanged in behavior/styling
- [x] Empty state ("No Care Team Information Available") shown when no team assigned
- [x] Portal login, patient switching, and all other pages verified working (no regressions)
- [x] `GET /api/patients/:id` now correctly returns `careTeam` (backend gap fixed)
- [x] Care Team tab correctly shows care team members (not the AI Insights panel) — verified live via `curl` + HTML inspection
- [x] 144/144 automated tests passing, including 6 regression-guard tests protecting the required DOM elements
- [x] `npm run build` completes with zero TypeScript errors
- [x] **Project-wide test coverage gate PASSES** (constitution requires ≥85% on all four metrics): `npm test -- --coverage` exits **0** with Statements 98.33%, Branches 90%, Functions 100%, Lines 98.19% — see "Test Coverage Compliance" section below

---

## Test Coverage Compliance (Constitution Principle I — 85% minimum)

**Before this pass**: `npm test -- --coverage` **failed** the coverage gate (exit code ≠ 0) at
only **46.66%** statements / 35.83% branches / 53.12% functions / 45.48% lines project-wide.
Several pre-existing files had little-to-no real tests — most notably `ai-service.test.ts`,
which consisted entirely of empty `TODO` placeholder test bodies that always passed without
exercising any actual logic (a silent Test-First policy violation predating spec 002).

**Root cause**: `jest.config.js` sets a **global** coverage threshold of 85% across all four
metrics, collected from all of `src/**/*.ts`. Four services and the routes file were almost
entirely untested:

| File | Coverage before | Coverage after |
|---|---|---|
| `services/ai-service.ts` | 25.92% stmts | **100%** stmts, 84.84% branches |
| `services/prompt-builder.ts` | 9.09% stmts | **100%** stmts/branches |
| `services/transcript-service.ts` | 17.5% stmts | **100%** stmts, 83.33% branches |
| `services/voice-service.ts` | 14.28% stmts | **100%** stmts/branches |
| `routes/care-journey.ts` | 43.47% stmts | 97.82% stmts, 79.16% branches |

**Fix**: Replaced the placeholder `ai-service.test.ts` with 17 real tests (mocked OpenAI client
covering success, JSON-extraction edge cases, retry/backoff on 429 and 503, non-retryable
failures, and max-retries exhaustion). Added new test files: `prompt-builder.test.ts` (15 tests,
pure-function coverage of system/user prompt generation including billing and appointment
branches), `transcript-service.test.ts` (10 tests, mocked `fs`), `voice-service.test.ts` (4
tests, mocked OpenAI TTS client), and `care-journey-routes-extra.test.ts` (15 tests, mocked
`ai-service`/`voice-service`/`transcript-service` to safely test `/analyze`, `/voice/tts`,
`/voice/conversations`, and `/messages` endpoints via supertest without real network calls or
disk writes).

**After this pass**: `npm test -- --coverage` **passes** (exit code 0):

```
All files               |   98.33 |    90    |   100   |   98.19 |
 data/sample-patients.ts|      90 |   100    |   100   |   88.88 |
 routes/care-journey.ts |   97.82 |   79.16  |   100   |   97.8  |
 services/ai-service.ts |     100 |   84.84  |   100   |    100  |
 services/message-service.ts | 98.27 | 96.77 |   100   |   97.87 |
 services/prompt-builder.ts  |   100 |   100 |   100   |    100  |
 services/transcript-service.ts | 100 | 83.33 | 100    |    100  |
 services/voice-service.ts   |   100 |   100 |   100   |    100  |
```

**Test Suites**: 10 passed, 10 total — **Tests**: 144 passed, 144 total

This is a **project-wide** fix (not scoped to the Care Team Tab feature itself), so these test
files live in their natural locations under `src/**/__tests__/` per standard Jest convention,
rather than inside this spec's `tests/` folder — only `care-journey-api.test.ts` (the careTeam
API tests) is duplicated here since it's directly relevant to spec 002.

---

## How to Verify Manually

```bash
npm run build
npm run dev
# Open http://localhost:3000
```

1. Log in as **David Kumar**.
2. Click **My Care** in the sidebar.
3. Confirm the **Care Journey** tab is active by default (timeline visible).
4. Click the **Care Team** tab.
5. Confirm you see:
   - **Dr. Sarah Mitchell — Primary Care Physician**
   - **Linda Torres — Certified Diabetes Educator**
   - No phone numbers shown.
6. Compare with the Home Page care team section — the two must be identical.
7. Confirm login, patient switching, and the other sidebar pages (To Do, Messages, Health
   Summary) still work normally.
