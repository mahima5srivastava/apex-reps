# Changes Folder

Each planned change gets its own folder under `ai-workspace/changes/` with the format:

```
<issue-id>-<short-kebab-slug>/
├── plan.md           # Implementation plan (from implementation-planning skill)
├── decisions.md      # Decision records (optional, for complex choices)
└── notes.md          # Scratchpad, research, links (optional)
```

## Naming Convention

| Issue Source     | Folder Name Example              |
| ---------------- | -------------------------------- |
| GitHub #4        | `4-food-database-selector`       |
| Jira APEX-123    | `apex-123-coach-plan-management` |
| Internal "story" | `story-4-mentee-daily-view`      |

## Lifecycle

1. **Plan created** → `plan.md` written via implementation-planning skill
2. **User reviews** → decisions recorded in `decisions.md` if needed
3. **Approved** → implementation begins (tests first)
4. **In progress** → update `plan.md` task checkboxes
5. **Done** → folder kept for history/reference

## Template (plan.md)

See `.agents/skills/implementation-planning/SKILL.md` → "Step 7: Output Plan"
