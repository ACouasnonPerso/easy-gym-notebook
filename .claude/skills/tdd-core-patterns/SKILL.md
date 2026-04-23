---
name: tdd-core-patterns
description: Strategic testing philosophy for application core (hexagon) - sociable tests, outside-in TDD, store/effects/presenters
---

# Skill: TDD Core Patterns

## Philosophy

**Sociable tests, outside-in, wishful thinking first.**
- SUT: real store + real reducers + real effects together — fake only gateways
- Start from store/effect level with business scenarios — let domain types emerge
- Never start with reducers in isolation before understanding behavior

## Test Categories

### Primary: Store + Reducers + Effects
**Location:** `core-logic/<feature>/`
**Setup:** `configureAppTest()` + event dispatch + signal assertions
**Why:** Validates complete event chains — dispatch → effect → gateway → reducer → state

### Secondary: Presenters
**Location:** `adapters/drivers/presenters/`
**Strategy:** Direct function call — no Angular infrastructure needed

### Not tested directly: Domain types (Question, Pyramid)
Validated through store/effect tests. Reduces over-specification.

## Example A: Reducer Test

```typescript
describe('Game Store - Pyramid update via events', () => {
  let gameStore: InstanceType<typeof GameStore>;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    const { _store, _dispatcher } = configureAppTest({ questionGateway: new FakeQuestionGateway() });
    gameStore = _store;
    dispatcher = _dispatcher;
  });

  it('should be reset when the game starts', () => {
    expect(gameStore.pyramid().currentLevel).toBe(0);
  });

  it('should increase the level when the answer is correct', () => {
    dispatcher.dispatch(gameEvents.answerSubmitted({ answer: 'A', isCorrect: true }));
    expect(gameStore.pyramid().currentLevel).toBe(1);
  });

  it('having reached a step, should go back to it when wrong', () => {
    gameStore.setPyramid({ currentLevel: 0, steps: [1] });
    dispatcher.dispatch(gameEvents.answerSubmitted({ answer: 'A', isCorrect: true }));
    dispatcher.dispatch(gameEvents.answerSubmitted({ answer: 'B', isCorrect: false }));
    expect(gameStore.pyramid().currentLevel).toBe(1);
  });
});
```

## Example B: Effect Test

```typescript
it('should retrieve question when game starts', () => {
  const testQuestion: Question = {
    id: '1', label: 'What is 2+2?',
    possibleAnswers: { A: 'Three', B: 'Four', C: 'Five', D: 'Six' },
  };
  questionGateway.question = testQuestion;
  dispatcher.dispatch(gameEvents.gameStarted());
  expect(store.currentQuestion()).toEqual(testQuestion);
});
```

## Example C: Presenter Test

```typescript
it('the game has just started, pyramid is reset', () => {
  expect(selectPyramidVM({ '0': false }, { currentLevel: 0, steps: [] }))
    .toEqual([{ level: '0', levelIndex: 1, isStep: false, current: true }]);
});

it('the pyramid has increased by one', () => {
  const structure = { '0': false, '10': false };
  expect(selectPyramidVM(structure, { currentLevel: 1, steps: [] })).toEqual([
    { level: '10', levelIndex: 2, isStep: false, current: true },
    { level: '0', levelIndex: 1, isStep: false, current: false },
  ]);
  expect(structure).toEqual({ '0': false, '10': false }); // immutability check
});
```

## Test Organization

```
game/
├── core-logic/
│   ├── store/game.store.ts
│   ├── pyramid-update/updatePyramid.spec.ts              # PRIMARY
│   ├── question-retrieval/retrieveQuestion.effect.spec.ts # PRIMARY
│   └── gateways/questionGateway.ts                       # Port (interface)
├── adapters/
│   ├── drivers/presenters/selectPyramidVM.spec.ts        # SECONDARY
│   └── driven/gateways/fakes/fakeQuestionGateway.ts
└── test-utils.ts
```
