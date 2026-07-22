Feature: Provider Message Notification Bubble
  As a patient
  I want to see unread message counts from my providers on the home screen
  So I can quickly understand if there are new important communications waiting for me

  Scenario: Display unread message count badge
    Given a patient has 3 unread messages from providers
    When they load the home screen
    Then a notification bubble displays "3" as the unread count
    And the bubble is visible in the header area
    And the bubble has visual styling to indicate new messages

  Scenario: Display zero new messages state
    Given a patient has 0 unread messages
    When they load the home screen
    Then the notification area shows "0 new messages"
    And the bubble is displayed in a muted/grayed-out style
    And no urgency indicator is shown

  Scenario: Show 9+ indicator for large message counts
    Given a patient has 15 unread messages from providers
    When they load the home screen
    Then the notification bubble displays "9+"
    And the user understands there are many messages waiting

  Scenario: Show message preview on hover
    Given a patient sees the notification bubble with unread messages
    When they hover over the bubble
    Then a preview tooltip appears
    And the preview shows the latest message provider name
    And the preview shows the message timestamp (relative format like "2 hours ago")
    And the preview shows a snippet of the message (truncated if longer than 100 chars)
    And the tooltip includes ellipsis (...) if message is truncated

  Scenario: Preview shows friendly "all caught up" message when no unread
    Given a patient sees the notification bubble with "0 new messages"
    When they hover over the bubble
    Then a preview tooltip appears
    And the tooltip displays "All caught up! No new messages from your providers"

  Scenario: Open message modal when clicking bubble
    Given the notification bubble is visible and shows unread messages
    When the patient clicks on the bubble
    Then the message modal opens
    And the message modal displays the list of messages
    And the most recent unread message is highlighted or selected
    And the modal displays all message details (provider, timestamp, full content)

  Scenario: Update count after marking message as read
    Given the notification bubble shows "3 new messages"
    When the patient marks a message as read in the message modal
    Then the bubble count updates immediately to "2"
    And the visual styling remains (unless count becomes 0)
    And the change is reflected without requiring page refresh

  Scenario: Transition from messages to zero state
    Given the notification bubble shows "1 new message"
    When the patient marks that message as read
    Then the bubble transitions to "0 new messages"
    And the bubble styling changes to muted/grayed-out appearance
    And the friendly "all caught up" tooltip becomes available

  Scenario: Handle long provider names in preview
    Given a message from a provider with a long name
    When the patient hovers over the notification bubble
    Then the provider name in the preview is truncated with ellipsis
    And the message is still readable and clear

  Scenario: Show multiple messages from different providers
    Given a patient has 5 unread messages from different providers
    When they load the home screen
    Then the bubble displays "5" total count
    When they hover over the bubble
    Then the preview shows only the latest message
    And the message modal shows all 5 messages when opened

  Scenario: Keyboard accessibility for notification bubble
    Given a patient is using keyboard navigation only
    When they navigate to the notification bubble
    Then the bubble receives focus
    And focus indicator is clearly visible
    And pressing Enter/Space opens the message modal
    And the bubble is reachable from main navigation

  Scenario: Screen reader accessibility for notification bubble
    Given a patient is using a screen reader
    When the screen reader reads the notification bubble
    Then it announces the unread message count clearly
    And the purpose is clear to the user
    And the bubble is properly labeled with ARIA attributes
