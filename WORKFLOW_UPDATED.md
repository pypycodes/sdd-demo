# Updated Workflow - Spec Structure Best Practice

**Commit**: `83d5964`  
**Date**: 2026-07-08  
**Status**: ✅ Implemented

---

## What Changed

### Before (Not Optimal)
```
specs/
└── 001-Provider-Message-Notification-Bubble/
    └── spec.md

.features/
└── provider-message-notification.feature  (SEPARATE!)
```

### After (Recommended ⭐)
```
specs/
└── 001-Provider-Message-Notification-Bubble/
    ├── spec.md                    (Requirements & user stories)
    ├── acceptance.feature         (BDD scenarios - CO-LOCATED)
    ├── plan.md                    (To be created)
    └── tasks.md                   (To be created)

.features/                          (ONLY cross-cutting scenarios)
├── healthcare-safety.feature
├── type-safety.feature
├── api-responses.feature
└── testing-standards.feature
```

---

## Benefits of New Structure

✅ **Single Source of Truth**: Spec and acceptance tests together  
✅ **Clear Traceability**: spec.md → acceptance.feature → implementation  
✅ **Easy Maintenance**: No sync issues between spec and tests  
✅ **Better Onboarding**: Everything a developer needs is in one place  
✅ **Version Control**: Spec and tests committed together  
✅ **Scalability**: .features/ stays clean as more specs are created  

---

## Updated Workflow for Creating Features

### Phase 1: SPECIFY
```bash
# 1. Create spec directory
mkdir -p specs/001-Feature-Name

# 2. Create spec.md (requirements, user stories, functional requirements)
# Template: .specify/templates/spec-template.md
touch specs/001-Feature-Name/spec.md

# 3. Create acceptance.feature (BDD scenarios in Gherkin format)
# Co-located with spec.md in the same directory
touch specs/001-Feature-Name/acceptance.feature
```

**Spec Structure**:
- User stories with priority (P1, P2, P3)
- Functional requirements (FR-001, FR-002, etc.)
- Success criteria
- Edge cases
- Assumptions
- Link to acceptance.feature

**Acceptance Feature Structure**:
- Feature description (from spec)
- Scenarios for each user story
- Given/When/Then format
- Organized by user story priority
- Traceability to spec requirements

---

### Phase 2: PLAN (Architecture & Design)
```bash
# Create plan.md in the spec directory
touch specs/001-Feature-Name/plan.md
```

**Contents**:
- Architecture decisions
- Design approach
- Technology choices
- Integration points
- Risk assessment
- Resource estimates

---

### Phase 3: TASK (Implementation Breakdown)
```bash
# Create tasks.md in the spec directory
touch specs/001-Feature-Name/tasks.md
```

**Contents**:
- Implementation tasks (numbered, sequential)
- Task dependencies
- Effort estimates
- Assignment (optional)
- Acceptance criteria per task
- Links to acceptance.feature scenarios

---

### Phase 4: TEST (Unit & Integration Tests)
```bash
# Optional: Create tests directory for complex features
mkdir -p specs/001-Feature-Name/tests
touch specs/001-Feature-Name/tests/feature.test.ts
```

**Contents**:
- Unit tests for business logic
- Integration tests for APIs
- Mock data and fixtures
- All tests in one place with the feature

---

### Phase 5: IMPLEMENT (Write Code)
```bash
# Create feature branch from spec number
git checkout -b feature/001-feature-name

# Implement code to satisfy acceptance.feature scenarios
# Tests should verify acceptance.feature passes

# Commit with spec reference
git commit -m "feat(spec-001): implement feature name

- Implement user story 1 (P1)
- Implement user story 2 (P2)
- All acceptance scenarios passing"
```

---

## .features/ Directory Purpose (Revised)

**ONLY for constitution-level, cross-cutting governance scenarios**:

```
.features/
├── healthcare-safety.feature          (Principle I)
│   └── Scenarios applying to ALL features
│       - PHI/PII protection
│       - Clinical safety
│       - Error messages
│
├── type-safety.feature                (Principle II)
│   └── Scenarios applying to ALL features
│       - No 'any' types
│       - Immutability
│       - Coverage ≥85%
│
├── api-responses.feature              (Principle VI)
│   └── Scenarios applying to ALL features
│       - JSON structure
│       - Error handling
│       - Accessibility
│
└── testing-standards.feature
    └── Scenarios applying to ALL features
        - Pre-commit hooks
        - Coverage enforcement
        - BDD documentation
```

