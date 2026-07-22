# Testing Guide - Care Journey Tracker

This document describes the testing infrastructure, coverage requirements, and BDD scenarios for the Care Journey Tracker project.

## Quick Start

### Run All Tests
```bash
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report (must be ≥85%)
```

### Run Linter
```bash
npm run lint              # Check for linting errors
npm run lint:fix          # Fix linting errors automatically
npm run type-check        # Run TypeScript type checking
```

### Pre-Commit Hooks
Hooks are automatically installed via Husky. They run:
- **Pre-commit**: Linter + type check + unit tests
- **Pre-push**: Full test suite + coverage verification (≥85%)

Bypass with: `git commit --no-verify` (only for emergencies, document reason)

---

## Test Structure

### Directory Layout
```
src/
├── services/
│   ├── ai-service.ts
│   └── __tests__/
│       └── ai-service.test.ts          # Unit tests
├── routes/
│   ├── care-journey.ts
│   └── __tests__/
│       └── care-journey.test.ts        # Integration tests
└── types/
    └── care-journey.ts                 # No tests needed (types only)

.features/
├── healthcare-safety.feature           # BDD scenarios
├── type-safety.feature
├── api-responses.feature
└── testing-standards.feature

tests/
├── integration/                        # Integration test placeholder
└── fixtures/                           # Test data and mocks
```

### Test Types

#### Unit Tests (src/services/__tests__/*.test.ts)
- Test individual functions and classes in isolation
- Mock external dependencies (OpenAI client, file system, etc.)
- Fast to run (< 1 second per test file)
- Focus on: business logic, error handling, edge cases

**Example: `ai-service.test.ts`**
```typescript
describe('AI Service', () => {
  describe('getProviderLabel', () => {
    it('should return provider label with model name', () => {
      const label = getProviderLabel();
      expect(label).toBeTruthy();
    });
  });
});
```

#### Integration Tests (src/routes/__tests__/*.test.ts)
- Test API endpoints with actual routing
- Use Supertest to make HTTP requests
- May use mocked AI service, real database/file system
- Slower than unit tests (< 5 seconds per test file)
- Focus on: API contracts, request/response validation, error handling

**Example: `care-journey.test.ts`**
```typescript
describe('Care Journey Routes', () => {
  describe('GET /api/patients', () => {
    it('should return list of patients', async () => {
      const response = await request(app).get('/api/patients');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

#### BDD Scenarios (.features/*.feature)
- Document acceptance criteria in plain English (Gherkin format)
- Executable with Cucumber (future implementation)
- Serve as living documentation
- Map to user stories and acceptance tests

**Example: `.features/healthcare-safety.feature`**
```gherkin
Feature: Healthcare Safety & PHI Protection
  Scenario: Patient names anonymized before LLM call
    Given a patient "John Smith" with ID "PAT-123"
    When generating AI analysis
    Then the API request MUST NOT contain "John Smith"
```

---

## Coverage Requirements

### Minimum Coverage: 85%

All four metrics must be ≥ 85%:
- **Lines**: % of lines of code executed
- **Statements**: % of statements executed
- **Functions**: % of functions called
- **Branches**: % of conditional branches taken

### Checking Coverage

```bash
npm run test:coverage
```

Output:
```
File                  | % Stmts | % Branch | % Funcs | % Lines |
------|---------|----------|---------|---------|
All files            |   88.5  |   86.2   |   90.1  |   88.5  |
  src/services/      |   92.0  |   89.0   |   95.0  |   92.0  |
  src/routes/        |   85.0  |   82.0   |   85.0  |   85.0  |
```

### Marking Untested Code

If you intentionally skip testing a line, add a comment:

```typescript
export function getProviderLabel(): string {
  return `${provider.label} (${provider.model})`; // untested: requires environment setup
}
```

---

## Running Specific Tests

### Run a Single Test File
```bash
npm test -- ai-service.test.ts
```

### Run Tests Matching a Pattern
```bash
npm test -- --testNamePattern="patient"
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

Watch mode automatically reruns tests when files change.

### Run Integration Tests Only
```bash
npm test -- --testPathPattern=integration
```

### Run Unit Tests Only
```bash
npm test -- --testPathPattern=__tests__
```

---

## Writing Tests

### Unit Test Template

```typescript
import { myFunction } from '../my-service';

describe('MyService', () => {
  describe('myFunction', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle error case', () => {
      // Arrange
      const badInput = null;

      // Act & Assert
      expect(() => myFunction(badInput)).toThrow('Expected error');
    });
  });
});
```

### Integration Test Template

```typescript
import request from 'supertest';
import app from '../../server';

describe('GET /api/patients', () => {
  it('should return 200 with patient list', async () => {
    const response = await request(app)
      .get('/api/patients')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const response = await request(app)
      .get('/api/patients/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  });
});
```

---

## Best Practices

### ✅ DO
- Write tests **before** implementing features (TDD)
- Use descriptive test names: `it('should validate email format')`
- Test both happy path and error cases
- Keep unit tests isolated with mocks
- Use `--watch` mode during development
- Add comments for complex test logic
- Group related tests with `describe` blocks

### ❌ DON'T
- Use `any` type in tests
- Skip coverage for "hard to test" code (refactor instead)
- Write tests that depend on other tests
- Test implementation details, test behavior
- Use hardcoded paths or timestamps (use fixtures)
- Leave `.only` or `.skip` in committed code

---

## Healthcare Safety Testing

All AI-related tests must verify:

1. **No PHI/PII in requests**
   ```typescript
   expect(request).not.toContain('John Smith');
   expect(request).not.toContain('2024-06-15');
   ```

2. **User-friendly error messages**
   ```typescript
   expect(error.message).not.toMatch(/ECONNREFUSED/);
   expect(error.message).toContain('AI service temporarily unavailable');
   ```

3. **Clinical disclaimer included**
   ```typescript
   expect(response.data.journeySummary).toContain('informational purposes only');
   ```

4. **No medication/diagnostic recommendations**
   ```typescript
   expect(response.data.nextBestActions).not.toContain('Take aspirin');
   expect(response.data.nextBestActions).not.toContain('Get an MRI');
   ```

---

## BDD Scenarios (Gherkin Format)

Located in `.features/` directory:

- `healthcare-safety.feature` — PHI protection, clinical guardrails
- `type-safety.feature` — TypeScript type system
- `api-responses.feature` — JSON response structure
- `testing-standards.feature` — Testing requirements

These scenarios document acceptance criteria and can be executed with Cucumber (future implementation).

---

## CI/CD Integration (Future)

When setting up CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test -- --coverage

- name: Check coverage
  run: |
    if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 85 ]; then
      echo "Coverage below 85%"
      exit 1
    fi
```

---

## Troubleshooting

### Tests Fail with "Cannot find module"
Make sure you built the TypeScript first:
```bash
npm run build
```

### Coverage Below 85%
Add tests for uncovered code:
```bash
npm run test:coverage
# Open coverage/index.html in browser to see which lines are uncovered
```

### Pre-commit Hook Fails
Run the failing check manually to see the error:
```bash
npm run lint          # See linting errors
npm run type-check    # See type errors
npm test              # See test failures
```

### Pre-push Hook Blocks Push
Ensure all tests pass and coverage is ≥85%:
```bash
npm run test:coverage
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated**: 2026-07-08
**Constitution Version**: 1.0.0
