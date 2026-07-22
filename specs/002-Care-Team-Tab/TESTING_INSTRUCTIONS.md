# Testing Instructions: Care Team Tab Display

**Spec**: 002-Care-Team-Tab
**Architecture**: Care Team is a **tab inside "My Care"** (not a sidebar link)

---

## Prerequisites

```bash
npm install
npm run build
npm run dev
# Server: http://localhost:3000
```

---

## Automated Tests

```bash
npm test                    # Run full suite (should show 86/86 passing)
npm test -- --coverage      # Coverage report
```

Care Team-specific test files:
- `specs/002-Care-Team-Tab/tests/care-team.test.ts`
- `specs/002-Care-Team-Tab/tests/api-integration.test.ts`
- `specs/002-Care-Team-Tab/tests/care-team-ui.test.ts`

---

## Manual Test Scenarios

### Scenario 1: View Primary Doctor + Other Care Team Members

1. Open http://localhost:3000 and log in as **David Kumar** (P001).
2. Click **My Care** in the sidebar.
3. Confirm the page opens on the **Care Journey** tab by default (timeline visible).
4. Click the **Care Team** tab (next to "Care Journey").
5. **Expected**:
   - **Dr. Sarah Mitchell — Primary Care Physician** displays
   - **Linda Torres — Certified Diabetes Educator** displays
   - No phone numbers are shown
   - Layout matches the Home Page care team cards exactly

**Pass criteria**: Primary doctor and all other members display together, name + role only.

---

### Scenario 2: Empty State (No Care Team Assigned)

1. Log in as a patient with no `careTeam` entries (or temporarily edit `public/patients.json`
   to set `"careTeam": []` for a test patient).
2. Click **My Care** → **Care Team** tab.
3. **Expected**: "No Care Team Information Available" message with icon.

---

### Scenario 3: Home Page Unchanged (Regression)

1. Log in as David Kumar.
2. View the **Home** page — confirm the care team section still shows the same two members,
   same styling, same layout as before this feature was added.
3. Switch to a different patient, then back — confirm Home Page care team updates correctly
   both times.

---

### Scenario 4: Exact Parity Between Home Page and Care Team Tab

1. On the Home Page, note the care team members shown (name + role for each).
2. Go to **My Care** → **Care Team** tab.
3. **Expected**: Identical members, identical fields (name + role), identical order.

---

### Scenario 5: No Regressions to Existing Portal Functionality

1. Confirm login screen still works and patient selector shows all patients.
2. Confirm patient switching works from any page.
3. Confirm **To Do**, **Messages**, and **Health Summary** pages still load normally.
4. Confirm the **Care Journey** tab (inside My Care) still shows the timeline and AI insights
   panel exactly as before.

---

### Scenario 6: Tab Switching Behavior

1. In **My Care**, click **Care Team** tab → verify Care Journey content hides, Care Team
   content shows, and the "Care Team" tab button is visually active.
2. Click **Care Journey** tab again → verify it switches back correctly.

---

## Verification Checklist

- [ ] Care Team appears as a tab inside My Care (not a sidebar link)
- [ ] Primary doctor (role contains "Primary Care Physician") displays
- [ ] All other care team members display alongside the primary doctor
- [ ] Only name + role shown (no phone number) — matches Home Page exactly
- [ ] Empty state displays correctly for patients with no care team
- [ ] Home Page care team section unchanged
- [ ] Login, patient switching, and all other pages work normally
- [ ] `npm test` shows all tests passing
- [ ] No console errors in browser DevTools

---

## Troubleshooting

**Care Team tab not visible**: Hard refresh (Ctrl/Cmd+Shift+R) — HTML/JS may be cached.

**Login screen broken / no patients shown**: This indicates `public/index.html` or
`public/app.js` was corrupted by an unrelated edit. Run `git status` / `git diff` on those
two files and compare against the last known-good commit before re-applying Care Team changes.

**Care Team tab shows different data than Home Page**: Both must call the shared
`renderCareTeamList()` function — check that neither location has its own inline copy of the
rendering markup.