These are **NOT feature-specific** but apply system-wide.

---

## Complete Spec Directory Structure

```
specs/
├── 001-Provider-Message-Notification-Bubble/
│   ├── spec.md                    (Requirements - 1.0)
│   ├── acceptance.feature         (BDD - 12 scenarios)
│   ├── plan.md                    (Architecture - TO CREATE)
│   ├── tasks.md                   (Tasks - TO CREATE)
│   ├── tests/                     (Optional)
│   │   └── notification.test.ts
│   └── README.md                  (Optional: Quick reference)
│
├── 002-Feature-Name/
│   ├── spec.md
│   ├── acceptance.feature
│   ├── plan.md
│   ├── tasks.md
│   └── tests/
│
└── 003-Another-Feature/
    └── ...
```

---

## Traceability Path

From idea to implementation:

```
1. User Request
   ↓
2. spec.md - Define what to build
   ├─ User Story 1 (P1)
   ├─ User Story 2 (P2)
   └─ Functional Requirements (FR-001, FR-002, ...)
   ↓
3. acceptance.feature - Define how to verify
   ├─ Scenario for User Story 1
   ├─ Scenario for User Story 2
   └─ Edge case scenarios
   ↓
4. plan.md - Design the solution
   ├─ Architecture decisions
   ├─ Technology choices
   └─ Integration points
   ↓
5. tasks.md - Break into implementation work
   ├─ Task 1 (Frontend)
   ├─ Task 2 (Backend)
   └─ Task 3 (Testing)
   ↓
6. Implementation - Write code
   ├─ Feature branch (feature/001-...)
   ├─ Code changes
   ├─ Unit tests
   └─ Verify acceptance.feature passes
   ↓
7. Commit - Link to spec
   ├─ Commit message: feat(spec-001): ...
   ├─ All artifacts versioned together
   └─ Done ✅
```

---

## Git Workflow

### Creating a new feature:
```bash
# 1. Create spec
mkdir -p specs/001-Feature-Name
# Create spec.md and acceptance.feature
git add specs/001-Feature-Name/
git commit -m "feat(spec-001): add feature specification

- User stories (P1, P2, P3)
- 10+ functional requirements
- 12 BDD acceptance scenarios
- Success criteria and edge cases"

# 2. Create plan
# Create plan.md
git add specs/001-Feature-Name/plan.md
git commit -m "plan(spec-001): add architecture and design

- Design decisions
- Technology approach
- Integration points"

# 3. Create tasks
# Create tasks.md
git add specs/001-Feature-Name/tasks.md
git commit -m "task(spec-001): add implementation tasks

- Task breakdown
- Dependencies
- Effort estimates"

# 4. Implement feature
git checkout -b feature/001-feature-name
# Make code changes
git commit -m "feat(spec-001): implement feature

- User story 1 implementation
- Acceptance scenarios passing"
git push

# 5. Merge
git checkout main
git merge feature/001-feature-name
```

---

## Constitutional Alignment

This new structure implements constitution requirements:

| Principle | Implementation |
|-----------|-----------------|
| **I. Healthcare Safety** | Spec defines safety requirements, acceptance.feature verifies them |
| **II. Type Safety** | Acceptance.feature includes type safety scenarios |
| **V. Observability** | Spec includes logging/monitoring requirements |
| **VI. Accessibility** | Acceptance.feature has accessibility scenarios (keyboard, screen reader) |
| **Development Workflow** | Spec numbering (001, 002...), BDD documentation in acceptance.feature |

---

## Benefits Summary

| Aspect | Old Way | New Way |
|--------|---------|---------|
| **Finding tests** | Search .features/ | Check specs/001-Feature/ |
| **Updating spec** | Update spec.md + .features/file | Update both in same commit |
| **Onboarding** | "Read spec and find tests" | "Read specs/001-Feature/" |
| **Maintenance** | Easy to lose sync | Single source of truth |
| **Scalability** | .features/ becomes cluttered | Each feature self-contained |
| **Version control** | May commit separately | One atomic commit |

---

## Next Steps

1. ✅ Create spec.md for 001
2. ✅ Create acceptance.feature for 001
3. ⏳ Create plan.md for 001
4. ⏳ Create tasks.md for 001
5. ⏳ Implement feature on branch

---

**Status**: ✅ New workflow implemented  
**Commit**: `83d5964`  
**Ready to use for all future specs**
