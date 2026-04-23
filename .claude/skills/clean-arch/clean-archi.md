# Clean Architecture — Angular 21

> Reference file for developing Angular 21 applications following Clean Architecture principles.

---

## Folder Structure

```
src/
└── app/
    ├── models/                          # All app types, separated by layer
    │   ├── domain/                      # Business entities — always present
    │   │   └── <feature>.model.ts
    │   ├── database/                    # Raw DTOs — only if the API requires transformation
    │   │   └── <feature>.db-model.ts
    │   └── view/                        # UI view models — only if the UI reformats data
    │       └── <feature>.view-model.ts
    │
    ├── stores/                  # Global state loaded in memory
    │   ├── session.store.ts
    │   └── exercise.store.ts
    │
    ├── primary_adapters/        # UI components
    │   └── <feature>/
    │       ├── <feature>.component.ts
    │       ├── <feature>.component.html
    │       └── <feature>.component.scss
    │
    ├── primary_ports/           # Use cases (entry point per feature)
    │   └── <feature>/
    │       └── <feature>.usecase.ts
    │
    ├── core_logic/              # Central business logic (TypeScript only)
    │   └── <feature>/
    │       └── <feature>.service.ts
    │
    ├── secondary_ports/         # Repositories (interfaces + implementations)
    │   └── <feature>/
    │       ├── <feature>.repository.interface.ts
    │       └── <feature>.repository.ts
    │
    └── secondary_adapters/      # Mapping / data transformation
        └── <feature>/
            └── <feature>.mapper.ts
```

---

## Role of Each Layer

### `primary_adapters` — UI Components
- Pure Angular components, with no business logic.
- Only call **use cases** (`primary_ports`).
- Handle only display and user interactions.
- Use `input()` / `output()` (Angular 17+ signals).

```ts
// primary_adapters/todo/todo-list.component.ts
@Component({ /* ... */ })
export class TodoListComponent {
  private readonly getTodosUseCase = inject(GetTodosUseCase);
  todos = this.getTodosUseCase.todos;

  load() { this.getTodosUseCase.execute(); }
}
```

---

### `primary_ports` — Use Cases
- Injectable Angular services, **one use case = one business action**.
- Entry point of the logic for a feature.
- Orchestrate calls to **`core_logic` services**.
- Do not contain direct business logic.

```ts
// primary_ports/todo/get-todos.usecase.ts
@Injectable({ providedIn: 'root' })
export class GetTodosUseCase {
  private readonly todoService = inject(TodoService);
  todos = this.todoService.todos;

  execute() { this.todoService.loadAll(); }
}
```

---

### `core_logic` — Business Services
- Contains **all application logic**.
- Has no knowledge of the UI or data sources.
- Uses **repositories** (`secondary_ports`) via dependency injection.
- Manages state with Angular **Signals**.

```ts
// core_logic/todo/todo.service.ts
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly repo = inject(TODO_REPOSITORY);
  todos = signal<Todo[]>([]);

  async loadAll() {
    const data = await this.repo.getAll();
    this.todos.set(data);
  }
}
```

---

### `secondary_ports` — Repositories
- TypeScript interface defining the data contract.
- Concrete implementation (HTTP, localStorage, mock…).
- Provides raw data to `core_logic`.
- Use an **InjectionToken** for dependency inversion.

```ts
// secondary_ports/todo/todo.repository.interface.ts
export interface ITodoRepository {
  getAll(): Promise<Todo[]>;
  save(todo: Todo): Promise<void>;
}

export const TODO_REPOSITORY = new InjectionToken<ITodoRepository>('TODO_REPOSITORY');

// secondary_ports/todo/todo.repository.ts
@Injectable({ providedIn: 'root' })
export class TodoRepository implements ITodoRepository {
  private readonly http = inject(HttpClient);
  private readonly mapper = inject(TodoMapper);

  async getAll(): Promise<Todo[]> {
    const raw = await firstValueFrom(this.http.get<RawTodo[]>('/api/todos'));
    return raw.map(this.mapper.toDomain);
  }
}
```

---

### `secondary_adapters` — Mappers
- Transform **raw data** (API, DB) into **domain models**.
- Isolate API contract changes from the rest of the app.
- Can also perform the reverse transformation (domain → DTO).

```ts
// secondary_adapters/todo/todo.mapper.ts
import { TodoDbModel } from '../../models/database/todo.db-model';
import { Todo } from '../../models/domain/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoMapper {
  toDomain(raw: TodoDbModel): Todo {
    return { id: raw._id, title: raw.label.trim(), done: raw.completed };
  }
  toDbModel(todo: Todo): TodoDbModel {
    return { _id: todo.id, label: todo.title, completed: todo.done };
  }
}
```

---

### `models/` — Two Type Layers (+ optional database)

#### Decision Rule

| Does the API return exactly what you need? | → Use `models/domain/` directly, no mapper needed |
|---|---|
| Does the API return a different format (snake_case, string instead of Date, renamed fields…) | → Create a `models/database/` + a mapper |

#### `models/domain/` — Business Entities *(always present)*
- Source of truth for the entire app: `core_logic`, `stores`, `secondary_ports`, `primary_ports`.
- Also serves as the direct return type from the repository when there is no transformation.

```ts
// models/domain/exercise.model.ts — API compatible, no db-model needed
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

// models/domain/session.model.ts — API incompatible, a db-model will exist alongside
export interface Session {
  id: string;
  date: Date;             // the API returns an ISO string → transformation required
  exerciseIds: string[];
}
```

