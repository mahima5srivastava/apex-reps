---
name: verify-qa
description: "Black-box QA verification. Agent runs the app (Playwright CLI, browser, curl) and executes user workflows from the outside. Verifies functionality works as intended. Fourth step: plan-feature → implement-task → review-code → verify-qa → maintain-context. Reads handoff.json + review.md, outputs qa-report.md. No test code writing — interactive verification."
---

# Verify QA Skill

## Purpose

**Black-box QA verification** — test the application from the outside like a real QA engineer. **Fourth step** in workflow. Runs the app, executes user workflows, verifies API, checks database. No test code writing.

**Human-Readable Output:** QA reports use clear workflow tables, plain-language observations, severity-ranked bugs, and cross-verification matrices. No raw logs or machine formats. A human can triage findings in minutes.

## When to Use

- After `review-code` approves (review.md exists with APPROVED)
- Before `maintain-context` (final docs update)
- When implementation is complete and code-reviewed

## Workflow Position

```
plan-feature → implement-task → review-code → verify-qa → maintain-context
     │              │               │            │              │
   plan.md      code + tests    reviews      qa-report.md  updates
   created      passing gates   code,        created       AGENTS.md,
   tasks        (unit/integ)    outputs      verify-qa     workspace/
   defined      self-reviewed   review.md    executes      from
   decisions    done            (APPROVED)   workflows     handoff.json
                                    │
                              review.md
                              (APPROVED)
```

## Inputs (Read)

- `review.md` — approval decision, known non-blocking issues
- `handoff.json` — scope.in (what to test), scope.out (what to skip), acceptance criteria
- AGENTS.md — dev commands, test users, environment config

**Never reads:** `plan.md`, `REQUIREMENTS.md` — only `handoff.json` is canonical.

## Anti-Loop Guardrails

| Guardrail           | Rule                                                          |
| ------------------- | ------------------------------------------------------------- |
| **Single pass**     | Execute workflows once, document findings                     |
| **No code changes** | verify-qa NEVER modifies code                                 |
| **Bugs → issues**   | Failed workflows → GitHub issues, not code fixes              |
| **Exit criteria**   | All critical workflows PASS → qa-report.md → maintain-context |
| **Timebox**         | 60 min per feature                                            |

### Supporting Schemas (Local)

| Schema | Purpose |
| ------ | ------- |
| `./schemas/handoff.schema.json` | Validates handoff.json structure |
| `./schemas/decision_request.schema.json` | Validates decision requests |

**Definition of QA Pass:**

```
✅ All critical workflows PASS (from handoff.json scope.in)
✅ API endpoints return correct status/shape
✅ RLS policies enforced
✅ Database state matches UI/API
✅ No blocking bugs (critical/major severity)
```

Minor UX issues → follow-up issues, don't block.

---

## Fast-Fail Configuration (Required)

**Playwright config for QA (test mode):**

```typescript
// playwright.config.ts (or inline)
export default {
  // ...
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
  // Fast-fail settings
  retries: 0,
  timeout: 30000, // not 120000
  // Disable Vite error overlay
  env: {
    VITE_CONFIG_NATIVE_IGNORE_WARNING: "true",
  },
};
```

**Runtime error detection:**

```typescript
// In test setup or first test
test.beforeEach(async ({ page }) => {
  // Catch console errors immediately
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      throw new Error(`Console error: ${msg.text()}`);
    }
  });
  
  // Catch unhandled page errors
  page.on("pageerror", (err) => {
    throw err;
  });
  
  // Catch failed requests
  page.on("response", (response) => {
    if (response.status() >= 500) {
      throw new Error(`Server error ${response.status()}: ${response.url()}`);
    }
  });
});
```

---

## QA Engineer Workflow

```
1. START ENVIRONMENT
   ├─ Start database (supabase start / docker compose up)
   ├─ Seed test data (run SQL from handoff.json, call seed API)
   ├─ Start dev server (pnpm dev)
   └─ Verify server responds (curl http://localhost:3000)

2. EXECUTE WORKFLOWS (Black-Box — from handoff.json scope.in)
   ├─ Open browser → navigate as user
   ├─ Follow happy path (login → feature → verify)
   ├─ Follow edge cases (empty state, errors, boundaries)
   ├─ Test permissions (coach vs mentee, auth vs unauth)
   └─ Test API directly (curl POST/GET/PATCH/DELETE)

3. VERIFY EXPECTATIONS
   ├─ UI: elements visible, data correct, navigation works
   ├─ API: status codes, response shape, data integrity
   ├─ State: database reflects changes, RLS enforced
   └─ Cross-check: UI matches API matches DB

4. DOCUMENT FINDINGS → qa-report.md
   ├─ Pass/Fail/Skipped per workflow
   ├─ Screenshots/recordings for failures
   ├─ Steps to reproduce bugs
   └─ Update ai-workspace/changes/<id>/qa-report.md
```

