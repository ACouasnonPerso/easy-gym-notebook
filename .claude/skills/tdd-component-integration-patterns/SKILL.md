---
name: tdd-component-integration-patterns
description: Component integration testing patterns for Angular with DOM-boundary black-box testing
---

# Skill: TDD Component Integration Patterns

## Core Rule: DOM Boundary Only

```
Tests interact ONLY via DOM. NO direct store/dispatcher access in assertions.
Store/dispatcher allowed only in test SETUP (Given phase).
```

| Allowed | Forbidden |
|---------|-----------|
| `fixture.debugElement.query(By.css('[data-testid="x"]')).nativeElement.click()` | `dispatcher.dispatch(...)` in When phase |
| `expect(element.textContent).toContain(...)` | `expect(store.signal()).toBe(...)` |
| `expect(element.classList.contains('cls')).toBe(true)` | Direct store manipulation in assertions |
| `questionGateway.question = aQuestion` (Given phase) | Bypassing component event flow |

## Setup

```typescript
beforeEach(() => {
  const questionGateway = new FakeQuestionGateway();
  configureAppTest({ questionGateway }, [GameComponent]);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  questionGateway.question = aQuestion;
  questionGateway.correctAnswer = 'A';
  fixture = TestBed.createComponent(GameComponent);
  fixture.componentRef.setInput('pyramidStructure', { '0': false, '20': false, '30': false });
  fixture.detectChanges();
});
```

Fresh state per test — never share `questionGateway` or `fixture` across tests.

## DOM Interaction Patterns

```typescript
// Click
fixture.debugElement.query(By.css('[data-testid="answer-A"]')).nativeElement.click();
await fixture.whenStable();
fixture.detectChanges();

// Text
expect(fixture.debugElement.query(By.css('[data-testid="question-zone"]')).nativeElement.textContent)
  .toContain('Expected text');

// Element existence
expect(fixture.debugElement.query(By.css('[data-testid="x"]'))).toBeTruthy();
expect(fixture.debugElement.query(By.css('[data-testid="x"]'))).toBeNull();

// CSS class
const el = fixture.debugElement.query(By.css('[data-testid="prize-20"]')).nativeElement;
['tf1-led-glow', 'text-white', 'font-bold'].forEach(cls => expect(el.classList.contains(cls)).toBe(true));

// Component input
fixture.componentRef.setInput('pyramidStructure', { '0': false });
fixture.detectChanges();
```

## Test Helper Structure

```typescript
describe('Game Component', () => {
  // Given — setup preconditions
  const givenGameIsLaunched = () => {
    fixture = TestBed.createComponent(GameComponent);
    fixture.componentRef.setInput('pyramidStructure', { '0': false, '20': false });
    fixture.detectChanges();
  };

  // When — DOM interactions only
  const whenAnsweringTheQuestion = async (answer: string) => {
    fixture.debugElement.query(By.css(`[data-testid="answer-${answer}"]`)).nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  // Then — DOM assertions only
  const thenExpectCurrentLevel = (level: number) => {
    const el = fixture.debugElement.query(By.css(`[data-testid="prize-${level}"]`)).nativeElement;
    expect(el.classList.contains('tf1-led-glow')).toBe(true);
  };

  it('should highlight the next pyramid level after correct answer', async () => {
    await whenAnsweringTheQuestion('A');
    thenExpectCurrentLevel(20);
  });
});
```

## Scaffold Pattern (RED phase)

Create the DOM element (fixes query errors) with no content (behavioral failure):

```typescript
@Component({
  selector: 'app-game',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div data-testid="countdown-timer"></div>`,
})
export class GameComponent {}
```
