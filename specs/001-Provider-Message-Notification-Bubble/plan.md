# Implementation Plan: Provider Message Notification Bubble

**Feature**: `001-Provider-Message-Notification-Bubble`  
**Branch**: `feature/001-provider-message-notification-bubble`  
**Date**: 2026-07-08  
**Spec**: [spec.md](spec.md)  
**Acceptance Tests**: [acceptance.feature](acceptance.feature)

---

## Summary

Add a notification bubble to the home screen displaying unread message count from care providers. The bubble shows:
- **Unread count** (0-9+) with visual badge styling
- **Latest message preview** on hover (provider name, timestamp, message snippet)
- **Message modal trigger** on click to view full conversation
- **Zero-state messaging** when no unread messages exist ("0 new messages")

**Technical Approach**: Lightweight frontend component (HTML/CSS/JS) integrated with existing message modal, fetching unread count from backend API.

---

## Technical Context

**Language/Version**: JavaScript (ES6+) + TypeScript (strict mode)

**Primary Dependencies**:
- Express.js (backend routing)
- Tailwind CSS (styling, already in use)
- OpenAI API (for AI features, not directly used for this feature)

**Storage**: In-memory for MVP (messages from sample-patients.ts)

**Testing**: Jest (unit tests), Supertest (integration tests), BDD with Cucumber

**Target Platform**: Web browser (desktop + mobile responsive)

**Project Type**: Web application (Node.js backend + vanilla JS frontend)

**Performance Goals**:
- Unread count fetch: <100ms (non-AI endpoint)
- Message preview render: <50ms
- Message modal open: <200ms
- Real-time updates: N/A for v1 (requires page refresh)

**Constraints**:
- No persistent database (sample data only)
- No WebSocket (polling/refresh for v1)
- WCAG 2.1 Level AA accessibility compliance
- No PHI/PII in browser console logs
- Healthcare safety: No clinical recommendations in messages

**Scale/Scope**:
- ~18 sample patients
- ~5-10 messages per patient
- Single user per session
- Mobile responsive (tablet + phone)

---

## Constitution Check ✅

**Gate Status**: PASSED

| Principle | Requirement | Implementation |
|-----------|-------------|-----------------|
| **I. Healthcare Safety** | No PHI/PII in logs; clinical safety disclaimer | Message content sanitized; disclaimer shown in modal |
| **II. Type Safety** | TypeScript strict; ≥85% coverage | Frontend uses TypeScript types; test suite required |
| **V. Observability** | Log all requests with metadata | Console logs include: count, latency, provider count |
| **VI. Accessibility** | WCAG 2.1 AA; keyboard nav; screen reader | Aria labels; focus indicators; semantic HTML |
| **Dev Workflow** | Spec numbering; BDD scenarios; >85% coverage | Spec 001; 12 BDD scenarios; unit tests required |

**Violations**: None

---

## Project Structure

### Documentation (this feature)

```text
specs/001-Provider-Message-Notification-Bubble/
├── spec.md                      (Requirements & user stories)
├── acceptance.feature           (12 BDD acceptance scenarios)
├── plan.md                      (This file - architecture & design)
├── tasks.md                     (To be created - implementation breakdown)
└── tests/                       (Optional - test code)
    └── notification.test.ts
```

### Source Code (repository root)

```text
public/
├── index.html                   (Home screen - UPDATE)
├── app.js                       (Main app logic - UPDATE)
└── patients.json                (Sample data)

src/
├── types/
│   └── care-journey.ts          (Message type - UPDATE)
├── routes/
│   └── care-journey.ts          (New endpoint: GET /api/patients/:id/messages/unread-count)
└── services/
    └── message-service.ts       (NEW - calculate unread count)

tests/
├── unit/
│   └── message-service.test.ts  (Unit tests for message logic)
└── integration/
    └── notification-api.test.ts (Integration tests for endpoint)
```

**Structure Decision**: Single project structure (existing pattern). Frontend and backend are co-located in same repository. Message logic extracted to new service for reusability.

---

## Architecture & Design Decisions

### 1. **Notification Bubble Component**

