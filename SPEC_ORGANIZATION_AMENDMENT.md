# 📋 Spec Organization Amendment - Effective Immediately

**Date**: 2026-07-09  
**Status**: IMPLEMENTED & ENFORCED  

---

## 🎯 Amendment Summary

**All spec-related files MUST remain together in the spec folder. No implementation files at project root.**

---

## ✅ What Changed

### Before (Incorrect)
```
Project Root/
├── IMPLEMENTATION_COMPLETE.md
├── CORRECTED_IMPLEMENTATION.md
├── IMPLEMENTATION_SUMMARY.md
├── TESTING_INSTRUCTIONS.md
├── FINAL_IMPLEMENTATION_REPORT.md
├── specs/
│   └── 002-Care-Team-Tab/
│       └── spec.md
```

### After (Correct) ✅
```
Project Root/
├── specs/
│   └── 002-Care-Team-Tab/
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md
│       ├── README.md
│       ├── TESTING_INSTRUCTIONS.md
│       ├── IMPLEMENTATION_REPORT.md
│       ├── IMPLEMENTATION_STATUS.md
│       ├── CORRECTED_IMPLEMENTATION.md
│       ├── FINAL_IMPLEMENTATION_REPORT.md
│       ├── checklists/
│       │   └── requirements.md
│       ├── contracts/
│       │   └── api-get-patient.md
│       └── tests/
│           ├── care-team.test.ts
│           ├── api-integration.test.ts
│           └── care-team-ui.test.ts
```

---

## 📝 Updated Documents

### Constitution (`.specify/memory/constitution.md`)
- ✅ Added Section VIII: Spec Organization & File Structure
- ✅ Added Section IX: Spec File Naming Convention
- ✅ Enforces all spec files stay together

### Spec Template (`.specify/templates/spec-template.md`)
- ✅ Added "File Organization" section
- ✅ Documents proper folder structure
- ✅ Prevents scattered files

---

## 📁 Spec 002 Organization Completed

**spec/002-Care-Team-Tab/ now contains**:
- ✅ spec.md
- ✅ plan.md
- ✅ tasks.md
- ✅ research.md
- ✅ data-model.md
- ✅ quickstart.md
- ✅ README.md
- ✅ TESTING_INSTRUCTIONS.md
- ✅ IMPLEMENTATION_REPORT.md
- ✅ IMPLEMENTATION_STATUS.md
- ✅ CORRECTED_IMPLEMENTATION.md
- ✅ FINAL_IMPLEMENTATION_REPORT.md
- ✅ checklists/requirements.md
- ✅ contracts/api-get-patient.md
- ✅ tests/care-team.test.ts
- ✅ tests/api-integration.test.ts
- ✅ tests/care-team-ui.test.ts

---

## 🚀 Future Specs Must Follow This Structure

For all new specs (003, 004, etc.):

```
specs/NNN-Feature-Name/
├── spec.md                      (REQUIRED)
├── plan.md                      (After planning)
├── tasks.md                     (After task generation)
├── research.md                  (After research)
├── data-model.md                (Optional, if needed)
├── quickstart.md                (Optional, validation guide)
├── README.md                    (Summary of spec)
├── TESTING_INSTRUCTIONS.md      (QA testing procedures)
├── IMPLEMENTATION_REPORT.md     (Implementation summary)
├── FINAL_IMPLEMENTATION_REPORT.md (Final completion)
├── checklists/
│   └── requirements.md          (Quality checklist)
├── contracts/
│   └── *.md                     (API/data contracts)
└── tests/
    ├── feature.test.ts          (Unit tests)
    └── integration.test.ts      (Integration tests)
```

---

## ✨ Benefits of This Organization

1. **Self-Contained Specs** - Everything for a feature in one folder
2. **Easy Review** - No files scattered across project
3. **Portability** - Can copy/archive entire spec folder
4. **Clarity** - Know exactly where to find spec-related files
5. **Maintenance** - Easy to update or delete old specs
6. **Collaboration** - Team knows where files belong

---

## 📋 Enforcement Rules

**MUST**:
- ✅ All spec files in `specs/NNN-feature-name/`
- ✅ Tests in `specs/NNN-feature-name/tests/`
- ✅ Documentation in spec folder
- ✅ Implementation reports in spec folder

**MUST NOT**:
- ❌ Implementation files at project root
- ❌ Test files outside spec folder
- ❌ Documentation scattered across project
- ❌ Spec-related files in src/, public/, or root

---

## ✅ Implementation Checklist

- ✅ Constitution updated with new sections VIII & IX
- ✅ Spec template updated with file organization rules
- ✅ Spec 002 fully organized with all files
- ✅ README.md created for spec 002
- ✅ Test files copied to spec/tests/ folder
- ✅ Implementation reports moved to spec folder
- ✅ Testing instructions moved to spec folder

---

## 🎯 Next Steps for Specs 001, 003+

### Spec 001 (Provider Message Notification Bubble)
- Should follow same organization
- Move/organize files as needed
- Create README.md
- Add any missing documentation

### Specs 003+
- Always create in spec folder structure
- Never create files at project root
- Always include tests/, checklists/, contracts/
- Always include TESTING_INSTRUCTIONS.md
- Always include IMPLEMENTATION_REPORT.md

---

## 📞 Questions?

Refer to:
- Constitution: `.specify/memory/constitution.md` (Sections VIII & IX)
- Template: `.specify/templates/spec-template.md` (File Organization section)
- Example: `specs/002-Care-Team-Tab/README.md`

---

**Amendment Status**: ✅ IMPLEMENTED & ENFORCED

**Effective Date**: 2026-07-09  
**Version**: 1.0  

All future specs must follow this organization structure.