---

## Tools: Playwright CLI (Interactive Mode)

### Start Interactive Session

```bash
# Option 1: Playwright Codegen (records your actions)
npx playwright codegen http://localhost:3000

# Option 2: Playwright REPL (interactive commands)
npx playwright open http://localhost:3000

# Option 3: Headed mode with pause (for debugging)
npx playwright test --headed --debug
```

### Useful Interactive Commands

```bash
# In Playwright REPL or codegen:
await page.goto('/login')
await page.fill('input[name="email"]', 'test@example.com')
await page.fill('input[name="password"]', 'testpassword123')
await page.click('button[type="submit"]')
await page.waitForURL('/')

# Take screenshot
await page.screenshot({ path: 'qa-login-success.png', fullPage: true })

# Get text content
const text = await page.locator('h2').textContent()
console.log(text)

# Check network
await page.waitForResponse('**/api/food-items**')
```

---

## Tools: curl / HTTP Client (API Testing)

### Auth Flow

```bash
# 1. Login (Supabase Auth)
curl -X POST 'http://localhost:54321/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Response: { "access_token": "...", "refresh_token": "...", ... }

# 2. Use token for authenticated requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get profile
curl -X GET 'http://localhost:54321/rest/v1/profiles?id=eq.<user-id>' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H "Authorization: Bearer $TOKEN"

# Create food item (coach only)
curl -X POST 'http://localhost:54321/rest/v1/food_items' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"name":"Test Food","calories_per_100g":100,"protein_g_per_100g":10,"carbs_g_per_100g":5,"fat_g_per_100g":2,"fiber_g_per_100g":1,"source":"custom"}'

# Search food items
curl -X GET 'http://localhost:54321/rest/v1/food_items?name=ilike.*chicken*&select=*' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H "Authorization: Bearer $TOKEN"
```

### Test RLS (Critical)

```bash
# As mentee — should ONLY see own data
curl -X GET 'http://localhost:54321/rest/v1/diet_plans?mentee_id=eq.<mentee-id>' \
  -H "Authorization: Bearer $MENTEE_TOKEN"

# As coach — should see mentee's plans
curl -X GET 'http://localhost:54321/rest/v1/diet_plans?coach_id=eq.<coach-id>' \
  -H "Authorization: Bearer $COACH_TOKEN"

# Cross-tenant — should FAIL (403 or empty)
curl -X GET 'http://localhost:54321/rest/v1/diet_plans?mentee_id=eq.<other-mentee-id>' \
  -H "Authorization: Bearer $MENTEE_TOKEN"
```

---

## Core Workflows to Verify (From handoff.json scope.in)

### Auth Workflows

| Workflow         | Steps                             | Expected                       |
| ---------------- | --------------------------------- | ------------------------------ |
| Login happy path | Open /login → fill creds → submit | Redirect to /, welcome message |
| Invalid creds    | Wrong password                    | Error toast, stay on /login    |
| Protected route  | Visit / without auth              | Redirect to /login             |
| Session persist  | Login → refresh → visit /         | Still logged in                |
| Logout           | Click logout → visit /            | Redirect to /login             |

### Diet Plan: Coach Workflows

| Workflow         | Steps                                                                     | Expected                               |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| List mentees     | Login as coach → /coach/diet-plans                                        | Cards for each mentee with active plan |
| Create plan      | Click "Create Plan" → fill form → add meals → add foods via search → save | Plan appears in list, mentee can view  |
| Edit plan        | Click "Edit" → modify meals/items → save                                  | Changes reflected                      |
| Search foods     | Type in food selector → see autocomplete results                          | USDA + custom foods appear             |
| Add custom food  | Click "Add Custom" → fill macros → save → search again                    | New food appears in results            |
| View mentee logs | Click "View Logs" for date                                                | See consumed checkboxes, notes         |

### Diet Plan: Mentee Workflows

| Workflow       | Steps                                        | Expected                         |
| -------------- | -------------------------------------------- | -------------------------------- |
| View today     | Login as mentee → /diet-plan                 | Progress bars show 0/planned     |
| Check off item | Click checkbox on food item                  | Bar updates incrementally        |
| Navigate dates | Click prev/next day                          | Correct plan loads for that date |
| Add notes      | Type in notes textarea → blur                | Note persists on reload          |
| Offline mode   | Disconnect network → check items → reconnect | Changes sync, no data loss       |

