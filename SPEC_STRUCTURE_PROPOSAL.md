# Spec Structure Best Practice - Proposal

## Current Structure (Not Optimal)
```
specs/
└── 001-Provider-Message-Notification-Bubble/
    └── spec.md

.features/
└── provider-message-notification.feature  (SEPARATE!)
```

## ⭐ RECOMMENDED STRUCTURE (Option 1)

```
specs/
└── 001-Provider-Message-Notification-Bubble/
    ├── spec.md                    (Requirements & user stories)
    ├── acceptance.feature         (BDD scenarios - CO-LOCATED)
    ├── plan.md                    (Architecture & design)
    ├── tasks.md                   (Implementation tasks)
    └── tests/                     (Optional: Test code)
        └── notification.test.ts
```

## Benefits

✅ Single source of truth
✅ Spec → Acceptance → BDD clear path
✅ Easy to maintain together
✅ Better for new team members
✅ Version controlled as one unit
✅ No sync issues between spec and tests

## Revised .features/ Purpose

Keep ONLY cross-cutting scenarios:

```
.features/
├── healthcare-safety.feature      (Constitution-level)
├── type-safety.feature            (Constitution-level)
├── api-responses.feature          (Constitution-level)
└── testing-standards.feature      (Constitution-level)
```

These apply to **ALL features** system-wide.

## Refactoring Steps

1. Move provider-message-notification.feature to spec directory
2. Rename to acceptance.feature
3. Delete from .features/
4. Update spec.md to reference it
5. Update constitution & templates
6. Update BDD runner config

## Traceability Path

```
spec.md
  ├─ User Story 1
  │   └─ Acceptance Scenario 1 (in acceptance.feature)
  ├─ User Story 2
  │   └─ Acceptance Scenario 2 (in acceptance.feature)
  └─ FR-001 (Functional Requirement)
      └─ Verified by acceptance.feature scenarios
```

Ready to implement? ✅
