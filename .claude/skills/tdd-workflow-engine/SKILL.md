---
name: tdd-workflow-engine
description: Core TDD state machine and enforcement rules shared by tdd and tdd-auto agents
---

# Skill: TDD Workflow Engine

**Shared foundation** for the `tdd` and `tdd-auto` agents. Contains the TDD Sequence, TPP, Violation Handling, Test Type Detection, and Over-Implementation Prevention rules. Each agent defines its own state machine and gate behavior on top of this engine.

## The TDD Sequence

This is the single authoritative reference for test-first discipline. All enforcement
rules, violation handlers, and per-test-type phases reference this section.

**ABSOLUTE RULE: In each RED phase, the test file is the FIRST file you Write or Edit.
No production file may be created or modified before the test file is saved.
This is non-negotiable — even if you know what classes you will need.**

1. WRITE THE TEST using wishful thinking — call classes/methods that do not exist.
   The test defines the API.
   - Use the Write or Edit tool to save the test file NOW.
   - Do NOT pre-create any production class, interface, or file "to avoid compilation errors."
   - Compilation errors are expected — they are step 2.

2. RUN THE TEST. It will fail with compilation/import errors. This is expected.

3. SCAFFOLD — create the minimum stubs to fix compilation errors:
   - Empty classes, methods returning undefined/null, bare interfaces.
   - No business logic. No constructor parameters beyond what the compiler demands.
   - This step exists ONLY to move from compilation errors to assertion failure.

4. RUN THE TEST AGAIN. It must now fail on an assertion (behavioral failure).
   This is valid RED.

One test per RED phase. Each test drives one transformation step (see TPP below).

## Transformation Priority Premise (GREEN Phase)

Apply Uncle Bob's TPP: as tests get more specific, code gets more generic — but only when forced by a failing test.

| Priority | Transformation | Description |
|----------|---------------|-------------|
| 1 | {} → nil | No code → return nothing |
| 2 | nil → constant | Return a hard-coded value |
| 3 | constant → variable | Replace constant with variable/parameter |
| 4 | unconditional → conditional | Add if/else branching |
| 5 | scalar → collection | Single value → array/list |
| 6 | statement → recursion | Simple statement → recursive call |
| 7 | selection → iteration | Conditional → loop |
| 8 | value → mutated value | Transform existing value |

**Rules:**
- Always prefer higher-priority transformations
- Do NOT jump to loops, recursion, or collections until a test forces you there
- First test → return a constant. Second test → add a conditional. Third test reveals a pattern → use iteration.
- If you write a loop on the first test, you are violating TPP — step back.

## Over-Implementation Prevention (GREEN Phase)

**The golden question before every line of code:** "Does this make the failing test pass?"

- Only implement what makes the failing test pass — stop immediately when it passes
- If design mentions X but test doesn't assert X, DON'T implement X
- NEVER add defensive code, getters/setters, or enums unless driven by a failing test

**Enum TDD Discipline Example:**
```typescript
// WRONG - Over-implementing enum values
it('should default to INDIVIDUAL status when no explicit status and training is not apprenticeship', () => {
    // Test only asserts INDIVIDUAL status
    expect(trainee.status).toBe(TraineeStatus.INDIVIDUAL);
});

// WRONG enum - too many values
enum TraineeStatus {
    INDIVIDUAL = 'INDIVIDUAL',     // Test demands this
    APPRENTICE = 'APPRENTICE',     // No test demands this yet
    JOB_SEEKER = 'JOB_SEEKER',    // No test demands this yet
    PRIVATE_EMPLOYEE = 'PRIVATE_EMPLOYEE', // No test demands this yet
    OTHER = 'OTHER'                // No test demands this yet
}

// CORRECT - Only test-demanded enum value
enum TraineeStatus {
    INDIVIDUAL = 'INDIVIDUAL'   // Only this - test asserts it
}

// Evolution: Add enum values only when new tests demand them
// Next test: should default to APPRENTICE when training is apprenticeship
// THEN add: APPRENTICE
```

**Store Over-Implementation Example:**

```typescript
// WRONG - Implementing store features not tested
it('should increase the level when the answer is correct', () => {
    dispatcher.dispatch(gameEvents.answerSubmitted({ answer: 'A', isCorrect: true }));
    expect(gameStore.pyramid().currentLevel).toBe(1);
    // Test doesn't assert currentQuestion or lastAnswerSubmitted!
});

// Don't implement computed signals, extra state fields, or effect handlers
// if no test demands them:
// - isGameOver computed
// - lastAnswerSubmitted state
// - retrieveQuestion effect
// - currentQuestion clearing logic

// CORRECT - Only what the test demands
on(gameEvents.answerSubmitted, (event, state) => {
    return {
        ...state,
        pyramid: updatePyramidReducer(state.pyramid, event.payload.isCorrect),
        // Don't add: currentQuestion: null (no test asserts this yet)
        // Don't add: lastAnswerSubmitted: event.payload (no test asserts this yet)
    };
}),
```

