Feature: Data-Driven JSON Responses
  As a frontend developer
  I want consistent JSON API responses
  So that I can reliably parse and handle all API calls

  Scenario: Valid JSON response structure
    Given any API endpoint
    When requesting data
    Then response MUST be valid JSON
    And response MUST include "success" boolean
    And if success=true, MUST include "data" field
    And if success=false, MUST include "error" string
    And MUST NOT include raw HTML/XML or plain text

  Scenario: Include AI metadata in response
    Given a successful AI analysis
    When returning JourneyAnalysis
    Then response MUST include aiMetadata object
    And aiMetadata MUST include: provider, model, tokensPrompt, tokensCompletion, latencyMs
    Example response:
    ```json
    {
      "success": true,
      "data": {
        "patientId": "1",
        "currentPhase": "Post-Diagnosis Monitoring",
        "journeySummary": "You've made great progress...",
        "nextBestActions": [...],
        "aiMetadata": {
          "provider": "OpenAI",
          "model": "gpt-4o-mini",
          "tokensPrompt": 1024,
          "tokensCompletion": 256,
          "tokensTotal": 1280,
          "latencyMs": 2340
        }
      }
    }
    ```

  Scenario: Consistent error response format
    Given any API error
    When endpoint returns error
    Then response MUST be valid JSON
    And response.success MUST be false
    And response.error MUST be string
    And response.error MUST NOT contain stack trace
    And response MUST NOT have "data" field