### Check-in Workflows (Existing)

| Workflow      | Steps                                                        | Expected                                         |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Full check-in | /check-in → fill 4 measurements → upload left photo → submit | Toast success, redirect to /, new stat in charts |
| Validation    | Submit without left photo                                    | Error, cannot submit                             |
| Photo compare | Dashboard → select earlier date                              | Two photos side by side                          |

---

## Verification Checklist (Per Workflow)

### UI Verification

- [ ] Page loads without console errors
- [ ] Expected elements visible (headings, inputs, buttons)
- [ ] Data displays correctly (names, numbers, dates)
- [ ] Interactions work (click, type, select, navigate)
- [ ] Loading states show during async operations
- [ ] Error states show user-friendly messages
- [ ] Empty states show helpful guidance
- [ ] Responsive on mobile viewport

### API Verification

- [ ] Status code correct (200, 201, 400, 401, 403, 404, 500)
- [ ] Response shape matches expected schema
- [ ] Data integrity (FKs valid, calculated fields correct)
- [ ] RLS enforced (403 or filtered for unauthorized)
- [ ] Rate limits / pagination work

### Database Verification

```bash
# Check actual DB state
supabase db shell
# Or: psql postgresql://postgres:postgres@localhost:54322/postgres

# Verify inserts
SELECT * FROM diet_plans WHERE mentee_id = '<id>';
SELECT * FROM diet_plan_logs WHERE mentee_id = '<id>' AND log_date = '2026-01-15';
SELECT * FROM food_items WHERE source = 'custom' AND created_by = '<coach-id>';
```

### Cross-Verification

| Source           | Should Match                         |
| ---------------- | ------------------------------------ |
| UI progress bars | Sum of checked items in API response |
| API response     | Database records                     |
| Coach view       | Mentee's actual data                 |
| Offline cache    | Server state after sync              |

---

## QA Report Output (Required)

**Location:** `ai-workspace/changes/<issue-id>-<slug>/qa-report.md`

**Format:**

```markdown
# QA Report: <Issue Title>

**Date:** <ISO timestamp>
**Environment:** local dev (supabase + pnpm dev)
**Test User:** test@example.com (mentee) / coach@example.com (coach)
**Commit:** <sha>
**Review:** review.md (APPROVED)

---

## Workflows Tested

### Coach: Create Diet Plan

**Status:** PASS / FAIL
**Steps:**

1. Login as coach
2. Navigate to /coach/diet-plans
3. Click "Create Plan"
4. Select mentee "Test Mentee"
5. Fill: name="Test Plan", start=2026-01-15, end=2026-01-21
6. Add meal "Breakfast" → search "chicken" → select "Chicken breast, raw" → 150g
7. Add meal "Lunch" → search "rice" → select "White rice, raw" → 200g
8. Save

**Observations:**

- Food search returned 5 results in <200ms ✅
- Macros auto-calculated correctly (150g chicken = 247 cal, 46.5g protein) ✅
- Plan appears in list with status "Active" ✅
- Mentee can view plan at /diet-plan ✅

**Screenshots:** qa-coach-create-plan.png

---

### Mentee: Track Consumption

**Status:** PASS / FAIL
**Steps:**

1. Login as mentee
2. Navigate to /diet-plan (today 2026-01-15)
3. Verify progress bars: Calories 0/647, Protein 0/56.5, Carbs 0/46, Fat 0/14.2, Fiber 0/2.6
4. Check "Chicken breast, raw - 150g" checkbox
5. Verify bars update: Calories 247/647, Protein 46.5/56.5, ...
6. Navigate to 2026-01-16 → verify different plan loads
7. Add notes "Felt good today" → blur → reload → note persists

**Observations:**

- Progress bars animate smoothly ✅
- Date navigation preserves scroll position ❌ (minor UX)
- Notes auto-save works ✅

**Screenshots:** qa-mentee-tracking.png

---

## API Tests (curl)

| Endpoint                | Method | Auth   | Status | Response Valid | Notes               |
| ----------------------- | ------ | ------ | ------ | -------------- | ------------------- |
| /rest/v1/food_items     | GET    | mentee | 200    | ✅             | 156 items returned  |
| /rest/v1/food_items     | POST   | mentee | 403    | ✅             | RLS blocks insert   |
| /rest/v1/food_items     | POST   | coach  | 201    | ✅             | Custom food created |
| /rest/v1/diet_plans     | GET    | mentee | 200    | ✅             | Only own plans      |
| /rest/v1/diet_plan_logs | PATCH  | mentee | 200    | ✅             | Consumed toggled    |

---

## RLS Verification

| Policy                      | Test                | Result    |
| --------------------------- | ------------------- | --------- |
| food_items coach insert     | POST as mentee      | 403 ✅    |
| diet_plans mentee select    | GET as other mentee | 0 rows ✅ |
| diet_plan_logs coach read   | GET as coach        | 200 ✅    |
| diet_plan_notes mentee CRUD | POST/PATCH as coach | 403 ✅    |

---

## Outcome Verification

| Criterion                          | Status   |
| ---------------------------------- | -------- |
| All acceptance criteria (scope.in) | PASS/FAIL |
| Zero console errors in test run    | PASS/FAIL |
| Zero TypeScript errors             | PASS/FAIL |
| Build succeeds                     | PASS/FAIL |
| Manual workflow (if testable)      | PASS/FAIL/SKIPPED |

---

## Bugs Found

| ID      | Severity | Workflow    | Steps to Reproduce | Expected          | Actual                  |
| ------- | -------- | ----------- | ------------------ | ----------------- | ----------------------- |
| BUG-001 | Medium   | Date nav    | Click next day     | Scroll to top     | Stays scrolled          |
| BUG-002 | Low      | Food search | Type "chic"        | "Chicken" results | No results until "cken" |

---

## Skipped Workflows (from scope.out)

| Workflow          | Reason                          |
| ----------------- | ------------------------------- |
| Mentee offline sync | Not user-facing (API only), verified via unit tests |

---

## Non-Blocking Issues from review-code

| Issue # | Category       | Status               |
| ------- | -------------- | -------------------- |
| #123    | N2 Performance | Logged, not verified |
| #124    | N5 DRY         | Logged, not verified |

---

## Summary

- **Workflows tested:** 8
- **Passed:** 7
- **Failed:** 1 (minor UX)
- **Skipped:** 1 (not in scope)
- **API endpoints verified:** 12
- **RLS policies verified:** 8
- **Blocking issues:** 0
- **Follow-up issues:** 2 (#BUG-001, #BUG-002)

**Overall:** READY FOR MERGE (with follow-up issues)
```

