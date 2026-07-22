# Tasks: Provider Message Notification Bubble

**Input**: Design documents from `/specs/001-Provider-Message-Notification-Bubble/`

**Prerequisites**: 
- ✅ spec.md (user stories & requirements)
- ✅ plan.md (architecture & design)
- ✅ acceptance.feature (BDD scenarios)

**Tests**: Unit tests + integration tests included (required for ≥85% coverage per constitution)

**Organization**: Tasks grouped by user story (P1 first, P2/P3 later). Tasks can be parallelized within a phase but must respect cross-phase dependencies.

---

## Format: `[ID] [P?] [Story] Description`

- **[ID]**: Task number (001, 002, ...)
- **[P?]**: Priority (P1=MVP, P2=Important, P3=Nice-to-have)
- **[Story]**: Which user story this task implements
- **Description**: What to build + acceptance criteria

---

## Phase 1: Setup & Infrastructure (Shared, Blocking)

### Data Model & Types

**[001] [P0] [Setup] Define Message TypeScript type**

Add `readonly` Message interface to `src/types/care-journey.ts`:

**Acceptance Criteria**:
- ✅ Type is exported from care-journey.ts
- ✅ All fields are readonly
- ✅ TypeScript strict mode passes
- ✅ Patient type updated to include `messages: Message[]`

**Links to Spec**: FR-001, FR-009 (data model)

---

**[002] [P0] [Setup] Add test data with messages to sample-patients.ts**

Update `src/data/sample-patients.ts` to include messages for each patient:
- Patient 1: 3 unread messages
- Patient 2: 0 unread messages
- Patient 3: 1 unread message
- Patient 4: 5+ unread messages (test 9+ display)

**Acceptance Criteria**:
- ✅ Each patient has `messages: Message[]` array
- ✅ Messages have varying `isRead` status
- ✅ Timestamps are realistic (past 7 days)
- ✅ Provider names + specialties realistic
- ✅ No PHI/PII in message content (use generic text)

**Links to Spec**: Risk mitigation (sample data completeness)

---

**[003] [P0] [Setup] Create message service (business logic)**

Create new file `src/services/message-service.ts` with functions:

**Acceptance Criteria**:
- ✅ Functions return correct values for test patients
- ✅ Handles edge cases (no messages, 10+ messages)
- ✅ No mutations to patient data
- ✅ TypeScript strict mode passes
- ✅ All functions have JSDoc comments

**Links to Spec**: Plan architecture (Message Service component)

---

### Unit Tests for Message Service

**[004] [P0] [Setup] Write unit tests for message-service.ts**

Create `src/services/__tests__/message-service.test.ts` with test cases for:
- getUnreadCount (all cases)
- getLatestUnreadMessage (with/without messages)
- markMessageAsRead functionality
- getAllMessages function

**Acceptance Criteria**:
- ✅ ≥85% coverage for message-service.ts
- ✅ All edge cases tested
- ✅ Tests pass locally
- ✅ Tests pass in CI (pre-commit hook)

**Links to Spec**: Constitution (≥85% coverage requirement)

---

## Phase 2: Backend API Endpoint

**[005] [P1] [Story 1 & 4] Create GET /api/patients/:id/messages/unread-count endpoint**

Add new route to `src/routes/care-journey.ts` returning unread count + latest message preview

**Acceptance Criteria**:
- ✅ Endpoint returns correct unread count
- ✅ Includes latest message preview
- ✅ Returns 404 for non-existent patient
- ✅ Response follows ApiResponse<T> structure
- ✅ Response time <100ms
- ✅ No PHI/PII in logs (sanitized before logging)

**Links to Spec**: FR-001 (display count), FR-004 (message preview), FR-009 (provider info)

---

**[006] [P1] [Story 1 & 4] Write integration tests for message count endpoint**

Create `src/routes/__tests__/message-count.test.ts` with test coverage for:
- Unread count retrieval
- Patient not found error
- Latest message in preview
- Response structure
- Performance (<100ms)

**Acceptance Criteria**:
- ✅ All test cases pass
- ✅ Coverage for care-journey.ts increased
- ✅ Happy path + error cases covered
- ✅ Performance tested

**Links to Spec**: Constitution (testing standards)

---

## Phase 3: Frontend - Notification Bubble Component

### HTML & Styling

**[007] [P1] [Story 1 & 4] Add notification bubble HTML to public/index.html**

Add bubble to header with IDs: notification-bubble, unread-count, notification-preview

**Acceptance Criteria**:
- ✅ HTML added to header area
- ✅ IDs match JavaScript references
- ✅ Accessible markup (aria-label, aria-live, role)
- ✅ Positioned consistently with other header elements

**Links to Spec**: FR-007 (position in header), FR-001 (display count)

---

**[008] [P1] [Story 1 & 4] Add Tailwind CSS styling for notification bubble**

Add CSS for:
- Bubble container and badge styling
- Color for urgent (red) and muted (gray) states
- Focus indicators (blue outline)
- Hover effects (scale 1.05)
- Preview tooltip positioning and animation

**Acceptance Criteria**:
- ✅ Bubble styled with proper colors
- ✅ Focus indicator visible (2px blue outline)
- ✅ Hover effect smooth
- ✅ Preview tooltip styled with proper spacing
- ✅ Color contrast ≥4.5:1 for WCAG AA
- ✅ Responsive on mobile

**Links to Spec**: FR-008 (visual styling), FR-007 (positioning), Constitution (accessibility)

---

### JavaScript Logic

**[009] [P1] [Story 1 & 4] Initialize bubble on page load**

Add to `public/app.js` function to:
- Fetch unread count from API on page load
- Update count display (0-9+)
- Apply styling based on count
- Set up event listeners (hover, click, keyboard)

