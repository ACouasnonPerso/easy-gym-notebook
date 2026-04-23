---
name: tdd-testing-patterns
description: Test patterns, doubles, fixtures, and assertions for Angular Clean Architecture
---

# Skill: TDD Testing Patterns

## Test Naming

`should [outcome] when [condition]`

## Test Doubles

```
Gateway (Observable API)  → Fake (in-memory, returns of(...))
Randomness / ID gen       → Stub (controllable via public property)
Side effects (alert, log) → Spy (vi.spyOn)
Domain types / reducers   → Real objects — never mock
```

No mocking frameworks. Hand-written doubles only.

## Fake (Gateway)

```typescript
export class FakeQuestionGateway implements QuestionGateway {
  question: Question | null = null;
  correctAnswer: string | undefined = undefined;

  submitAnswer(answer: string): Observable<boolean> {
    if (typeof this.correctAnswer === 'undefined')
      throw new Error('correctAnswer must be set before calling submitAnswer');
    return of(this.correctAnswer === answer);
  }

  loadQuestion(): Observable<Question> {
    return of(this.question!);
  }
}
```

## Stub (Controllable dependency)

```typescript
export class StubQuestionPicker implements QuestionPicker {
  nextQuestionId: Question['id'] | null = null;

  pickQuestion(questionsPool: QuestionsPool): Observable<Question> {
    if (this.nextQuestionId === null)
      throw new Error('nextQuestionId is not set');
    return of(questionsPool[this.nextQuestionId]);
  }
}
```

## Spy

```typescript
vi.spyOn(window, 'alert').mockImplementation(() => {});
expect(window.alert).toHaveBeenCalledWith('Game Over!');
```

## `configureAppTest()` Helper

```typescript
// game/test-utils.ts
export const configureAppTest = (gateways: Gateways, imports: any[] = []) => {
  TestBed.configureTestingModule({
    imports,
    providers: [...makeAppConfig({ provide: 'QUESTION_GATEWAY', useValue: gateways.questionGateway }).providers],
  }).compileComponents();

  return { _store: TestBed.inject(GameStore), _dispatcher: TestBed.inject(Dispatcher) };
};

// Unit test usage
const { _store, _dispatcher } = configureAppTest({ questionGateway: new FakeQuestionGateway() });

// Component test usage
configureAppTest({ questionGateway }, [GameComponent]);
fixture = TestBed.createComponent(GameComponent);
```

## Assertions

**Signals (store state):**
```typescript
dispatcher.dispatch(gameEvents.answerSubmitted({ answer: 'A', isCorrect: true }));
expect(store.pyramid().currentLevel).toBe(1);
```

**Observable to Promise:**
```typescript
const question = await lastValueFrom(questionGateway.loadQuestion());
expect(question).toEqual(expectedQuestion);
```

**Parameterized:**
```typescript
it.each`
  questionId | expectedQuestion
  ${'1'}     | ${aQuestion}
  ${'2'}     | ${{ ...aQuestion, id: '2' }}
`('should retrieve question $questionId', async ({ questionId, expectedQuestion }) => {
  questionPicker.nextQuestionId = questionId;
  expect(await lastValueFrom(questionGateway.loadQuestion())).toEqual(expectedQuestion);
});
```

## Fixtures

Inline object literals — no Object Mother or Builder:
```typescript
const aQuestion: Question = {
  id: '1', label: 'What does DDD stand for?',
  possibleAnswers: { A: 'Domain-Driven Design', B: 'Data-Driven', C: 'Database-Driven', D: 'Document-Driven' },
};
const anotherQuestion = { ...aQuestion, id: '2', label: 'What is TDD?' };
```