---

## Agent Usage Pattern

```
User: "QA verify the Diet Plan feature (issue #4)"

Agent:
1. READS: review.md (APPROVED), handoff.json (scope, acceptance criteria)
2. STARTS ENV: supabase start → pnpm dev → wait for ready
3. SEEDS DATA: runs SQL for test coach + mentee users
4. OPENS BROWSER: npx playwright codegen http://localhost:3000
5. EXECUTES WORKFLOWS (from handoff.json scope.in):
   - Coach login → create plan → verify
   - Mentee login → view plan → check items → verify bars
   - Date nav → notes → verify persistence
   - Offline test → disconnect → check items → reconnect → verify sync
6. TESTS API: curl commands for each endpoint + RLS
7. CHECKS DB: supabase db shell → verify records
8. CROSS-VERIFIES: UI bars = API sums = DB records
9. WRITES QA REPORT: ai-workspace/changes/4-food-database-selector/qa-report.md
10. REPORTS: "QA complete. 7/8 workflows pass. 1 minor UX issue. 2 follow-up issues. Ready for maintain-context."
```

---

## Handoff to maintain-context

**maintain-context reads:**

- `qa-report.md` — final verification status
- `handoff.json` — what was implemented, decisions
- `review.md` — code quality approval

**maintain-context does:**

- Updates AGENTS.md quick refs (stores, commands, gotchas)
- Updates ai-workspace/ domain docs (tables, RLS, relationships)
- Archives change folder

---

## Key Difference: QA vs Test Automation

| QA Engineer (This Skill)       | Test Automation                |
| ------------------------------ | ------------------------------ |
| Runs app, clicks like user     | Writes code that clicks        |
| Explores edge cases manually   | Encodes known paths            |
| Verifies "does it feel right?" | Verifies "does it match spec?" |
| Finds unknown bugs             | Prevents known regressions     |
| Output: qa-report.md           | Output: test-results.xml       |
| **Complements** automation     | **Complements** QA             |

---

## Adapting to Your Project

1. Copy to `.agents/skills/verify-qa/SKILL.md`
2. Configure in AGENTS.md:
   - Dev server command + port
   - Database startup command
   - Test user credentials (or seed script reference)
   - API base URL + auth method
   - Key workflows for your domain
3. Add to ai-workspace/changes/README.md:
   - QA report template reference