Feature: Healthcare Safety & PHI Protection
  As a healthcare POC developer
  I want to ensure all patient data is protected and no clinical recommendations are made
  So that the system remains safe and compliant with privacy regulations

  Scenario: System prompt forbids medication recommendations
    Given an LLM receives a care journey for a diabetic patient
    When the LLM generates next best actions
    Then the response MUST NOT suggest specific medications
    And the response MUST NOT recommend diagnostic tests
    And the response MUST include clinical disclaimer
    And the response MUST use language like "reach out to your care team"

  Scenario: Patient names anonymized before LLM call
    Given a patient "John Smith" with ID "PAT-123"
    When generating AI analysis
    Then the API request MUST NOT contain "John Smith"
    And the API request MUST use placeholder like "Patient" or "PAT-123"
    And logs MUST NOT contain patient name

  Scenario: Dates pseudonymized in LLM request
    Given a care event on "2024-06-15"
    When building the AI prompt
    Then absolute dates MUST be replaced with relative dates
    And privacy-sensitive dates MUST NOT appear in API logs
    Example: "3 days ago" instead of "2024-06-15"

  Scenario: Provider names generalized
    Given a visit with provider "Dr. Alice Johnson, Cardiology"
    When sending to LLM
    Then the prompt MUST contain "Cardiologist" not "Dr. Alice Johnson"
    And provider's first name MUST NOT appear in request

  Scenario: No PII in error messages
    Given an AI request fails
    When returning error to frontend
    Then error message MUST NOT expose API details
    And error MUST NOT contain patient/provider names
    And error MUST contain friendly message: "AI service temporarily unavailable"

  Scenario: Clinical disclaimer always included
    Given any AI-generated response
    When returning to patient
    Then response MUST include disclaimer
    And disclaimer MUST say: "This is for informational purposes only"
    And disclaimer MUST say: "NOT a substitute for professional medical advice"
