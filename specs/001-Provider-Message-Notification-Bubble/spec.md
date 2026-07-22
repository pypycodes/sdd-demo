# Feature Specification: Provider Message Notification Bubble

**Feature Branch**: `feature/001-provider-message-notification-bubble`

**Spec Number**: 001

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Create a spec to add a feature to display any latest message from provider on the home screen. It should be like a bubble notification with unread messages count. If there are no messages then it should say 0 new messages"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Patient Sees Unread Messages Badge (Priority: P1)

As a patient visiting the home screen, I want to see a notification bubble showing the count of unread messages from my care providers, so I can quickly understand if there are new important communications waiting for me.

**Why this priority**: This is the core MVP feature - the visual indicator that tells patients they have messages. Without this, patients won't know messages exist.

**Independent Test**: Can be tested by loading the home screen with sample patient data that has unread messages. The bubble should display and show the correct count.

**Acceptance Scenarios**:

1. **Given** a patient has 3 unread messages from providers, **When** they load the home screen, **Then** the notification bubble displays "3" as the unread count
2. **Given** a patient has 1 unread message, **When** they view the home screen, **Then** the bubble shows "1 new message"
3. **Given** a patient has 10+ unread messages, **When** they view the home screen, **Then** the bubble displays "9+" indicating there are many messages
4. **Given** the patient has just logged in, **When** the home screen loads, **Then** the bubble appears in the top-right area (near voice FAB or header)

---

### User Story 2 - Show Latest Message Preview (Priority: P2)

As a patient, I want to see a preview of the most recent message from my provider in the bubble or on hover, so I can quickly understand what the message is about without opening the full message modal.

**Why this priority**: Adds context and urgency - patients can see if it's a reminder, urgent news, or routine update at a glance.

**Independent Test**: Can be tested by hovering over or clicking the notification bubble to see the latest message preview (sender name, timestamp, message snippet).

**Acceptance Scenarios**:

1. **Given** the notification bubble is visible, **When** the patient hovers over it, **Then** a tooltip or popup shows the latest message preview with provider name and message snippet
2. **Given** a message from "Dr. Smith - Cardiology" arrived 2 hours ago, **When** hovering over the bubble, **Then** the tooltip shows "Dr. Smith - Cardiology: Your lab results are ready..." with timestamp "2 hours ago"
3. **Given** there are multiple unread messages, **When** the patient views the preview, **Then** only the most recent message is shown in the preview
4. **Given** the message text is longer than 100 characters, **When** shown in preview, **Then** it truncates with "..." and the full message is available in the message modal

---

### User Story 3 - Click Bubble to Open Messages (Priority: P2)

As a patient, I want to click on the notification bubble to open the message modal, so I can easily read and respond to provider messages.

**Why this priority**: Provides the interaction path to access full messages. High value once P1 is working.

**Independent Test**: Can be tested by clicking the bubble and verifying the message modal opens showing the latest message or list of unread messages.

**Acceptance Scenarios**:

1. **Given** the notification bubble shows "3 new messages", **When** the patient clicks it, **Then** the message modal opens and displays the message list
2. **Given** the message modal opens, **When** it loads, **Then** the most recent unread message is highlighted/pre-selected
3. **Given** the patient is viewing messages, **When** they click "Back" or close the modal, **Then** the bubble count updates to reflect any newly read messages
4. **Given** the patient clicks the bubble on mobile, **When** the modal opens, **Then** it displays full-screen and is easy to read on small devices

---

### User Story 4 - Show "0 New Messages" State (Priority: P1)

As a patient with no unread messages, I want the notification area to clearly show "0 new messages" or similar, so I know there are no pending communications from my providers.

**Why this priority**: Critical for completeness - users need to understand "no news" vs "no feature exists yet".

**Independent Test**: Can be tested by loading the home screen with a patient who has zero unread messages. The bubble should display "0 new messages" or similar indicator.

**Acceptance Scenarios**:

1. **Given** a patient has 0 unread messages, **When** they load the home screen, **Then** the notification area shows "0 new messages"
2. **Given** all messages have been read, **When** the patient views the home screen, **Then** the bubble displays "0" in a muted/grayed-out style to indicate no urgency
3. **Given** the bubble shows "0 new messages", **When** the patient hovers over it, **Then** it shows a friendly message like "All caught up! No new messages from your providers"
4. **Given** a new message arrives, **When** it appears, **Then** the bubble transitions from "0" to "1" with a subtle animation or color highlight

---

### User Story 5 - Real-Time Updates (Priority: P3)

As a patient, I want the message count to update in real-time when new messages arrive, so I don't need to refresh the page to see new communications.

**Why this priority**: Nice-to-have for v1 (can use page refresh as workaround). High value for future versions when backend supports WebSockets/polling.

**Independent Test**: Can be tested in development by simulating a new message arriving and checking if the bubble count increments without page refresh.

**Acceptance Scenarios**:

1. **Given** a patient is viewing the home screen with "2 new messages", **When** a new message arrives from a provider, **Then** the bubble count increments to "3" automatically
2. **Given** the bubble count updates, **When** it changes, **Then** the bubble briefly highlights or animates to draw attention to the update
3. **Given** a new message arrives, **When** the patient is idle, **Then** a subtle notification sound or animation alerts them (accessibility-friendly, can be disabled)

