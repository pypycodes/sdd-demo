Feature: Type Safety & Immutability
  As a developer
  I want TypeScript to catch type errors at compile time
  So that the code is robust and safe for patients' data

  Scenario: Cannot mutate patient object
    Given a readonly Patient interface
    When attempting to modify patient.age
    Then TypeScript compiler MUST reject with TS2540 error
    And error message MUST mention "readonly"

  Scenario: ApiResponse wrapper enforces structure
    Given any API response
    When checking response type
    Then response MUST have "success: boolean"
    And response MUST have "data?: T | error?: string" fields
    And TypeScript MUST enforce these fields

  Scenario: Test coverage meets minimum threshold
    Given a module exports public functions
    When running: npm test -- --coverage
    Then coverage report MUST show >= 85%
    And uncovered lines MUST be marked "// untested: reason"
    And build MUST fail if coverage < 85%

  Scenario: No any types allowed
    Given TypeScript source code
    When linting with ESLint
    Then @typescript-eslint/no-explicit-any MUST be error
    And code MUST NOT use "any" type
    And code MUST use "unknown" with type guards instead