**Location**: HTML badge in `public/index.html` header area  
**Styling**: Tailwind CSS (consistent with existing UI)  
**Data Source**: Backend API endpoint

**HTML Structure**:
```html
<div id="notification-bubble" class="notification-badge">
  <span id="unread-count" class="badge-number">0</span>
  <div id="notification-preview" class="preview-tooltip hidden">
    <!-- Preview content -->
  </div>
</div>
```

**CSS Classes**:
- `.notification-badge` - Main bubble container
- `.badge-number` - Count display
- `.preview-tooltip` - Hover preview popup
- `.has-messages` - Styling when count > 0 (color highlight)
- `.no-messages` - Styling when count = 0 (muted/grayed)
- `.new-message` - Animation on count change

### 2. **Backend API Endpoint**

**Endpoint**: `GET /api/patients/:patientId/messages/unread-count`

**Response**:
```json
{
  "success": true,
  "data": {
    "patientId": "1",
    "unreadCount": 3,
    "latestMessage": {
      "providerId": "P-001",
      "providerName": "Dr. Smith",
      "providerSpecialty": "Cardiology",
      "timestamp": "2026-07-08T15:30:00Z",
      "content": "Your lab results are ready. Please review...",
      "isRead": false
    }
  }
}
```

**Implementation**:
- Query `sample-patients.ts` for patient
- Filter messages by `patientId` where `isRead === false`
- Return count and latest message details
- No database calls (in-memory data for MVP)

### 3. **Frontend Interactions**

**On Page Load**:
1. Fetch unread count from API
2. Render bubble with count
3. Apply styling based on count (0 = muted, >0 = highlighted)
4. Set up event listeners (hover, click)

**On Hover**:
1. Show preview tooltip with latest message
2. Truncate content if > 100 chars
3. Format timestamp as relative ("2 hours ago")

**On Click**:
1. Open existing message modal
2. Populate with latest message (P1) or message list (later)
3. Allow user to mark as read
4. Trigger count update on modal close

**On Message Read (in Modal)**:
1. Update message `isRead` flag
2. Decrement unread count
3. Update bubble display (transition to next message or "0")
4. Emit event to bubble for real-time update

### 4. **Data Model**

**Message Entity** (TypeScript):
```typescript
interface Message {
  readonly id: string;
  readonly patientId: string;
  readonly providerId: string;
  readonly providerName: string;
  readonly providerSpecialty: string;
  readonly content: string;
  readonly timestamp: string; // ISO 8601
  readonly isRead: boolean;
}
```

**Patient Entity** (extend existing):
```typescript
interface Patient {
  readonly id: string;
  readonly messages: Message[]; // Add this
  // ... existing fields
}
```

### 5. **Message Service** (NEW)

**File**: `src/services/message-service.ts`

**Responsibilities**:
- Calculate unread count per patient
- Get latest unread message
- Mark message as read
- Validate PHI/PII before logging

**Key Functions**:
```typescript
getUnreadCount(patientId: string): number
getLatestUnreadMessage(patientId: string): Message | null
markMessageAsRead(patientId: string, messageId: string): void
getAllMessages(patientId: string): Message[]
```

### 6. **Accessibility (WCAG 2.1 AA)**

**Keyboard Navigation**:
- Bubble reachable via Tab key
- Focus indicator visible (outline or highlight)
- Enter/Space opens message modal
- Escape closes modal

**Screen Reader**:
- Aria-label: "Unread messages: 3" (or count)
- Aria-live="polite" for count updates (announces new messages)
- Semantic HTML (button or div with role)

**Color Contrast**:
- Badge text: ≥4.5:1 contrast ratio with background
- Highlight color for new messages: ≥3:1 for UI components
- No color-only information (use text + color)

**Mobile Responsive**:
- Bubble positioned consistently on mobile
- Tooltip doesn't overflow screen
- Touch-friendly tap target (min 44x44px)
- Modal opens full-screen on mobile

---

## Implementation Phases

### **Phase 1: Backend Setup** (2-3 tasks)
1. Create message service (`message-service.ts`)
2. Create API endpoint (`GET /api/patients/:id/messages/unread-count`)
3. Add unit tests for message service

