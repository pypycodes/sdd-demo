# Feature Specification: [FEATURE NAME]

**Feature Branch**: `feature/[###-feature-name]`

**Spec Number**: [###]

**Created**: [DATE]

**Status**: Draft

**Input**: [Feature description from user]

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - [Primary Story] (Priority: P1)

[Story description]

**Why this priority**: [Justification]

**Independent Test**: [How to test independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected result]
2. **Given** [initial state], **When** [action], **Then** [expected result]

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: [Requirement with testable acceptance criteria]
- **FR-002**: [Requirement with testable acceptance criteria]

### Key Entities *(include if feature involves data)*
- **Entity Name**: [Fields and constraints]

---

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: [Specific, measurable success metric]
- **SC-002**: [Technology-agnostic outcome]

---

## Testing Requirements *(CRITICAL - MUST INCLUDE)*

### Test Coverage Requirement
- **Minimum Coverage**: 85% or higher (line, branch, function, statement)
- **Command to Verify**: `npm test -- --coverage`
- **Acceptance**: All metrics must show ≥ 85%

### Test Strategy
- **Unit Tests**: Business logic, utilities, data transformations
- **Integration Tests**: API endpoints, database operations, external service calls
- **E2E/Manual Tests**: User workflows, edge cases, error scenarios
- **Security Tests**: Data isolation, authorization, input validation (if applicable)

### Tests to Write
- [ ] Unit test 1: [description]
- [ ] Unit test 2: [description]
- [ ] Integration test 1: [description]
- [ ] Integration test 2: [description]
- [ ] E2E/Manual test 1: [description]

### Test Completion Criteria
- ✅ All unit tests pass: `npm test`
- ✅ All integration tests pass: `npm test`
- ✅ Coverage report shows ≥ 85%: `npm test -- --coverage`
- ✅ No test skips or TODOs in test code
- ✅ Manual tests documented and passing

---

## Assumptions

[Assumptions made during spec creation]

---

## Open Questions / Needs Clarification

[Any ambiguities or decisions needed]

---

## Acceptance Tests (BDD Scenarios)

```gherkin
Feature: [Feature Name]

  Background:
    Given [common setup]

  Scenario: [User Story 1 - Primary flow]
    Given [initial state]
    When [user action]
    Then [expected result]

  Scenario: [Edge case or error state]
    Given [initial state]
    When [action that triggers edge case]
    Then [expected handling]
```

---

## Definition of Done

- [ ] Spec approved by stakeholder
- [ ] Code implemented
- [ ] All unit tests pass (`npm test`)
- [ ] All integration tests pass
- [ ] Test coverage ≥ 85% (`npm test -- --coverage`)
- [ ] Code reviewed and approved
- [ ] BDD scenarios passing
- [ ] Documentation updated
- [ ] Ready for deployment

---

**NOTE**: Features are NOT marked as "complete" or "ready for testing" until code tests pass and coverage is ≥ 85%.

---

## File Organization

**ALL spec-related files for this feature are located in: `specs/[###]-[feature-name]/`**

### Spec Folder Contents
```
specs/[###]-[feature-name]/
├── spec.md                      # This specification
├── plan.md                      # Implementation plan (after planning phase)
├── tasks.md                     # Task breakdown (after task generation)
├── research.md                  # Technical research (after planning)
├── data-model.md                # Data model documentation
├── quickstart.md                # Testing validation guide
├── TESTING_INSTRUCTIONS.md      # QA testing procedures
├── IMPLEMENTATION_REPORT.md     # Implementation status and summary
├── FINAL_IMPLEMENTATION_REPORT.md # Final completion report
├── checklists/                  # Quality checklists
│   └── requirements.md
├── contracts/                   # API and data contracts
│   └── *.md
└── tests/                       # Test files
    ├── *.test.ts
    └── *.test.ts
```

### Important
- **DO NOT create implementation files at project root**
- All tests belong in `spec/tests/` folder
- All documentation stays in spec folder
- This keeps each spec self-contained and portable

---