## Violation Handling

### V0: Creating Code Before Test (ZERO TOLERANCE)

Before every Write or Edit call during RED phase, verify:
"Is the file I'm about to write/edit a test file?"
If NO and no test file has been written yet in this RED phase → STOP. Write the test first.

### V0b: Multiple Tests in a Single RED Phase

**Detection:** More than one `it(...)` block written during a single RED_PHASE.

**Action:** STOP → keep only the first test (next in TPP progression) → DELETE all others → continue RED_PHASE.

### V1: Class/Method Not Found During RED

**Precondition:** Test has already been written (otherwise this is V0).

**Action:** Create minimal scaffold (empty class/method returning undefined/null) → re-run test → continue until behavioral failure.

### V2: Premature Implementation

**Detection:** Production logic written before RED_PHASE achieves behavioral failure.

**Action:** Remove production code → restore scaffold state → re-run to achieve RED.

### V3: Stopping During RED_PHASE

**Detection:** Asking "Should I continue?" or waiting mid-RED.

**Action:** Continue execution without waiting. Complete the full RED phase.

### V4: Test Passes in RED Phase (BLOCKING)

**Detection:** Test passes without implementation — the assertion is likely too weak.

**Action:**
1. Present a **BLOCKING** warning: show the exact assertion that passed and suggest a stronger alternative
2. **STOP & WAIT** for user decision (both `tdd` and `tdd-auto` agents pause here)
3. If user says "continue anyway" / "go green anyway" → proceed (skip implementation since test passes)
4. If user provides a refinement → update the test, re-run, attempt behavioral failure
5. Default: stay in RED_PHASE and wait for user decision

## Test Type Detection

### Detection Algorithm (Priority Order)

**1. Explicit Prefix (Highest Priority)**

| Prefix | Test Type |
|--------|-----------|
| `unit:` | Unit Test |
| `component:` | Component Integration Test |
| `integration:` | Integration Test |

**2. Component Integration Indicators:** component, ui, dom, click, render, display, user interaction, template, fixture, data-testid, nativeElement, debugElement

**3. Integration Indicators:** http gateway, HttpClient, real gateway, local pool, adapter implementation, interceptor, HttpTestingController

**4. Default:** Unit test (store/reducers/effects/presenters/core logic)

**Override:** If user responds with "actually use [unit/component/integration]", switch immediately.

### Phase Execution by Test Type

Once the test type is detected, **read the corresponding skill file before proceeding**:

| Test type | File to read |
|---|---|
| Unit tests (store/effects/presenters) | `skills/tdd-core-patterns/SKILL.md` |
| Component integration tests | `skills/tdd-component-integration-patterns/SKILL.md` |
| Integration tests (HTTP gateway, adapter) | `skills/tdd-integration-patterns/SKILL.md` |

All types follow The TDD Sequence. The skill file provides type-specific scaffolding and implementation patterns for the current cycle only.

## Enforcement Rules

| Rule | Description |
|------|-------------|
| **RULE 0** | The TDD Sequence (above) must be followed — test before production code |
| **RULE 4** | Test must fail behaviorally (assertion failure) — if it passes, V4 applies |
| **RULE 5** | Test type patterns must be followed (Component = DOM only, etc.) |
| **RULE 6** | Scaffold creation happens only after test is written (TDD Sequence step 3) |

Agent-specific rules (gate behavior, pausing) are defined in each agent's own file.

## Agent Memory

After each CYCLE_COMPLETE, record concise key-value entries for:

- **Naming conventions** observed (file names, class names, test names)
- **Fake adapters** discovered (class name + file path)
- **Stub/Spy doubles** found (class name + file path)
- **Feature module structure** insights (which module owns what)
- **TDD violations** encountered and how they were resolved

Keep entries terse. Prioritize information that accelerates future TDD cycles.

## Error Recovery

If a test run fails due to infrastructure issues (Vitest crash, TestBed configuration error, Angular DI resolution failure):

1. Do NOT treat the failure as behavioral failure (RED). Infrastructure errors are not assertion failures.
2. Diagnose: check error output for stack traces, DI resolution errors (`NullInjectorError`), or missing provider indicators.
3. If transient (file lock, compilation cache): retry the test run once.
4. If persistent: report the infrastructure error to the user and STOP. Do not attempt to fix infrastructure configuration autonomously.
5. The TDD state does not change — remain in whichever phase you were in before the failure.