#### `models/database/` — Raw DTOs *(only if transformation is needed)*
- Created **only** when the API returns a format different from the domain model.
- Only used in **mappers** (`secondary_adapters`), never elsewhere.

```ts
// models/database/session.db-model.ts — created because date is a string on the API side
export interface SessionDbModel {
  _id: string;
  created_at: string;       // ISO string → will be converted to Date in the mapper
  exercise_ids: string[];
}

// No exercise.db-model.ts — the API already returns the correct format
```

#### `models/view/` — View Models *(only if the UI needs a different format from the domain)*
- Created when a component needs computed or reformatted data for display.
- Produced in use cases (`primary_ports`), consumed only by components.

```ts
// models/view/session.view-model.ts
export interface SessionViewModel {
  id: string;
  dateLabel: string;        // e.g.: "Monday, April 21" — computed from Session.date
  exerciseCount: number;    // computed from Session.exerciseIds.length
}

// No exercise.view-model.ts — the component uses Exercise directly
```

---

### `stores/` — Stores (in-memory state)
- Injectable Angular services that **store loaded app data in memory**.
- One store per functional domain (e.g.: `SessionStore`, `ExerciseStore`).
- Expose data via **Signals** and provide read methods.
- Fed by `core_logic` services after loading from repositories.
- Contain no business logic, only state and accessors.

```ts
// stores/session.store.ts
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _sessions = signal<Session[]>([]);

  readonly sessions = this._sessions.asReadonly();

  getById(id: string): Session | undefined {
    return this._sessions().find(s => s.id === id);
  }

  setAll(sessions: Session[]): void {
    this._sessions.set(sessions);
  }

  add(session: Session): void {
    this._sessions.update(list => [...list, session]);
  }
}
```

```ts
// stores/exercise.store.ts
@Injectable({ providedIn: 'root' })
export class ExerciseStore {
  private readonly _exercises = signal<Exercise[]>([]);

  readonly exercises = this._exercises.asReadonly();

  getById(id: string): Exercise | undefined {
    return this._exercises().find(e => e.id === id);
  }

  setAll(exercises: Exercise[]): void {
    this._exercises.set(exercises);
  }
}
```

> Stores are **injected into use cases or `core_logic` services**, never directly into UI components.

---

## Data Flow

```
UI (primary_adapters)                    ← uses models/view/
  │  calls
  ▼
Use Case (primary_ports)                 ← produces view models, uses models/domain/
  │  orchestrates
  ▼
Business Service (core_logic)            ← uses models/domain/
  │  uses the interface
  ▼
Repository (secondary_ports)             ← uses models/domain/
  │  returns raw data → mapped by
  ▼
Mapper (secondary_adapters)              ← converts models/database/ → models/domain/ (and reverse)
  │  returns domain model
  ▼
core_logic (feeds the Store)
  │
  ▼
Store (stores/)  ←  global in-memory state via Signals  [models/domain/]
  │  read by
  ▼
Use Case / core_logic (read without re-fetch)
  │  maps to view model if needed
  ▼
UI (automatic re-render via Signals)     [models/view/]
```

---

## Applied SOLID Principles

| Principle | Application |
|---|---|
| **S** — Single Responsibility | Each class has a unique role (mapper, use case, service…) |
| **O** — Open/Closed | Adding a feature = new folder, not modifying existing code |
| **L** — Liskov Substitution | Repositories are interchangeable via their interface |
| **I** — Interface Segregation | Thin repository interfaces, per feature |
| **D** — Dependency Inversion | `core_logic` depends on interfaces, not concrete implementations |

---

## Angular 21 Best Practices

### Signals (reactive state)
- Prefer `signal()`, `computed()`, `effect()` over RxJS for local and global state.
- RxJS remains relevant for HTTP streams and complex events.

### Components
- **Standalone components** only (no NgModules).
- `ChangeDetectionStrategy.OnPush` systematically.
- `input()` / `output()` instead of `@Input` / `@Output`.
- **Dumb** components: receive data, emit events.
- **Always separate** the template, styles, and class into three distinct files (`.html`, `.scss`, `.ts`). Never use inline `template` or `styles` in the `@Component` decorator.

### Internationalization (i18n)
- **All texts** displayed in the UI must be externalized in `src/assets/i18n/en.json`.
- Use the **`translate` pipe** in HTML templates: `{{ 'key' | translate }}`.
- Use the **`TranslateService`** in TypeScript files when needed.
- Do not add translations to other language files (they will be generated automatically).
- Keys must be organized by feature: `{ "featureName": { "keyName": "Text value" } }`.

### Dependency Injection
- Use `inject()` in the constructor or as a class property.
- `InjectionToken` for interfaces and configurations.
- `providedIn: 'root'` for global services, otherwise scoped to the component.

### Performance
- `NgOptimizedImage` for all images.
- Lazy loading of routes per feature.
- `trackBy` in lists (`@for (item of items; track item.id)`).

### Naming Conventions
```
<feature>.component.ts
<feature>.usecase.ts
<feature>.service.ts
<feature>.repository.ts
<feature>.repository.interface.ts
<feature>.mapper.ts
<feature>.store.ts

models/domain/<feature>.model.ts          ← business entities — always present
models/database/<feature>.db-model.ts    ← raw DTOs — only if the API requires transformation
models/view/<feature>.view-model.ts      ← UI view models — only if the UI reformats data
```

---

## The Golden Rule

> A layer **never** knows the layers above it.  
> `core_logic` does not know the UI exists.  
> `secondary_ports` does not know `core_logic` exists.  
> Dependencies always point **toward the center**.
