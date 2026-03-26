# Clean Architecture — Angular 21

> Fichier de référence pour le développement d'applications Angular 21 selon les principes de la Clean Architecture.

---

## Structure des dossiers

```
src/
└── app/
    ├── models.ts                # Toutes les entités et view models de l'app
    │
    ├── stores/                  # State global chargé en mémoire
    │   ├── session.store.ts
    │   └── exercise.store.ts
    │
    ├── primary_adapters/        # Composants UI
    │   └── <feature>/
    │       ├── <feature>.component.ts
    │       ├── <feature>.component.html
    │       └── <feature>.component.scss
    │
    ├── primary_ports/           # Use cases (point d'entrée par feature)
    │   └── <feature>/
    │       └── <feature>.usecase.ts
    │
    ├── core_logic/              # Logique métier centrale
    │   └── <feature>/
    │       └── <feature>.service.ts
    │
    ├── secondary_ports/         # Repositories (interfaces + implémentations)
    │   └── <feature>/
    │       ├── <feature>.repository.interface.ts
    │       └── <feature>.repository.ts
    │
    └── secondary_adapters/      # Mapping / transformation de données
        └── <feature>/
            └── <feature>.mapper.ts
```

---

## Rôle de chaque couche

### `primary_adapters` — Composants UI
- Composants Angular purs, sans logique métier.
- Appellent uniquement les **use cases** (`primary_ports`).
- Gèrent uniquement l'affichage et les interactions utilisateur.
- Utilisent `input()` / `output()` (signals Angular 17+).

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
- Services Angular injectables, **un use case = une action métier**.
- Point d'entrée de la logique pour une feature.
- Orchestrent les appels aux **services de `core_logic`**.
- Ne contiennent pas de logique métier directe.

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

### `core_logic` — Services métier
- Contient **toute la logique applicative**.
- N'a aucune connaissance de l'UI ni des sources de données.
- Utilise les **repositories** (`secondary_ports`) via injection de dépendance.
- Gère l'état avec des **Signals** Angular.

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
- Interface TypeScript définissant le contrat de données.
- Implémentation concrète (HTTP, localStorage, mock…).
- Fournit les données brutes au `core_logic`.
- Utiliser un **InjectionToken** pour l'inversion de dépendance.

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
- Transforment les **données brutes** (API, DB) en **modèles du domaine**.
- Isolent les changements de contrat API du reste de l'app.
- Peuvent aussi faire la transformation inverse (domaine → DTO).

```ts
// secondary_adapters/todo/todo.mapper.ts
@Injectable({ providedIn: 'root' })
export class TodoMapper {
  toDomain(raw: RawTodo): Todo {
    return { id: raw.id, title: raw.title.trim(), done: raw.completed };
  }
  toDto(todo: Todo): RawTodo {
    return { id: todo.id, title: todo.title, completed: todo.done };
  }
}
```

---

### `models.ts` — Entités et View Models
- Fichier unique centralisant **toutes les interfaces** du domaine et les view models.
- Pas de logique, uniquement des types TypeScript.
- Importé par toutes les couches qui en ont besoin.

```ts
// models.ts

// --- Entités domaine ---
export interface Session {
  id: string;
  date: Date;
  exerciseIds: string[];
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

// --- View Models (UI) ---
export interface SessionViewModel {
  id: string;
  dateLabel: string;
  exerciseCount: number;
}
```

---

### `stores/` — Stores (state en mémoire)
- Services Angular injectables qui **stockent en mémoire les données chargées** de l'app.
- Un store par domaine fonctionnel (ex : `SessionStore`, `ExerciseStore`).
- Exposent les données via des **Signals** et fournissent des méthodes de lecture.
- Alimentés par les services `core_logic` après chargement depuis les repositories.
- Ne contiennent pas de logique métier, uniquement du state et des accesseurs.

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

> Les stores sont **injectés dans les use cases ou les services `core_logic`**, jamais directement dans les composants UI.

---

## Flux de données

```
UI (primary_adapters)
  │  appelle
  ▼
Use Case (primary_ports)
  │  orchestre
  ▼
Service métier (core_logic)
  │  utilise l'interface
  ▼
Repository (secondary_ports)
  │  retourne données brutes → mappées par
  ▼
Mapper (secondary_adapters)
  │  retourne modèle domaine (types définis dans models.ts)
  ▼
core_logic (alimente le Store)
  │
  ▼
Store (stores/)  ←  state global en mémoire via Signals
  │  lu par
  ▼
Use Case / core_logic (lecture sans re-fetch)
  │
  ▼
UI (re-render automatique via Signals)
```

---

## Principes SOLID appliqués

| Principe | Application |
|---|---|
| **S** — Single Responsibility | Chaque classe a un rôle unique (mapper, use case, service…) |
| **O** — Open/Closed | Ajouter une feature = nouveau dossier, pas modifier l'existant |
| **L** — Liskov Substitution | Les repositories sont interchangeables via leur interface |
| **I** — Interface Segregation | Interfaces de repository fines, par feature |
| **D** — Dependency Inversion | `core_logic` dépend d'interfaces, pas d'implémentations concrètes |

---

## Bonnes pratiques Angular 21

### Signals (état réactif)
- Préférer `signal()`, `computed()`, `effect()` à RxJS pour l'état local et global.
- RxJS reste pertinent pour les flux HTTP et les événements complexes.

### Composants
- **Standalone components** uniquement (pas de NgModules).
- `ChangeDetectionStrategy.OnPush` systématiquement.
- `input()` / `output()` à la place de `@Input` / `@Output`.
- Composants **dumb** : reçoivent des données, émettent des événements.
- **Toujours séparer** le template, les styles et la classe en trois fichiers distincts (`.html`, `.scss`, `.ts`). Ne jamais utiliser `template` ou `styles` inline dans le décorateur `@Component`.

### Injection de dépendances
- Utiliser `inject()` dans le constructeur ou en propriété de classe.
- `InjectionToken` pour les interfaces et configurations.
- `providedIn: 'root'` pour les services globaux, sinon scope au composant.

### Performance
- `NgOptimizedImage` pour toutes les images.
- Lazy loading des routes par feature.
- `trackBy` dans les listes (`@for (item of items; track item.id)`).

### Conventions de nommage
```
<feature>.component.ts
<feature>.usecase.ts
<feature>.service.ts
<feature>.repository.ts
<feature>.repository.interface.ts
<feature>.mapper.ts
<feature>.model.ts       ← interfaces/types du domaine
<feature>.store.ts       ← state global chargé en mémoire
models.ts                ← toutes les entités et view models de l'app
```

---

## Règle d'or

> Une couche ne connaît **jamais** les couches au-dessus d'elle.  
> `core_logic` ne sait pas que l'UI existe.  
> `secondary_ports` ne sait pas que `core_logic` existe.  
> Les dépendances vont **toujours vers le centre**.