**Acceptance**: Endpoint returns correct count for all test patients

### **Phase 2: Frontend Bubble** (2-3 tasks)
1. Add HTML bubble to `public/index.html` header
2. Style with Tailwind CSS
3. Add JavaScript event handlers (load, hover, click)

**Acceptance**: Bubble displays count and is visually clear

### **Phase 3: Message Preview** (2 tasks)
1. Implement hover tooltip with latest message
2. Format timestamp and truncate content

**Acceptance**: Preview shows provider name, timestamp, truncated message

### **Phase 4: Modal Integration** (2 tasks)
1. Wire bubble click to existing message modal
2. Update modal to support full message list (or single message first)

**Acceptance**: Clicking bubble opens message modal with message details

### **Phase 5: Read Status & Updates** (2 tasks)
1. Implement mark-as-read functionality
2. Update bubble count when message marked as read

**Acceptance**: Count decrements correctly when message marked as read

### **Phase 6: Accessibility & Testing** (3 tasks)
1. Add ARIA labels and keyboard navigation
2. Write unit tests for message service (≥85% coverage)
3. Write integration tests for API endpoint and frontend interactions

**Acceptance**: All BDD scenarios passing; accessibility compliance verified

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Sample data doesn't include messages | Low | High | Create test data with messages in sample-patients.ts |
| Existing message modal structure doesn't support list | Medium | Medium | Enhance modal to support both single + list view |
| Timestamp formatting differs across browsers | Low | Low | Use library (date-fns) for consistent formatting |
| PHI/PII accidentally logged | Low | Critical | Sanitize before logging; code review required |
| Mobile tooltip overflow | Low | Medium | Test on actual mobile; adjust positioning |

---

## Testing Strategy

### **Unit Tests** (message-service.ts)
- Test unread count calculation
- Test latest message selection
- Test mark-as-read functionality
- Test with edge cases (0 messages, 10+ messages)
- Coverage target: ≥85%

### **Integration Tests** (API endpoint)
- Test GET endpoint returns correct data
- Test response structure (ApiResponse envelope)
- Test error handling (patient not found)
- Test performance (<100ms)

### **BDD Tests** (acceptance.feature)
- All 12 scenarios from acceptance.feature
- Verify bubble displays count
- Verify preview shows on hover
- Verify click opens modal
- Verify count updates after mark-as-read

### **Manual Tests**
- Mobile responsive (tablet, phone)
- Accessibility (keyboard nav, screen reader)
- Cross-browser (Chrome, Firefox, Safari)

---

## Resource Estimates

| Phase | Tasks | Effort | Days |
|-------|-------|--------|------|
| Phase 1 | Backend | 3 | 1 |
| Phase 2 | Frontend Bubble | 2-3 | 1 |
| Phase 3 | Message Preview | 2 | 1 |
| Phase 4 | Modal Integration | 2 | 1 |
| Phase 5 | Read Status | 2 | 1 |
| Phase 6 | Testing & A11y | 3 | 1-2 |
| **Total** | **14-16 tasks** | **~40 hours** | **~5-6 days** |

---

## Success Criteria (from spec.md)

- **SC-001**: Bubble displays correctly for all count values (0, 1, 3, 10+) ✅
- **SC-002**: Preview shows provider name + snippet in <500ms ✅
- **SC-003**: Bubble visually prominent (noticed by 95%+ users) ✅
- **SC-004**: Modal opens within 200ms of click ✅
- **SC-005**: Count updates immediately on mark-as-read ✅
- **SC-006**: Visual design consistent with existing UI (Tailwind) ✅
- **SC-007**: Full keyboard + screen reader accessibility ✅

---

## Next Steps

1. **Code Review**: Present plan to team
2. **Create tasks.md**: Break down into specific, assignable tasks
3. **Create feature branch**: `feature/001-provider-message-notification-bubble`
4. **Start Phase 1**: Create message service + API endpoint
5. **Run tests**: Verify each phase with unit/integration tests
6. **Deploy**: Merge to main when all BDD scenarios passing

---

**Status**: Ready for task breakdown  
**Next Document**: tasks.md (implementation task list)