**Acceptance Criteria**:
- ✅ Bubble initializes on page load
- ✅ Count fetched from API and displayed
- ✅ Styling applied based on count (0 = muted, >0 = highlighted)
- ✅ Hover shows preview
- ✅ Click opens message modal
- ✅ Keyboard navigation works (Tab, Enter/Space)
- ✅ No console errors
- ✅ Performance: <100ms to display initial count

**Links to Spec**: Story 1, Story 4, FR-001, FR-006, FR-007

---

**[010] [P2] [Story 2] Show "All caught up" preview for zero messages**

Update preview logic to show friendly message when count = 0

**Acceptance Criteria**:
- ✅ Friendly message shown when count = 0
- ✅ Styling appropriate for zero state
- ✅ User understands there are no pending messages

**Links to Spec**: Story 4, FR-002 (zero message state)

---

## Phase 4: Modal Integration & Read Status Updates

**[011] [P2] [Story 3] Wire bubble click to existing message modal**

Update `openMessageModal()` function to populate modal with latest message details

**Acceptance Criteria**:
- ✅ Clicking bubble opens existing message modal
- ✅ Modal populated with latest message
- ✅ Modal displays provider name, timestamp, full content
- ✅ Modal closes with X button or Escape key
- ✅ Modal responsive on mobile (full-screen)
- ✅ Opening time <200ms

**Links to Spec**: Story 3, FR-006 (open modal on click)

---

**[012] [P2] [Story 3 & 5] Add mark-as-read functionality to message modal**

Add button and handler to mark message as read in modal

**Acceptance Criteria**:
- ✅ Button appears in message modal
- ✅ Clicking marks message as read
- ✅ Bubble count decrements immediately
- ✅ Count updates without page refresh
- ✅ Bubble transitions to next message or "0 messages"

**Links to Spec**: Story 5, FR-010 (update count on read)

---

**[013] [P1] [Story 3 & 5] Create POST endpoint to mark message as read**

Add route: POST /api/patients/:patientId/messages/:messageId/mark-read

**Acceptance Criteria**:
- ✅ Endpoint accepts POST request
- ✅ Marks message as read in data
- ✅ Returns success response
- ✅ Returns 400 on error (invalid patient/message ID)

**Links to Spec**: FR-010, Story 5

---

## Phase 5: Accessibility & Testing

**[014] [P1] [Story 1-5] Add ARIA labels & keyboard navigation**

Enhance HTML with ARIA attributes and update JavaScript to:
- Add aria-label, aria-live, role attributes
- Update ARIA when count changes
- Verify keyboard navigation (Tab, Enter, Space, Escape)

**Acceptance Criteria**:
- ✅ ARIA labels describe purpose
- ✅ aria-live="polite" announces changes
- ✅ role="button" semantic
- ✅ tabindex="0" makes focusable
- ✅ Focus indicator visible
- ✅ Keyboard navigation works
- ✅ Screen reader announces correctly

**Links to Spec**: Constitution (accessibility), FR-007

---

**[015] [P1] [Story 1-5] Write frontend unit tests**

Create `public/tests/notification-bubble.test.js` with test coverage for:
- Display unread count (all ranges)
- Preview tooltip functionality
- Message modal interactions
- Accessibility features

**Acceptance Criteria**:
- ✅ All user scenarios tested
- ✅ Happy path + error cases
- ✅ Accessibility verified
- ✅ Tests pass locally

**Links to Spec**: Constitution (testing), all stories

---

**[016] [P1] [Story 1-5] Verify all BDD acceptance scenarios pass**

Run all 12 acceptance test scenarios from acceptance.feature

**Acceptance Criteria**:
- ✅ All 12 BDD scenarios passing
- ✅ No console errors or warnings
- ✅ No accessibility violations
- ✅ Mobile responsive verified
- ✅ Cross-browser tested

**Links to Spec**: acceptance.feature, all stories

---

## Phase 6: Final Testing & Code Review

**[017] [P1] [Setup] Verify ≥85% test coverage**

Run coverage report: npm test -- --coverage

**Acceptance Criteria**:
- ✅ Overall coverage ≥85%
- ✅ message-service.ts ≥85%
- ✅ care-journey routes ≥85%
- ✅ All critical paths covered

**Links to Spec**: Constitution (coverage requirement)

---

**[018] [P1] [Polish] Code review & cleanup**

Final review checklist:
- No console.logs in production code
- No PHI/PII in logs or error messages
- All TypeScript strict mode passes
- ESLint passes
- Comments explain complex logic
- Commit messages follow convention

**Acceptance Criteria**:
- ✅ Code review approval
- ✅ All pre-commit hooks pass
- ✅ All pre-push checks pass
- ✅ Ready to merge to main

---

## Dependencies & Execution Order

### Critical Path (Must be sequential):
```
[001] Message type → [002] Test data → [003] Message service 
  → [004] Tests → [005] API endpoint → [006] Integration tests
  → [007] HTML → [008] CSS → [009] JS init → [010-016] Features
  → [017-018] QA & release
```

### Can be Parallelized:
- [004] after [003]
- [007-010] after [005]
- [014-016] after [013]

---

## Implementation Timeline

| Phase | Tasks | Est. Days | Team |
|-------|-------|-----------|------|
| Phase 1 | 001-004 | 1.5 | Backend |
| Phase 2 | 005-006 | 1 | Backend |
| Phase 3 | 007-010 | 1.5 | Frontend |
| Phase 4 | 011-013 | 1 | Full-stack |
| Phase 5 | 014-016 | 1.5 | QA/Frontend |
| Phase 6 | 017-018 | 0.5 | Lead |
| **Total** | **18 tasks** | **~7 days** | **1-2 devs** |

---

**Status**: Ready for implementation  
**Next Step**: Create feature branch and start Phase 1
