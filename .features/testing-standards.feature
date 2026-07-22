Feature: Testing Standards & Coverage
  As a code reviewer
  I want to enforce testing standards
  So that code quality remains high and bugs are caught early

  Scenario: Test coverage >= 85%
    Given a PR with code changes
    When running: npm test -- --coverage
    Then coverage report MUST show >= 85%
    And lines with coverage < 85% MUST be marked "// untested: [reason]"
    And coverage must include: lines, statements, functions, branches

  Scenario: Pre-commit hook runs linter
    Given modified TypeScript files
    When attempting: git commit
    Then hook MUST run: npm run lint
    And hook MUST run: npm run build (type check)
    And hook MUST reject commit if either fails
    And developer can bypass with --no-verify (with documented reason)

  Scenario: Pre-push hook enforces coverage
    Given a feature branch
    When attempting: git push
    Then hook MUST run: npm test -- --coverage
    And hook MUST reject if coverage < 85%
    And developer MUST add tests before retry
    And hook output MUST show coverage percentage

  Scenario: BDD scenarios documented for each feature
    Given a new feature
    When completing implementation
    Then .features/*.feature MUST document all scenarios
    And scenarios MUST match feature spec acceptance criteria
    And scenarios MUST be executable with Cucumber
    And each scenario MUST have Given/When/Then structure

  Scenario: Unit tests for service modules
    Given a service module (e.g., ai-service.ts)
    When creating unit tests
    Then tests MUST cover: happy path, error cases, edge cases
    And tests MUST have descriptive names
    And tests MUST use "describe" blocks for organization
    And test file location MUST be: src/services/__tests__/service-name.test.ts

  Scenario: Integration tests for API endpoints
    Given an API endpoint
    When creating integration tests
    Then tests MUST use Supertest to make HTTP requests
    And tests MUST verify: response status, response body structure
    And tests MUST verify: error handling, input validation
    And test file location MUST be: src/routes/__tests__/route-name.test.ts
