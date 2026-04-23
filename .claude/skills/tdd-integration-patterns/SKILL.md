---
name: tdd-integration-patterns
description: Integration testing patterns for Angular secondary adapter implementations (HTTP gateways, local pool adapters)
---

# Skill: TDD Integration Patterns

Tests validate **secondary adapter implementations** against real dependencies — not business logic.

## Primary Targets

| Adapter | Test Focus |
|---------|------------|
| HTTP Gateway (`HttpQuestionGateway`) | HTTP method, URL, request/response mapping |
| Local Pool (`LocalPoolQuestionGateway`) | Pool consumption, answer validation, picker delegation |
| Randomness (`RandomQuestionPicker`) | Statistical diversity |

Not for: store reducers, effect orchestration, component rendering, presenter logic.

## HTTP Gateway Pattern

```typescript
describe('HttpQuestionGateway', () => {
  let gateway: HttpQuestionGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpQuestionGateway, provideHttpClient(), provideHttpClientTesting()],
    });
    gateway = TestBed.inject(HttpQuestionGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should load a question via GET', () => {
    gateway.loadQuestion().subscribe(q => expect(q).toEqual(expectedQuestion));
    const req = http.expectOne('https://my-backend/api/question');
    expect(req.request.method).toBe('GET');
    req.flush(expectedQuestion);
  });

  it('should submit an answer via POST', () => {
    gateway.submitAnswer('A').subscribe(ok => expect(ok).toBe(true));
    const req = http.expectOne('https://my-backend/api/submit-answer');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ answer: 'A' });
    req.flush(true);
  });
});
```

## Local Pool Pattern

```typescript
beforeEach(() => {
  questionsPool = { '1': aQuestion, '2': { ...aQuestion, id: '2' } };
  answersPool = { '1': 'A', '2': 'B' };
  questionPicker = new StubQuestionPicker();
  questionGateway = new LocalPoolQuestionGateway(questionsPool, answersPool, questionPicker);
});

it('should retrieve a question from the local pool', async () => {
  questionPicker.nextQuestionId = '1';
  expect(await lastValueFrom(questionGateway.loadQuestion())).toEqual(aQuestion);
});

it('should remove used question from pool and throw when empty', async () => {
  questionPicker.nextQuestionId = '1';
  await lastValueFrom(questionGateway.loadQuestion());
  expect(questionsPool).toEqual({ '2': { ...aQuestion, id: '2' } });
  questionPicker.nextQuestionId = '2';
  await lastValueFrom(questionGateway.loadQuestion());
  expect(() => questionGateway.loadQuestion()).toThrow('Questions pool empty!');
});

it('should validate answer against answer pool', async () => {
  questionPicker.nextQuestionId = '1';
  await lastValueFrom(questionGateway.loadQuestion());
  expect(await lastValueFrom(questionGateway.submitAnswer('A'))).toBe(true);
});
```

## Randomness Pattern

```typescript
it('should not return the same question every time', () => {
  const picker = new RandomQuestionPicker();
  const questions: string[] = [];
  for (let i = 0; i < 50; i++)
    picker.pickQuestion(questionsPool).subscribe(q => questions.push(q.id));
  expect(new Set(questions).size).toBeGreaterThan(1);
});
```

## Test Organization

```
adapters/driven/gateways/
├── http/
│   ├── httpQuestionGateway.ts
│   └── httpQuestionGateway.spec.ts         # HttpTestingController
└── local-pool/
    ├── localPoolQuestionGateway.ts
    ├── localPoolQuestionGateway.spec.ts     # real pools + stub picker
    ├── randomQuestionPicker.ts
    ├── randomQuestionPicker.spec.ts         # statistical verification
    └── stubQuestionPicker.ts
```

## Rules

- Use real adapter implementation — never `FakeQuestionGateway` in integration tests
- Fresh state per test (`beforeEach` creates new pool/gateway instances)
- Test adapter contract (method, URL, mapping) — not business logic