---

### Edge Cases

- What happens when a provider sends multiple messages in quick succession? (Bubble should show total count, not individual sends)
- How does the system handle messages that arrive while the patient is reading messages in the modal? (Count should update, modal should show new message)
- What if the patient's device goes offline briefly? (Cache message count, sync when reconnected)
- What if a message is deleted by the provider before the patient sees it? (Remove from count and bubble)
- How does the system handle very long provider names? (Truncate in preview with ellipsis)
- What if the patient has messages from multiple providers? (Show only the latest message in preview, full list in modal)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a notification bubble on the home screen showing the count of unread messages from care providers
- **FR-002**: System MUST display "0 new messages" or similar clear indication when the patient has no unread messages
- **FR-003**: Notification bubble MUST show the maximum unread count as "9+" if there are 10 or more unread messages
- **FR-004**: System MUST display the latest message preview (sender name, timestamp, message snippet) when the patient hovers over or clicks the bubble
- **FR-005**: System MUST truncate message previews longer than 100 characters with "..." indicator
- **FR-006**: System MUST open the message modal when the patient clicks the notification bubble
- **FR-007**: System MUST position the notification bubble in the header area (near top-right, consistent with existing UI elements like voice FAB)
- **FR-008**: System MUST apply visual styling to indicate urgency when unread messages exist (color highlight, badge style)
- **FR-009**: System MUST include provider name (title) and timestamp in the message preview
- **FR-010**: System MUST update the message count when messages are marked as read from the message modal

### Key Entities

- **Message**: Represents a communication from a provider. Key attributes: id, patientId, providerId, providerName, providerSpecialty, content, timestamp, isRead
- **Provider**: Healthcare provider sending messages. Key attributes: id, name, specialty, contactInfo
- **Patient**: Patient receiving messages. Key attributes: id, unreadMessageCount, messages (array)

### Data Requirements

- Messages must be queryable by patient and read status
- Message count should be cached/computed efficiently (not recalculating from all messages on every page load)
- Timestamps must be relative ("2 hours ago") not absolute dates

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Notification bubble displays correctly for 100% of test cases (0, 1, 3, 10+, etc. messages)
- **SC-002**: Message preview shows correct provider name and message snippet with <500ms latency
- **SC-003**: Bubble visually stands out and is noticed by 95%+ of users (UX testing metric)
- **SC-004**: Clicking the bubble opens the message modal within 200ms (performance metric)
- **SC-005**: Patient can mark a message as read and see the bubble count decrease immediately (100% accuracy)
- **SC-006**: Visual design is consistent with existing UI (Tailwind colors, spacing, hover states match constitution accessibility standards WCAG 2.1 AA)
- **SC-007**: Notification bubble is fully keyboard accessible and works with screen readers (accessibility requirement from constitution)

---

## Assumptions

- The backend API already has an endpoint to fetch unread message count for a patient (e.g., `GET /api/patients/:id/messages/unread-count`)
- Messages are stored with timestamps and read/unread status in the data layer
- The existing message modal (visible in index.html lines 483-502) will be enhanced to support full message list, not just single message display
- Patient session/authentication is already in place - we know which patient is viewing
- No WebSocket/real-time backend exists yet - updates require page refresh or polling (can be added in P3 user story)
- Message content is plain text, not HTML (prevents XSS vulnerabilities as per security best practices)
- Provider specialty and name are always available (no null values)
- The home screen (main-app div) is always rendered for authenticated users

---

## Open Questions / Needs Clarification

- Should the message preview show in a tooltip, popup, or inline? (Currently assuming hover popup)
- Should clicking the bubble show the latest message only or the full list of unread messages? (Currently assuming full list)
- What is the max message preview length? (Currently assuming 100 characters as reasonable default)
- Should new message arrivals trigger a notification sound? (Currently assuming visual only, can be added as enhancement)
- Is there a backend API for unread message count or should we calculate from sample data? (Currently assuming it exists, needs confirmation)

---

## Acceptance Tests (BDD Scenarios)

```gherkin
Feature: Provider Message Notification Bubble
  As a patient
  I want to see unread message counts from my providers on the home screen
  So I can quickly understand if there are new important communications

  Scenario: Display unread message count
    Given a patient has 3 unread messages from providers
    When they load the home screen
    Then a notification bubble displays "3"

  Scenario: Display zero new messages state
    Given a patient has 0 unread messages
    When they load the home screen
    Then the notification shows "0 new messages"

  Scenario: Show message preview on hover
    Given a patient sees the notification bubble
    When they hover over it
    Then a preview shows the latest message with provider name and timestamp

  Scenario: Open message modal on click
    Given the notification bubble is visible
    When the patient clicks it
    Then the message modal opens showing the latest message

  Scenario: Update count after marking as read
    Given the bubble shows "3 new messages"
    When the patient marks a message as read in the modal
    Then the bubble count updates to "2"
```

---

**Status**: Ready for design/planning phase
**Next Step**: Proceed to plan.md for architecture and task breakdown
