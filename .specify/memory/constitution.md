# Care Journey Tracker Constitution

## Core Principles

### I. Test-First Development & Code Quality 🧪

**MUST**:
- **ALL code must have tests BEFORE being marked complete**
- Write tests first (TDD approach) OR alongside code before "done"
- Minimum test coverage: **85% or higher** (line, branch, function, statement)
- Run `npm test -- --coverage` and verify all metrics ≥ 85%
- **Code NOT tested = Code NOT deployed**
- Integration tests for all API endpoints
- Unit tests for all business logic functions
- E2E/manual tests for user workflows documented
- Before saying "implementation complete", run tests and pass coverage

**Rationale**: Untested code causes production bugs and patient safety issues. High coverage catches edge cases early and prevents regressions. Healthcare systems require confidence before deployment.

---

### II. Healthcare Safety & Data Protection First 🏥

**MUST**:
- All AI responses include clinical safety disclaimers
- System prompt forbids medical recommendations (medications, diagnostics, procedures)
- AI limited to appointment/scheduling reminders and care coordination only
- POC label visible to prevent clinical misuse
- **NO PHI/PII passed directly to LLM** — anonymize or pseudonymize all patient identifiers before sending to AI
- Only de-identified clinical facts (conditions, event categories, visit history) sent to LLM
- Conversation transcripts stored in-memory only (no PII persisted)

**Rationale**: Demo-stage code can become production code. Protecting patient privacy is non-negotiable; compliance with HIPAA/GDPR requires data minimization at the source.

---

### III. Type Safety & Immutability

**MUST**:
- All domain types use `readonly` modifiers (no mutations)
- Express strict TypeScript compiler settings (`strict: true`, no `any` types)
- JSON responses wrapped in `ApiResponse<T>` envelope for consistency
- No `any` types — use `unknown` with type guards
- Generated files must declare types explicitly

**Rationale**: Prevents accidental mutations; enables safer AI-driven transformations of sensitive patient data. High coverage catches edge cases early.

---

### IV. Data-Driven JSON Responses

**MUST**:
- All API responses follow standard `ApiResponse<T>` envelope:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  ```
- No HTML content mixed with JSON
- Use proper Content-Type headers (`application/json`)
- Error responses wrapped in same envelope

**Rationale**: Predictable API contracts enable reliable client integration and better error handling.

---

### V. Observable Error Handling

**MUST**:
- All errors logged with context (request ID, timestamp, error type)
- Error messages user-friendly (no stack traces exposed to clients)
- No PHI/PII in error logs
- Graceful degradation when AI service unavailable

**Rationale**: Observability enables faster debugging in production; secure error messages prevent information leakage.

---

### VI. Performance Targets

**MUST**:
- API response time (non-AI endpoints): ≤ 100ms (p95), ≤ 200ms (p99)
- AI-powered endpoints: ≤ 5000ms (p95), ≤ 10000ms (p99)
- Frontend page load: ≤ 2 seconds
- Memory usage: ≤ 512MB for service
- CPU usage: ≤ 80% during normal operation

**Rationale**: Slow systems create poor user experience and safety issues in healthcare.

---

### VII. Accessibility & User Experience

**MUST**:
- WCAG 2.1 Level AA compliance (contrast, keyboard navigation, screen reader support)
- Semantic HTML5 (proper heading hierarchy, landmarks, ARIA labels)
- Keyboard navigation for all interactive elements
- Error messages clear and actionable
- Age-friendly design (large text, high contrast, simple language)

**Rationale**: Healthcare users include elderly patients and those with disabilities.

---

## Development Workflow

### Spec Creation & Testing
1. **Create Spec** (`/speckit-specify`) with requirements and acceptance criteria
2. **Create Plan** (`/speckit-plan`) with technical design
3. **Generate Tasks** (`/speckit-tasks`) with actionable items
4. **WRITE TESTS FIRST** before or alongside implementation
5. **Implement** code to pass tests
6. **Run `npm test -- --coverage`** - verify ≥ 85%
7. **Mark Complete** only after tests pass and coverage verified
8. **Code Review** - reviewers verify test coverage

### Branch Naming
- Format: `feature/NNN-description` (e.g., `feature/001-provider-message-bubble`)
- NNN = sequential spec number from spec file

### Test Coverage Requirements
- Minimum: 85% line, branch, function, statement coverage
- Command: `npm test -- --coverage`
- Verify: Lines ≥ 85%, Branches ≥ 85%, Functions ≥ 85%, Statements ≥ 85%

---

## Safety-Critical Checklist
- [ ] Code has tests (unit + integration)
- [ ] Test coverage ≥ 85% (`npm test -- --coverage`)
- [ ] No `any` types used
- [ ] No PHI/PII in logs or error messages
- [ ] No hardcoded API keys or secrets
- [ ] AI responses include clinical disclaimer
- [ ] Error messages user-friendly (no stack traces exposed)
- [ ] No patient names in summaries/recommendations
- [ ] Anonymization logic verified for new data fields

---

## Testing & Coverage
- [ ] Test coverage ≥ 85% (npm test -- --coverage)
- [ ] All tests pass locally
- [ ] Pre-commit hooks pass locally
- [ ] Integration tests added for new endpoints
- [ ] Manual tests documented in spec
- [ ] CI/CD pipeline passes all checks

---

## Approval Process
1. Author creates PR with checklist filled out
2. **Linter/type-check/tests must pass (CI gate)**
3. **Tests MUST have ≥ 85% coverage**
4. Code review by team (healthcare safety changes require 2 approvals)
5. PR merged only after all checks + approvals

---

**Version**: 2.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09

---

## VIII. Spec Organization & File Structure

**MUST**:
- **All spec-related files stay together in spec folder**
- Each spec has dedicated folder: `specs/NNN-feature-name/`
- Spec folder structure:

```
specs/NNN-Feature-Name/
├── spec.md                          # Feature specification
├── plan.md                          # Implementation plan
├── tasks.md                         # Task breakdown
├── research.md                      # Technical research
├── data-model.md                    # Data entities
├── quickstart.md                    # Validation guide
├── IMPLEMENTATION_REPORT.md         # Implementation summary
├── TESTING_INSTRUCTIONS.md          # QA testing guide
├── FINAL_IMPLEMENTATION_REPORT.md   # Final completion report
├── checklists/
│   └── requirements.md              # Quality checklist
├── contracts/
│   └── api-*.md                     # API contracts
└── tests/
    ├── feature.test.ts              # Unit tests
    ├── integration.test.ts          # Integration tests
    └── ui.test.ts                   # UI tests
```

**No implementation-related files at project root** except:
- `package.json`, `tsconfig.json`, `jest.config.js` (config files)
- `README.md` (project overview)
- `src/`, `public/`, `dist/` (source code)

**Rationale**: 
- Keeps specs self-contained
- Easy to review complete feature
- Clear separation of concerns
- Easier to delete/archive old specs

---

## IX. Spec File Naming Convention

**MUST**:
- Implementation reports: `IMPLEMENTATION_REPORT.md` (in spec folder)
- Testing instructions: `TESTING_INSTRUCTIONS.md` (in spec folder)
- Status reports: `IMPLEMENTATION_STATUS.md` (in spec folder)
- Test files: `*.test.ts` (in spec/tests/ folder)
- Final report: `FINAL_IMPLEMENTATION_REPORT.md` (in spec folder)

---

