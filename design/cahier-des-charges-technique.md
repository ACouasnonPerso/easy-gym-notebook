# Cahier des Charges Technique — Easy Gym Notebook
*Version 1.0 — Mars 2026*

---

## 1. Architecture globale

### 1.1 Principes fondamentaux

L'application **Easy Gym Notebook** est développée en **Angular 21** en suivant les principes de la **Clean Architecture**. L'objectif est de séparer strictement les responsabilités afin de rendre le code testable, maintenable et évolutif.

**Règle d'or** : les dépendances vont toujours vers le centre. L'UI ne connaît que les use cases. Les services métier ne connaissent pas l'UI. Les repositories ne connaissent pas les services.

Aucun backend n'est utilisé. Toutes les données sont persistées dans le **localStorage** de la WebView Capacitor (équivalent au localStorage navigateur, accessible nativement sur iOS et Android).

---

### 1.2 Description des couches

#### `primary_adapters` — Composants UI
- Composants Angular standalone, **sans logique métier**.
- Appellent uniquement les **use cases** (`primary_ports`).
- Gèrent l'affichage et les interactions utilisateur (événements, rendu).
- Utilisent `input()` / `output()` (API Signals Angular 17+).
- `ChangeDetectionStrategy.OnPush` obligatoire sur tous les composants.

#### `primary_ports` — Use Cases
- Services Angular injectables (`@Injectable({ providedIn: 'root' })`).
- **Un use case = une action métier précise** (ex : `CreateSessionUseCase`).
- Point d'entrée de la logique pour chaque feature.
- Orchestrent les appels aux services `core_logic`.
- N'implémentent aucune logique métier directe.

#### `core_logic` — Services métier
- Contient **toute la logique applicative** (calculs, transformations, règles).
- N'a aucune connaissance de l'UI ni des sources de données concrètes.
- Utilise les repositories (`secondary_ports`) via injection de dépendance (interfaces uniquement).
- Gère l'état global de la feature via des **Signals Angular** (`signal()`, `computed()`).

#### `secondary_ports` — Repositories
- Interface TypeScript définissant le contrat d'accès aux données.
- Implémentation concrète pour localStorage.
- Fournit les données brutes au `core_logic` via des Promises.
- L'interface est exposée via un **`InjectionToken`** pour respecter l'inversion de dépendance.

#### `secondary_adapters` — Mappers
- Transforment les **données brutes** (JSON localStorage, avec dates en chaînes ISO) en **modèles du domaine** TypeScript.
- Isolent le reste de l'application du format de stockage.
- Implémentent les méthodes `toDomain()` (JSON → modèle) et `toStorage()` (modèle → JSON localStorage). Le nommage `toStorage()` (plutôt que `toRaw()`) est volontairement neutre pour faciliter l'ajout futur d'un `toFirestore()` dans un mapper Firebase dédié.

---

### 1.3 Contraintes techniques

| Contrainte | Valeur |
|---|---|
| Framework | Angular 21 |
| Distribution | **Capacitor** (app native iOS / Android, pas de PWA) |
| Modules | Aucun NgModule — composants standalone uniquement |
| Détection de changements | `ChangeDetectionStrategy.OnPush` sur tous les composants |
| État réactif | Signals Angular (`signal`, `computed`, `effect`) |
| Flux asynchrones | RxJS uniquement pour les événements DOM complexes (long press) |
| Persistance | `localStorage` via WebView Capacitor (aucun backend) |
| Routing | Angular Router avec lazy loading par feature |
| UUID | `crypto.randomUUID()` (disponible dans la WebView Capacitor) |
| Styles | SCSS |

---

### 1.4 Structure complète des dossiers (aperçu)

```
src/
└── app/
    ├── primary_adapters/
    │   ├── session-list/
    │   ├── session-detail/
    │   ├── session-chrono/
    │   ├── exercise-chrono/
    │   ├── stats-global/
    │   ├── stats-exercise/
    │   └── shared/
    │
    ├── primary_ports/
    │   ├── session-list/
    │   ├── session-detail/
    │   ├── session-chrono/
    │   ├── exercise-chrono/
    │   ├── stats-global/
    │   └── stats-exercise/
    │
    ├── core_logic/
    │   ├── session/
    │   ├── session-detail/
    │   ├── chrono/
    │   ├── exercise-chrono/
    │   ├── stats-global/
    │   ├── stats-exercise/
    │   └── shared/
    │
    ├── secondary_ports/
    │   ├── session/
    │   └── exercise/
    │
    ├── secondary_adapters/
    │   ├── session/
    │   └── exercise/
    │
    └── app.routes.ts
```

---

### 1.5 Configuration Angular Router (lazy loading)

Le routing est configuré dans `app.routes.ts`. Chaque feature est chargée en **lazy loading** via `loadComponent()`.

```ts
// app.routes.ts
import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'sessions', pathMatch: 'full' },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./primary_adapters/session-list/session-list.component')
        .then(m => m.SessionListComponent),
  },
  {
    path: 'sessions/:id',
    loadComponent: () =>
      import('./primary_adapters/session-detail/session-detail.component')
        .then(m => m.SessionDetailComponent),
  },
  {
    path: 'chrono/session',
    loadComponent: () =>
      import('./primary_adapters/session-chrono/session-chrono.component')
        .then(m => m.SessionChronoComponent),
  },
  {
    path: 'chrono/exercise',
    loadComponent: () =>
      import('./primary_adapters/exercise-chrono/exercise-chrono.component')
        .then(m => m.ExerciseChronoComponent),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./primary_adapters/stats-global/stats-global.component')
        .then(m => m.StatsGlobalComponent),
  },
  {
    path: 'stats/:exerciseName',
    loadComponent: () =>
      import('./primary_adapters/stats-exercise/stats-exercise.component')
        .then(m => m.StatsExerciseComponent),
  },
];
```

---

## 2. Modèles du domaine (Domain Models)

Tous les modèles du domaine sont définis dans un fichier central : `src/app/core_logic/shared/models.ts`.

### 2.1 Enum `MuscleGroup`

```ts
export enum MuscleGroup {
  Biceps = 'Biceps',
  Triceps = 'Triceps',
  Fessier = 'Fessier',
  IschioJambiers = 'IschioJambiers',
  Quadriceps = 'Quadriceps',
  Trapezes = 'Trapezes',
  Abdominaux = 'Abdominaux',
  Lombaires = 'Lombaires',
  Mollets = 'Mollets',
  Dos = 'Dos',
  Epaules = 'Epaules',
  Pectoraux = 'Pectoraux',
  AvantBras = 'AvantBras',
}
```

> Les valeurs string de l'enum correspondent aux labels d'affichage. Un dictionnaire de traduction peut être ajouté ultérieurement si nécessaire.

---

### 2.2 Interface `Session`

```ts
export interface Session {
  id: string;                        // UUID généré via crypto.randomUUID()
  date: Date;                        // Date de création de la séance
  exercises: Exercise[];             // Liste des exercices (chargés séparément via ExerciseRepository)
  durationSeconds: number;           // Durée totale de la séance en secondes (0 tant que non terminée)
  muscleGroup: MuscleGroup | null;   // Groupe musculaire principal (dérivé des exercices)
  status: 'active' | 'completed';    // 'active' = séance en cours, 'completed' = terminée
}
```

> **Note** : le champ `exercises` n'est **pas** persisté dans `egn_sessions`. Il est toujours peuplé à la volée en chargeant les exercices depuis `egn_exercises` correspondant au `sessionId`. Le repository effectue cette jointure logique.

---

### 2.3 Interface `Exercise`

```ts
export interface Exercise {
  id: string;                              // UUID généré via crypto.randomUUID()
  sessionId: string;                       // Clé étrangère vers Session.id
  name: string;                            // Nom de l'exercice (sans le synonyme du groupe musculaire)
  muscleGroup: MuscleGroup | null;         // Groupe musculaire détecté automatiquement
  weightKg: number;                        // Poids en kilogrammes (ex: 75.5)
  sets: number;                            // Nombre de séries
  reps: number;                            // Nombre de répétitions par série
  breakDurationSeconds: number;            // Durée de pause en secondes entre les séries
  status: 'pending' | 'validated' | 'cancelled'; // État de l'exercice
}
```

---

### 2.4 Interface `SessionStats`

Objet de statistiques calculé à la volée à partir d'une `Session` et de ses `Exercise[]`.

```ts
export interface SessionStats {
  totalWeightKg: number;    // Somme de (weightKg × sets × reps) pour tous les exercices validés
  exerciseCount: number;    // Nombre d'exercices (tous statuts confondus)
  durationSeconds: number;  // Durée totale de la séance (depuis Session.durationSeconds)
}
```

---

### 2.5 Interface `ExerciseOccurrence`

Représente une occurrence d'un exercice dans une séance pour les statistiques de progression.

```ts
export interface ExerciseOccurrence {
  date: Date;         // Date de la séance dans laquelle cet exercice a été réalisé
  weightKg: number;   // Poids utilisé
  sets: number;       // Nombre de séries
  reps: number;       // Nombre de répétitions
  volumeKg: number;   // Volume total = weightKg × sets × reps
}
```

---

### 2.6 Formats bruts (Raw) pour localStorage

Ces types représentent les données telles qu'elles sont stockées en JSON dans le localStorage. Ils diffèrent des modèles domaine uniquement sur les types non sérialisables (ex : `Date` → `string`).

```ts
// Format brut d'une session dans egn_sessions
export interface RawSession {
  id: string;
  date: string;                  // ISO 8601 (ex: "2026-03-15T10:30:00.000Z")
  durationSeconds: number;
  muscleGroup: string | null;
  status: 'active' | 'completed';
  // exercises : NON incluses ici — stockées séparément dans egn_exercises
}

// Format brut d'un exercice dans egn_exercises
export interface RawExercise {
  id: string;
  sessionId: string;
  name: string;
  muscleGroup: string | null;
  weightKg: number;
  sets: number;
  reps: number;
  breakDurationSeconds: number;
  status: 'pending' | 'validated' | 'cancelled';
}
```

---

## 3. Routing

### 3.1 Tableau des routes

| Route | Composant | Description | Params |
|---|---|---|---|
| `/` | — | Redirige vers `/sessions` | — |
| `/sessions` | `SessionListComponent` | Page d'accueil, liste des séances | — |
| `/sessions/:id` | `SessionDetailComponent` | Détail d'une séance | `id` : UUID de la session |
| `/chrono/session` | `SessionChronoComponent` | Chrono global de séance en plein écran | — |
| `/chrono/exercise` | `ExerciseChronoComponent` | Chrono break/exercice en plein écran | `breakDuration` (query param, optionnel) |
| `/stats` | `StatsGlobalComponent` | Tableau de bord global | — |
| `/stats/:exerciseName` | `StatsExerciseComponent` | Statistiques d'un exercice | `exerciseName` : nom encodé en URI |

### 3.2 Utilisation des paramètres de route

- **`/sessions/:id`** : `ActivatedRoute.snapshot.params['id']` pour récupérer l'UUID de la session à charger.
- **`/chrono/exercise`** : le query param `?breakDuration=90` permet de pré-configurer le chrono avec le temps de pause de l'exercice concerné. Transmis via `Router.navigate(['/chrono/exercise'], { queryParams: { breakDuration: exercise.breakDurationSeconds } })`.
- **`/stats/:exerciseName`** : `exerciseName` est encodé avec `encodeURIComponent()` pour supporter les noms contenant des espaces ou des caractères spéciaux.

### 3.3 Barre de navigation inférieure

Le composant `BottomNavComponent` est un composant partagé **toujours visible** en bas de chaque écran. Il est intégré directement dans le template racine `app.component.html`.

Il contient trois onglets :
- **Sessions** → navigue vers `/sessions`
- **Chrono** → navigue vers `/chrono/session`
- **Stats** → navigue vers `/stats`

L'onglet actif est détecté via `Router.url` (signal ou `RouterLinkActive`).

```html
<!-- app.component.html -->
<router-outlet />
<app-bottom-nav />
```

---

## 4. Feature : session-list

### 4.1 `primary_adapters/session-list`

#### `SessionListComponent`

**Fichier** : `src/app/primary_adapters/session-list/session-list.component.ts`

**Responsabilités** :
- Afficher la liste des sessions triées par date décroissante.
- Afficher un bouton `+` pour créer une nouvelle session.
- Détecter l'appui long (700 ms) sur une carte de session pour ouvrir un menu contextuel.
- Afficher le menu contextuel (overlay) avec les actions Dupliquer / Supprimer.
- Déclencher la confirmation avant suppression via `ConfirmDialogComponent`.

**Dépendances** :
- `GetSessionsUseCase` — chargement de la liste
- `CreateSessionUseCase` — création d'une nouvelle session
- `DuplicateSessionUseCase` — duplication d'une session
- `DeleteSessionUseCase` — suppression avec confirmation
- `LongPressDirective` — directive partagée pour l'appui long

**Template simplifié** :
```html
<div class="session-list">
  @for (session of sessions(); track session.id) {
    <app-session-card
      [session]="session"
      (longPress)="onLongPress(session)"
      (click)="onSessionClick(session)"
    />
  }
</div>

<button class="fab" (click)="onCreate()">+</button>

@if (contextMenuSession()) {
  <app-context-menu
    [options]="['Dupliquer', 'Supprimer']"
    (selected)="onContextAction($event)"
    (closed)="contextMenuSession.set(null)"
  />
}
```

**Signals exposés** :
- `sessions` : `Signal<Session[]>` — obtenu depuis `GetSessionsUseCase.sessions`
- `contextMenuSession` : `Signal<Session | null>` — session ciblée par l'appui long

**Long press** : la directive `LongPressDirective` est appliquée sur chaque `app-session-card`. Elle émet l'événement `(longPress)` après 700 ms de pression maintenue.

---

#### `SessionCardComponent`

**Fichier** : `src/app/primary_adapters/session-list/session-card.component.ts`

Composant dumb d'affichage d'une carte de session.

**Inputs** :
- `session: input<Session>()`

**Outputs** :
- `longPress: output<void>()`

**Contenu affiché** :
- Date formatée (ex : `15 mars 2026`)
- Tag du groupe musculaire principal (`session.muscleGroup`)
- Poids total soulevé (calculé : somme de `weightKg × sets × reps` des exercices validés)
- Nombre d'exercices
- Durée totale (`durationSeconds` formaté en `HH:MM:SS`)
- Badge visuel si `status === 'active'` (séance en cours)

---

#### `ContextMenuComponent`

**Fichier** : `src/app/primary_adapters/shared/context-menu.component.ts`

Overlay affiché après un appui long. Contient les options Dupliquer et Supprimer.

**Inputs** :
- `options: input<string[]>()`

**Outputs** :
- `selected: output<string>()`
- `closed: output<void>()`

Positionné en superposition (CSS `position: fixed`, fond semi-transparent cliquable pour fermeture).

---

#### `ConfirmDialogComponent`

**Fichier** : `src/app/primary_adapters/shared/confirm-dialog.component.ts`

Modal de confirmation réutilisable pour toutes les suppressions.

**Inputs** :
- `message: input<string>()` — texte affiché (ex : « Supprimer cette séance ? »)

**Outputs** :
- `confirmed: output<void>()`
- `cancelled: output<void>()`

Implémenté comme un composant overlay avec fond foncé. Peut s'appuyer sur Angular CDK `Overlay` ou être géré via un `signal` d'état dans le composant parent.

---

### 4.2 `primary_ports/session-list`

#### `GetSessionsUseCase`

**Fichier** : `src/app/primary_ports/session-list/get-sessions.usecase.ts`

```ts
@Injectable({ providedIn: 'root' })
export class GetSessionsUseCase {
  private readonly sessionService = inject(SessionService);
  readonly sessions = this.sessionService.sessions;

  async execute(): Promise<void> {
    await this.sessionService.loadAll();
  }
}
```

Expose le signal `sessions` issu de `SessionService`. Appeler `execute()` au `ngOnInit` du composant.

---

#### `CreateSessionUseCase`

**Fichier** : `src/app/primary_ports/session-list/create-session.usecase.ts`

**Séquence** :
1. Crée un objet `Session` avec un nouvel UUID, la date du jour, `status: 'active'`, `durationSeconds: 0`, `exercises: []`, `muscleGroup: null`.
2. Délègue la sauvegarde à `SessionService.create(session)`.
3. Lance le chrono de séance via `SessionChronoService.start()`.
4. Navigue vers `/sessions/:id`.

---

#### `DuplicateSessionUseCase`

**Fichier** : `src/app/primary_ports/session-list/duplicate-session.usecase.ts`

**Séquence** :
1. Charge la session source et ses exercices depuis `SessionService`.
2. Crée une nouvelle `Session` avec un nouvel UUID, la **date du jour**, `status: 'active'`, `durationSeconds: 0`.
3. Copie tous les exercices de la session source avec de **nouveaux UUIDs**, le nouveau `sessionId`, et le statut réinitialisé à `'pending'`.
4. Sauvegarde la nouvelle session et tous ses exercices.
5. Lance le chrono de séance via `SessionChronoService.start()`.
6. Navigue vers `/sessions/:newId`.

---

#### `DeleteSessionUseCase`

**Fichier** : `src/app/primary_ports/session-list/delete-session.usecase.ts`

**Séquence** :
1. La confirmation est gérée au niveau du composant (`ConfirmDialogComponent`).
2. Appelle `SessionService.delete(sessionId)`.
3. Le service supprime la session et tous ses exercices associés.
4. Le signal `sessions` est mis à jour automatiquement.

---

### 4.3 `core_logic/session`

#### `SessionService`

**Fichier** : `src/app/core_logic/session/session.service.ts`

**Responsabilités** :
- Maintenir le signal `sessions: Signal<Session[]>`.
- Implémenter les opérations CRUD en déléguant au repository.
- Peupler le champ `exercises` de chaque session à partir de `IExerciseRepository`.

```ts
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionRepo = inject(SESSION_REPOSITORY);
  private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

  private readonly _sessions = signal<Session[]>([]);
  readonly sessions = this._sessions.asReadonly();

  async loadAll(): Promise<void> {
    const rawSessions = await this.sessionRepo.getAll();
    const withExercises = await Promise.all(
      rawSessions.map(async (session) => {
        const exercises = await this.exerciseRepo.getBySessionId(session.id);
        return { ...session, exercises };
      })
    );
    // Trier par date décroissante
    this._sessions.set(withExercises.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }

  async create(session: Session): Promise<void> {
    await this.sessionRepo.save(session);
    await this.loadAll();
  }

  async delete(sessionId: string): Promise<void> {
    await this.sessionRepo.delete(sessionId);
    // Supprimer également tous les exercices associés
    const exercises = await this.exerciseRepo.getBySessionId(sessionId);
    await Promise.all(exercises.map(e => this.exerciseRepo.delete(e.id)));
    await this.loadAll();
  }
}
```

---

### 4.4 `secondary_ports/session`

#### `ISessionRepository`

**Fichier** : `src/app/secondary_ports/session/session.repository.interface.ts`

```ts
import { Session } from '../../core_logic/shared/models';

export interface ISessionRepository {
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
}

export const SESSION_REPOSITORY = new InjectionToken<ISessionRepository>('SESSION_REPOSITORY');
```

---

#### `SessionRepository`

**Fichier** : `src/app/secondary_ports/session/session.repository.ts`

- Implémente `ISessionRepository`.
- Clé localStorage : `'egn_sessions'`.
- Utilise `SessionMapper` pour les conversions.
- Toutes les méthodes sont synchrones en interne (localStorage est synchrone) mais exposées en `Promise` pour respecter l'interface.

```ts
@Injectable({ providedIn: 'root' })
export class SessionRepository implements ISessionRepository {
  private readonly mapper = inject(SessionMapper);
  private readonly STORAGE_KEY = 'egn_sessions';

  private readAll(): RawSession[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private writeAll(sessions: RawSession[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  async getAll(): Promise<Session[]> {
    return this.readAll().map(r => this.mapper.toDomain(r));
  }

  async getById(id: string): Promise<Session | null> {
    const found = this.readAll().find(s => s.id === id);
    return found ? this.mapper.toDomain(found) : null;
  }

  async save(session: Session): Promise<void> {
    const all = this.readAll();
    const idx = all.findIndex(s => s.id === session.id);
    const raw = this.mapper.toRaw(session);
    if (idx >= 0) {
      all[idx] = raw;
    } else {
      all.push(raw);
    }
    this.writeAll(all);
  }

  async delete(id: string): Promise<void> {
    const all = this.readAll().filter(s => s.id !== id);
    this.writeAll(all);
  }
}
```

---

#### `SessionMapper`

**Fichier** : `src/app/secondary_adapters/session/session.mapper.ts`

```ts
@Injectable({ providedIn: 'root' })
export class SessionMapper {
  toDomain(raw: RawSession): Session {
    return {
      id: raw.id,
      date: new Date(raw.date),
      exercises: [],            // Toujours [] ici — peuplé par SessionService
      durationSeconds: raw.durationSeconds,
      muscleGroup: raw.muscleGroup as MuscleGroup | null,
      status: raw.status,
    };
  }

  toRaw(session: Session): RawSession {
    return {
      id: session.id,
      date: session.date.toISOString(),
      durationSeconds: session.durationSeconds,
      muscleGroup: session.muscleGroup,
      status: session.status,
      // exercises : volontairement omis
    };
  }
}
```

---

## 5. Feature : session-detail

### 5.1 `primary_adapters/session-detail`

#### `SessionDetailComponent`

**Fichier** : `src/app/primary_adapters/session-detail/session-detail.component.ts`

**Responsabilités** :
- Afficher l'en-tête de la session (date, tag muscle, poids total, nb exercices, chrono en cours).
- Afficher la liste des exercices via `ExerciseCardComponent`.
- Gérer l'expansion d'un exercice (un seul exercice étendu à la fois).
- Afficher le formulaire d'ajout d'exercice.
- Boutons `Break` (→ `/chrono/exercise`) et `End` (termine la séance).

**Signals locaux** :
- `expandedExerciseId = signal<string | null>(null)` — contrôle l'exercice actuellement étendu
- `showAddForm = signal<boolean>(false)` — affiche/masque le formulaire d'ajout

**Initialisation** : au `ngOnInit`, appelle `GetSessionDetailUseCase.execute(id)` avec l'id récupéré depuis `ActivatedRoute`.

---

#### `ExerciseCardComponent`

**Fichier** : `src/app/primary_adapters/session-detail/exercise-card.component.ts`

Composant d'affichage compact d'un exercice.

**Inputs** :
- `exercise: input<Exercise>()`
- `isExpanded: input<boolean>()`

**Outputs** :
- `toggleExpand: output<void>()`

**Contenu affiché (mode compact)** :
- Nom de l'exercice
- Tag groupe musculaire (coloré selon le statut)
- Poids, séries × reps, durée de break
- Bordure colorée selon le statut : orange (pending/cancelled), verte (validated)

Lorsque `isExpanded` est `true`, affiche `ExerciseExpandedComponent`.

---

#### `ExerciseExpandedComponent`

**Fichier** : `src/app/primary_adapters/session-detail/exercise-expanded.component.ts`

Panneau déroulé au-dessous de la carte compacte.

**Inputs** :
- `exercise: input<Exercise>()`

**Outputs** :
- `update: output<Partial<Exercise>>()`
- `validate: output<void>()`
- `cancel: output<void>()`
- `delete: output<void>()`
- `openChrono: output<void>()`
- `openStats: output<void>()`

**Contenu** :
- `DrumPickerComponent` pour chaque paramètre : poids (pas de 0.5 kg, plage 0–300), séries (1–20), répétitions (1–50), break (pas de 5s, plage 0–600s).
- Quatre boutons d'action : Chronomètre, Valider, Annuler, Page exercice, Supprimer.

---

#### `DrumPickerComponent`

**Fichier** : `src/app/primary_adapters/shared/drum-picker.component.ts`

Sélecteur à défilement vertical de style iOS (roue de sélection).

**Inputs** :
- `values: input<number[] | string[]>()` — liste des valeurs disponibles
- `selectedValue: input<number | string>()` — valeur initiale sélectionnée
- `unit: input<string>('')` — unité affichée (ex : `'kg'`, `'s'`, `''`)

**Outputs** :
- `valueChange: output<number | string>()`

**Implémentation technique** :
- `div` conteneur avec `overflow-y: scroll`, `scroll-snap-type: y mandatory`, hauteur fixe (ex : 200px).
- Chaque option est un `div` avec `scroll-snap-align: center` et hauteur fixe (ex : 40px).
- Sur l'événement `(scroll)`, calculer l'index actif : `activeIndex = Math.round(scrollTop / itemHeight)`.
- Sur `scrollend` (ou `scroll` avec debounce), émettre la nouvelle valeur.
- L'option centrale est mise en évidence visuellement (opacité/taille).
- Au chargement, scroller programmatiquement vers la position de la valeur initiale.

---

#### `AddExerciseFormComponent`

**Fichier** : `src/app/primary_adapters/session-detail/add-exercise-form.component.ts`

Formulaire d'ajout d'un nouvel exercice à la session.

**Inputs** :
- `sessionId: input<string>()`

**Outputs** :
- `exerciseAdded: output<void>()`
- `cancelled: output<void>()`

**Champs** :
- Nom de l'exercice : `<input>` texte avec liste déroulante d'auto-complétion (`AutocompleteService`).
- Poids par défaut (`DrumPickerComponent`)
- Séries (`DrumPickerComponent`)
- Répétitions (`DrumPickerComponent`)
- Break (`DrumPickerComponent`)

**Comportement** :
- À chaque frappe dans le champ nom, interroge `AutocompleteService` pour filtrer les exercices connus.
- Sélectionner une suggestion préremplie les paramètres avec les dernières valeurs connues.
- Le groupe musculaire est détecté en temps réel dans le nom via `MuscleGroupDetectorService` et affiché en tag.
- À la validation, appelle `AddExerciseUseCase.execute(...)`.

---

### 5.2 `primary_ports/session-detail`

#### `GetSessionDetailUseCase`

```ts
@Injectable({ providedIn: 'root' })
export class GetSessionDetailUseCase {
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.currentSession;

  async execute(id: string): Promise<void> {
    await this.sessionService.loadById(id);
  }
}
```

---

#### `AddExerciseUseCase`

**Séquence** :
1. Reçoit un objet partiel `{ name, weightKg, sets, reps, breakDurationSeconds, sessionId }`.
2. Appelle `MuscleGroupDetectorService.detect(name)` → retourne `{ muscleGroup, cleanedName }`.
3. Construit l'objet `Exercise` complet avec UUID, `status: 'pending'`.
4. Délègue à `ExerciseService.add(exercise)`.
5. Met à jour le groupe musculaire de la session si pertinent.

---

#### `UpdateExerciseUseCase`

Reçoit `{ exerciseId, changes: Partial<Exercise> }`. Délègue à `ExerciseService.update(exerciseId, changes)`.

---

#### `ValidateExerciseUseCase`

Appelle `ExerciseService.update(exerciseId, { status: 'validated' })`. Le signal `exercises` est mis à jour → le composant re-render automatiquement.

---

#### `CancelExerciseUseCase`

Appelle `ExerciseService.update(exerciseId, { status: 'cancelled' })`.

---

#### `DeleteExerciseUseCase`

La confirmation est gérée au niveau du composant. Appelle `ExerciseService.delete(exerciseId)`.

---

#### `EndSessionUseCase`

**Séquence** :
1. Récupère le temps écoulé depuis `SessionChronoService.getElapsed()`.
2. Arrête le chrono via `SessionChronoService.stop()`.
3. Si le temps est nul ou suspect (ex : chrono non démarré), affiche une interface de saisie manuelle (signal `showManualOverride`).
4. Sauvegarde `session.durationSeconds` et `session.status = 'completed'` via `SessionService.save()`.
5. Navigue vers `/sessions`.

---

### 5.3 `core_logic/session-detail`

#### `ExerciseService`

**Fichier** : `src/app/core_logic/session-detail/exercise.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly repo = inject(EXERCISE_REPOSITORY);

  private readonly _exercises = signal<Exercise[]>([]);
  readonly exercises = this._exercises.asReadonly();

  async loadBySession(sessionId: string): Promise<void> {
    const data = await this.repo.getBySessionId(sessionId);
    this._exercises.set(data);
  }

  async add(exercise: Exercise): Promise<void> {
    await this.repo.save(exercise);
    await this.loadBySession(exercise.sessionId);
  }

  async update(exerciseId: string, changes: Partial<Exercise>): Promise<void> {
    const current = this._exercises().find(e => e.id === exerciseId);
    if (!current) return;
    const updated = { ...current, ...changes };
    await this.repo.save(updated);
    this._exercises.update(list => list.map(e => e.id === exerciseId ? updated : e));
  }

  async delete(exerciseId: string): Promise<void> {
    const exercise = this._exercises().find(e => e.id === exerciseId);
    if (!exercise) return;
    await this.repo.delete(exerciseId);
    this._exercises.update(list => list.filter(e => e.id !== exerciseId));
  }
}
```

---

#### `MuscleGroupDetectorService`

**Fichier** : `src/app/core_logic/shared/muscle-group-detector.service.ts`

Service pur, sans dépendances externes.

**Carte des synonymes** (valeurs normalisées, sans accents, minuscules) :

```ts
const SYNONYM_MAP: Record<string, MuscleGroup> = {
  'biceps': MuscleGroup.Biceps,
  'bibi': MuscleGroup.Biceps,
  'triceps': MuscleGroup.Triceps,
  'tritri': MuscleGroup.Triceps,
  'fessier': MuscleGroup.Fessier,
  'fesses': MuscleGroup.Fessier,
  'booty': MuscleGroup.Fessier,
  'ischio': MuscleGroup.IschioJambiers,
  'ischios': MuscleGroup.IschioJambiers,
  'quadriceps': MuscleGroup.Quadriceps,
  'quadri': MuscleGroup.Quadriceps,
  'trapezes': MuscleGroup.Trapezes,
  'traps': MuscleGroup.Trapezes,
  'abdos': MuscleGroup.Abdominaux,
  'core': MuscleGroup.Abdominaux,
  'sangle': MuscleGroup.Abdominaux,
  'lombaires': MuscleGroup.Lombaires,
  'lombs': MuscleGroup.Lombaires,
  'bas du dos': MuscleGroup.Lombaires,
  'mollets': MuscleGroup.Mollets,
  'mollos': MuscleGroup.Mollets,
  'dos': MuscleGroup.Dos,
  'grand dorsal': MuscleGroup.Dos,
  'dorsaux': MuscleGroup.Dos,
  'lats': MuscleGroup.Dos,
  'epaules': MuscleGroup.Epaules,
  'deltos': MuscleGroup.Epaules,
  'deltoides': MuscleGroup.Epaules,
  'pecs': MuscleGroup.Pectoraux,
  'poitrine': MuscleGroup.Pectoraux,
  'avant-bras': MuscleGroup.AvantBras,
  'grip': MuscleGroup.AvantBras,
};
```

**Algorithme de détection** :

```ts
interface DetectionResult {
  muscleGroup: MuscleGroup | null;
  cleanedName: string;
}

detect(name: string): DetectionResult {
  // 1. Normaliser : minuscules + supprimer les accents
  const normalized = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Chercher chaque synonyme (par ordre décroissant de longueur pour éviter les conflits)
  const synonyms = Object.keys(SYNONYM_MAP).sort((a, b) => b.length - a.length);

  for (const synonym of synonyms) {
    if (normalized.includes(synonym)) {
      const muscleGroup = SYNONYM_MAP[synonym];
      // 3. Retirer le synonyme du nom original (insensible à la casse)
      const cleanedName = name.replace(new RegExp(synonym, 'gi'), '').trim()
        .replace(/\s+/g, ' ');
      return { muscleGroup, cleanedName };
    }
  }

  return { muscleGroup: null, cleanedName: name };
}
```

---

#### `AutocompleteService`

**Fichier** : `src/app/core_logic/session-detail/autocomplete.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class AutocompleteService {
  private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

  // Retourne les noms distincts d'exercices correspondant au préfixe
  async getSuggestions(prefix: string): Promise<string[]> {
    const all = await this.exerciseRepo.getAll();
    const normalized = prefix.toLowerCase();
    const names = [...new Set(all.map(e => e.name))];
    return names.filter(n => n.toLowerCase().startsWith(normalized));
  }

  // Retourne les paramètres de la dernière occurrence d'un exercice par son nom
  async getLastParams(exerciseName: string): Promise<Partial<Exercise> | null> {
    const all = await this.exerciseRepo.getAll();
    const matches = all.filter(e => e.name === exerciseName);
    if (matches.length === 0) return null;
    // Trier par sessionId ou par ordre d'insertion : le dernier est le plus récent
    return matches[matches.length - 1];
  }
}
```

> `IExerciseRepository` expose une méthode `getAll(): Promise<Exercise[]>` utilisée uniquement par ce service.

---

### 5.4 `secondary_ports/exercise`

#### `IExerciseRepository`

**Fichier** : `src/app/secondary_ports/exercise/exercise.repository.interface.ts`

```ts
export interface IExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getBySessionId(sessionId: string): Promise<Exercise[]>;
  save(exercise: Exercise): Promise<void>;
  delete(id: string): Promise<void>;
}

export const EXERCISE_REPOSITORY = new InjectionToken<IExerciseRepository>('EXERCISE_REPOSITORY');
```

---

#### `ExerciseRepository`

**Fichier** : `src/app/secondary_ports/exercise/exercise.repository.ts`

- Implémente `IExerciseRepository`.
- Clé localStorage : `'egn_exercises'`.
- Utilise `ExerciseMapper`.

```ts
@Injectable({ providedIn: 'root' })
export class ExerciseRepository implements IExerciseRepository {
  private readonly mapper = inject(ExerciseMapper);
  private readonly STORAGE_KEY = 'egn_exercises';

  private readAll(): RawExercise[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private writeAll(exercises: RawExercise[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(exercises));
  }

  async getAll(): Promise<Exercise[]> {
    return this.readAll().map(r => this.mapper.toDomain(r));
  }

  async getBySessionId(sessionId: string): Promise<Exercise[]> {
    return this.readAll()
      .filter(e => e.sessionId === sessionId)
      .map(r => this.mapper.toDomain(r));
  }

  async save(exercise: Exercise): Promise<void> {
    const all = this.readAll();
    const idx = all.findIndex(e => e.id === exercise.id);
    const raw = this.mapper.toRaw(exercise);
    if (idx >= 0) {
      all[idx] = raw;
    } else {
      all.push(raw);
    }
    this.writeAll(all);
  }

  async delete(id: string): Promise<void> {
    this.writeAll(this.readAll().filter(e => e.id !== id));
  }
}
```

---

#### `ExerciseMapper`

**Fichier** : `src/app/secondary_adapters/exercise/exercise.mapper.ts`

```ts
@Injectable({ providedIn: 'root' })
export class ExerciseMapper {
  toDomain(raw: RawExercise): Exercise {
    return {
      id: raw.id,
      sessionId: raw.sessionId,
      name: raw.name,
      muscleGroup: raw.muscleGroup as MuscleGroup | null,
      weightKg: raw.weightKg,
      sets: raw.sets,
      reps: raw.reps,
      breakDurationSeconds: raw.breakDurationSeconds,
      status: raw.status,
    };
  }

  toRaw(exercise: Exercise): RawExercise {
    return { ...exercise }; // Toutes les propriétés sont directement sérialisables
  }
}
```

---

## 6. Feature : session-chrono

### 6.1 `primary_adapters/session-chrono`

#### `SessionChronoComponent`

**Fichier** : `src/app/primary_adapters/session-chrono/session-chrono.component.ts`

**Affichage plein écran** :
- Temps écoulé en grand format `HH:MM:SS`, centré.
- Anneau de progression SVG (cercle `<circle>` avec `stroke-dashoffset` animé). L'anneau effectue un cycle complet toutes les 60 secondes (rotation continue).
- Label de statut : `'Training'`.

**SVG anneau de progression** :
```html
<svg viewBox="0 0 200 200" class="progress-ring">
  <circle cx="100" cy="100" r="90" class="ring-bg" />
  <circle
    cx="100" cy="100" r="90"
    class="ring-progress"
    [style.stroke-dashoffset]="ringOffset()"
  />
</svg>
```
`ringOffset()` est un `computed()` basé sur `elapsedSeconds()` modulo 60.

**Boutons** :
- **`Go Break`** : navigue vers `/chrono/exercise`. Le query param `breakDuration` est transmis depuis le dernier exercice de la session en cours (récupéré via `SessionService.currentSession`).
- **`STOP`** : appelle `StopSessionChronoUseCase.execute()`.

**Signal local** :
- `showManualOverride = signal<boolean>(false)` — affiche un champ de saisie si le chrono doit être corrigé.
- `manualSeconds = signal<number>(0)` — valeur saisie manuellement.

---

### 6.2 `primary_ports/session-chrono`

#### `GetSessionChronoUseCase`

```ts
@Injectable({ providedIn: 'root' })
export class GetSessionChronoUseCase {
  private readonly chronoService = inject(SessionChronoService);
  readonly elapsedSeconds = this.chronoService.elapsedSeconds;
}
```

#### `StopSessionChronoUseCase`

**Séquence** :
1. Appelle `SessionChronoService.stop()` → retourne les secondes écoulées.
2. Si le résultat est 0 (chrono non démarré), active `showManualOverride` dans le composant.
3. Sinon, sauvegarde `durationSeconds` dans la session courante via `SessionService`.
4. Navigue vers `/sessions/:id`.

---

### 6.3 `core_logic/chrono`

#### `SessionChronoService`

**Fichier** : `src/app/core_logic/chrono/session-chrono.service.ts`

**Singleton** (`providedIn: 'root'`). Survit aux changements de route.

```ts
@Injectable({ providedIn: 'root' })
export class SessionChronoService {
  private readonly STORAGE_KEY = 'egn_chrono_start';

  private readonly _elapsedSeconds = signal<number>(0);
  readonly elapsedSeconds = this._elapsedSeconds.asReadonly();

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Reprendre le chrono si un timestamp de démarrage est présent (reprise après navigation)
    this.resume();
  }

  start(): void {
    const startTime = Date.now();
    localStorage.setItem(this.STORAGE_KEY, startTime.toString());
    this._elapsedSeconds.set(0);
    this.startInterval();
  }

  private resume(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const startTime = parseInt(stored, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      this._elapsedSeconds.set(elapsed);
      this.startInterval();
    }
  }

  private startInterval(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    const startTime = parseInt(localStorage.getItem(this.STORAGE_KEY) ?? '0', 10);
    this.intervalId = setInterval(() => {
      this._elapsedSeconds.set(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }

  stop(): number {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    localStorage.removeItem(this.STORAGE_KEY);
    const elapsed = this._elapsedSeconds();
    this._elapsedSeconds.set(0);
    return elapsed;
  }

  getElapsed(): number {
    return this._elapsedSeconds();
  }
}
```

---

## 7. Feature : exercise-chrono

### 7.1 `primary_adapters/exercise-chrono`

#### `ExerciseChronoComponent`

**Fichier** : `src/app/primary_adapters/exercise-chrono/exercise-chrono.component.ts`

**Plein écran, deux modes visuellement distincts** :

**Mode Pause** :
- Affiche le temps restant en grand (`breakDuration - elapsed`).
- Anneau SVG qui se vide progressivement (`stroke-dashoffset` croissant de 0 à `circumference`).
- Label : `'Break'`.
- Les 3 dernières secondes : animation CSS `@keyframes blink` sur le texte du temps.
- À 0 : bip audio (Web Audio API), bascule automatiquement en mode Exercice.

**Mode Exercice** :
- Compteur qui monte depuis 0.
- Anneau SVG qui se remplit (ou simple cercle statique, selon le choix de design).
- Label : `'Training'`.

**Boutons (communs aux deux modes)** :
- **`Go Break`** : repassage immédiat en mode Pause, décompte relancé depuis `breakDuration`.
- **`Reset`** : remet le compteur à 0 dans le mode actuel.

**CSS `@keyframes` pour le clignotement** :
```scss
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.time-display.blinking {
  animation: blink 0.5s step-start infinite;
}
```

Le signal `isBlinking` est un `computed()` : `timeSeconds() <= 3 && mode() === 'pause'`.

---

### 7.2 `primary_ports/exercise-chrono`

#### `ExerciseChronoUseCase`

**Fichier** : `src/app/primary_ports/exercise-chrono/exercise-chrono.usecase.ts`

```ts
@Injectable({ providedIn: 'root' })
export class ExerciseChronoUseCase {
  private readonly chronoService = inject(ExerciseChronoService);

  readonly mode = this.chronoService.mode;
  readonly timeSeconds = this.chronoService.timeSeconds;

  initWithBreakDuration(breakDuration: number): void {
    this.chronoService.init(breakDuration);
  }

  goBreak(): void {
    this.chronoService.goBreak();
  }

  reset(): void {
    this.chronoService.reset();
  }
}
```

---

### 7.3 `core_logic/exercise-chrono`

#### `ExerciseChronoService`

**Fichier** : `src/app/core_logic/exercise-chrono/exercise-chrono.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class ExerciseChronoService {
  private readonly STORAGE_KEY = 'egn_exercise_chrono';

  private readonly _mode = signal<'pause' | 'exercise'>('pause');
  private readonly _timeSeconds = signal<number>(0);
  private readonly _breakDuration = signal<number>(60);

  readonly mode = this._mode.asReadonly();
  readonly timeSeconds = this._timeSeconds.asReadonly();

  private intervalId: ReturnType<typeof setInterval> | null = null;

  init(breakDuration: number): void {
    this._breakDuration.set(breakDuration);
    this._mode.set('pause');
    this._timeSeconds.set(breakDuration);
    this.startCountdown();
    this.persist();
  }

  goBreak(): void {
    this.clearInterval();
    this._mode.set('pause');
    this._timeSeconds.set(this._breakDuration());
    this.startCountdown();
    this.persist();
  }

  reset(): void {
    this.clearInterval();
    if (this._mode() === 'pause') {
      this._timeSeconds.set(this._breakDuration());
      this.startCountdown();
    } else {
      this._timeSeconds.set(0);
      this.startCountup();
    }
    this.persist();
  }

  private startCountdown(): void {
    this.intervalId = setInterval(() => {
      const current = this._timeSeconds();
      if (current <= 0) {
        this.clearInterval();
        this.playBeep();
        this._mode.set('exercise');
        this._timeSeconds.set(0);
        this.startCountup();
      } else {
        this._timeSeconds.set(current - 1);
      }
    }, 1000);
  }

  private startCountup(): void {
    this.intervalId = setInterval(() => {
      this._timeSeconds.update(t => t + 1);
    }, 1000);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playBeep(): void {
    // Web Audio API — bip court à 880 Hz
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  private persist(): void {
    const data = {
      breakDuration: this._breakDuration(),
      startedAt: Date.now(),
      mode: this._mode(),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}
```

---

## 8. Feature : stats-global

### 8.1 `primary_adapters/stats-global`

#### `StatsGlobalComponent`

**Fichier** : `src/app/primary_adapters/stats-global/stats-global.component.ts`

**Contenu** :
- **Sélecteur de mois** : `<select>` listé avec les 12 derniers mois + mois en cours. Appelle `SelectMonthUseCase.execute(month)` au changement.
- **`HeatmapComponent`** : grille des jours du mois sélectionné.
- **Cartes de résumé** : poids total, nombre de sessions, temps total.
- **Cartes de moyenne** : poids moyen/semaine, sessions/semaine, durée moyenne.
- **`DonutChartComponent`** : répartition des groupes musculaires.
- **Liste des exercices** : `ExerciseSummaryRowComponent` pour chaque exercice.

---

#### `HeatmapComponent`

**Fichier** : `src/app/primary_adapters/stats-global/heatmap.component.ts`

**Input** : `data: input<{ date: Date; hasSession: boolean }[]>()`

**Implémentation** :
- Grille CSS (`display: grid; grid-template-columns: repeat(7, 1fr)`).
- Les colonnes représentent les jours de la semaine (L, M, M, J, V, S, D).
- Les lignes représentent les semaines du mois.
- Les jours hors du mois courant sont des cellules vides ou grisées.
- Chaque cellule est colorée : couleur primaire si `hasSession === true`, gris clair sinon.

---

#### `DonutChartComponent`

**Fichier** : `src/app/primary_adapters/stats-global/donut-chart.component.ts`

**Input** : `distribution: input<Map<MuscleGroup, number>>()` (pourcentages, somme = 100)

**Implémentation SVG** :
- Cercle de rayon R avec `stroke-dasharray` calculé à partir des pourcentages.
- Chaque segment a une couleur différente (palette de 13 couleurs pour les 13 groupes musculaires).
- Formule : `circumference = 2 × π × R`. Pour chaque segment : `dashLength = (percentage / 100) × circumference`.
- Les segments sont dessinés en empilant `stroke-dasharray` et `stroke-dashoffset` successifs.
- Légende textuelle en dessous ou à côté.

---

#### `ExerciseSummaryRowComponent`

**Fichier** : `src/app/primary_adapters/stats-global/exercise-summary-row.component.ts`

**Inputs** :
- `exerciseName: input<string>()`
- `maxWeightKg: input<number>()`
- `totalVolumeKg: input<number>()`
- `occurrenceCount: input<number>()`

**Output** :
- `selected: output<string>()` — émet le nom de l'exercice au clic → navigue vers `/stats/:exerciseName`

---

### 8.2 `primary_ports/stats-global`

#### `GetGlobalStatsUseCase`

```ts
@Injectable({ providedIn: 'root' })
export class GetGlobalStatsUseCase {
  private readonly statsService = inject(StatsService);

  readonly heatmapData = this.statsService.heatmapData;
  readonly monthSummary = this.statsService.monthSummary;
  readonly weeklyAverage = this.statsService.weeklyAverage;
  readonly muscleGroupDistribution = this.statsService.muscleGroupDistribution;
  readonly exerciseSummaries = this.statsService.exerciseSummaries;

  async execute(): Promise<void> {
    await this.statsService.load();
  }
}
```

#### `SelectMonthUseCase`

```ts
@Injectable({ providedIn: 'root' })
export class SelectMonthUseCase {
  private readonly statsService = inject(StatsService);
  readonly selectedMonth = this.statsService.selectedMonth;

  execute(month: Date): void {
    this.statsService.setMonth(month);
  }
}
```

---

### 8.3 `core_logic/stats-global`

#### `StatsService`

**Fichier** : `src/app/core_logic/stats-global/stats.service.ts`

Utilise `computed()` Angular pour dériver automatiquement toutes les statistiques depuis les données brutes.

```ts
@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly sessionRepo = inject(SESSION_REPOSITORY);
  private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

  private readonly _allSessions = signal<Session[]>([]);
  private readonly _allExercises = signal<Exercise[]>([]);
  readonly selectedMonth = signal<Date>(new Date());

  async load(): Promise<void> {
    const [sessions, exercises] = await Promise.all([
      this.sessionRepo.getAll(),
      this.exerciseRepo.getAll(),
    ]);
    this._allSessions.set(sessions);
    this._allExercises.set(exercises);
  }

  setMonth(month: Date): void {
    this.selectedMonth.set(month);
  }

  // Sessions du mois sélectionné
  private readonly sessionsInMonth = computed(() => {
    const m = this.selectedMonth();
    return this._allSessions().filter(s =>
      s.date.getFullYear() === m.getFullYear() &&
      s.date.getMonth() === m.getMonth()
    );
  });

  // Exercices validés des sessions du mois
  private readonly exercisesInMonth = computed(() => {
    const sessionIds = new Set(this.sessionsInMonth().map(s => s.id));
    return this._allExercises().filter(e =>
      sessionIds.has(e.sessionId) && e.status === 'validated'
    );
  });

  // Heatmap : tableau de {date, hasSession} pour tous les jours du mois
  readonly heatmapData = computed(() => {
    const m = this.selectedMonth();
    const year = m.getFullYear();
    const month = m.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const sessionDates = new Set(
      this.sessionsInMonth().map(s => s.date.toDateString())
    );
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return { date, hasSession: sessionDates.has(date.toDateString()) };
    });
  });

  // Résumé du mois
  readonly monthSummary = computed(() => {
    const exercises = this.exercisesInMonth();
    const sessions = this.sessionsInMonth();
    return {
      totalWeightKg: exercises.reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0),
      sessionCount: sessions.length,
      totalDurationSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    };
  });

  // Moyenne par semaine
  readonly weeklyAverage = computed(() => {
    const sessions = this.sessionsInMonth();
    const m = this.selectedMonth();
    const weeksInMonth = Math.ceil(new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate() / 7);
    const summary = this.monthSummary();
    return {
      avgWeightKg: sessions.length > 0 ? summary.totalWeightKg / weeksInMonth : 0,
      sessionsPerWeek: sessions.length / weeksInMonth,
      avgDurationSeconds: sessions.length > 0 ? summary.totalDurationSeconds / sessions.length : 0,
    };
  });

  // Répartition des groupes musculaires
  readonly muscleGroupDistribution = computed((): Map<MuscleGroup, number> => {
    const exercises = this.exercisesInMonth().filter(e => e.muscleGroup !== null);
    const total = exercises.length;
    if (total === 0) return new Map();
    const counts = new Map<MuscleGroup, number>();
    for (const exercise of exercises) {
      const mg = exercise.muscleGroup as MuscleGroup;
      counts.set(mg, (counts.get(mg) ?? 0) + 1);
    }
    const distribution = new Map<MuscleGroup, number>();
    for (const [mg, count] of counts.entries()) {
      distribution.set(mg, Math.round((count / total) * 100));
    }
    return distribution;
  });

  // Résumé par exercice (groupé par nom)
  readonly exerciseSummaries = computed(() => {
    const exercises = this.exercisesInMonth();
    const grouped = new Map<string, Exercise[]>();
    for (const e of exercises) {
      const list = grouped.get(e.name) ?? [];
      list.push(e);
      grouped.set(e.name, list);
    }
    return Array.from(grouped.entries()).map(([name, list]) => ({
      name,
      maxWeightKg: Math.max(...list.map(e => e.weightKg)),
      totalVolumeKg: list.reduce((sum, e) => sum + e.weightKg * e.sets * e.reps, 0),
      occurrenceCount: list.length,
    })).sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
  });
}
```

---

## 9. Feature : stats-exercise

### 9.1 `primary_adapters/stats-exercise`

#### `StatsExerciseComponent`

**Fichier** : `src/app/primary_adapters/stats-exercise/stats-exercise.component.ts`

**Initialisation** : récupère `exerciseName` depuis `ActivatedRoute.snapshot.params['exerciseName']` (décodé via `decodeURIComponent`).

**Contenu** :
- Titre : nom de l'exercice.
- `DualLineChartComponent` : graphique double courbe (poids + volume).
- Liste des occurrences historiques.

---

#### `DualLineChartComponent`

**Fichier** : `src/app/primary_adapters/stats-exercise/dual-line-chart.component.ts`

**Input** : `occurrences: input<ExerciseOccurrence[]>()`

**Implémentation SVG** :
- Axe X : dates (espacées uniformément).
- Axe Y gauche : poids (`weightKg`), courbe bleue.
- Axe Y droit : volume (`volumeKg`), courbe orange.
- Chaque point de données est représenté par un `<circle>` cliquable (tooltip au survol).
- Les lignes sont des `<polyline>` ou `<path>` avec `fill: none`.
- Le SVG est responsive (`viewBox` fixe, largeur 100%).

**Calcul des coordonnées** :
```ts
// Pour chaque axe Y :
// y = svgHeight - padding - ((value - minValue) / (maxValue - minValue)) * plotHeight
// x = padding + (index / (occurrences.length - 1)) * plotWidth
```

---

### 9.2 `primary_ports/stats-exercise`

#### `GetExerciseStatsUseCase`

```ts
@Injectable({ providedIn: 'root' })
export class GetExerciseStatsUseCase {
  private readonly statsService = inject(ExerciseStatsService);

  readonly occurrences = this.statsService.occurrences;

  async execute(exerciseName: string): Promise<void> {
    await this.statsService.loadForExercise(exerciseName);
  }
}
```

---

### 9.3 `core_logic/stats-exercise`

#### `ExerciseStatsService`

**Fichier** : `src/app/core_logic/stats-exercise/exercise-stats.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class ExerciseStatsService {
  private readonly sessionRepo = inject(SESSION_REPOSITORY);
  private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);

  private readonly _occurrences = signal<ExerciseOccurrence[]>([]);
  readonly occurrences = this._occurrences.asReadonly();

  async loadForExercise(exerciseName: string): Promise<void> {
    const [allSessions, allExercises] = await Promise.all([
      this.sessionRepo.getAll(),
      this.exerciseRepo.getAll(),
    ]);

    const sessionDateMap = new Map(allSessions.map(s => [s.id, s.date]));

    const occurrences: ExerciseOccurrence[] = allExercises
      .filter(e => e.name === exerciseName && e.status === 'validated')
      .map(e => ({
        date: sessionDateMap.get(e.sessionId) ?? new Date(),
        weightKg: e.weightKg,
        sets: e.sets,
        reps: e.reps,
        volumeKg: e.weightKg * e.sets * e.reps,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    this._occurrences.set(occurrences);
  }
}
```

---

## 10. Comportements transversaux techniques

### 10.1 `MuscleGroupDetectorService` — Détail complet

**Fichier** : `src/app/core_logic/shared/muscle-group-detector.service.ts`

- Service pur, sans dépendance.
- `providedIn: 'root'`.
- La normalisation UTF-8 (`normalize('NFD')` + suppression des diacritiques) garantit que `épaules` == `epaules`, `trapèzes` == `trapezes`, etc.
- Les synonymes composés (ex : `bas du dos`, `grand dorsal`, `avant-bras`) sont triés par longueur décroissante pour être testés en premier, évitant qu'un sous-mot (ex : `dos`) soit détecté à leur place.
- La suppression du synonyme dans le nom est insensible à la casse.
- La chaîne résultante est nettoyée des espaces multiples et des espaces en début/fin.

**Exemple d'utilisation** :
```ts
const result = detector.detect('Curl biceps haltères');
// result.muscleGroup === MuscleGroup.Biceps
// result.cleanedName === 'Curl haltères'

const result2 = detector.detect('Développé couché pecs');
// result2.muscleGroup === MuscleGroup.Pectoraux
// result2.cleanedName === 'Développé couché'
```

---

### 10.2 `AutocompleteService` — Détail complet

**Fichier** : `src/app/core_logic/session-detail/autocomplete.service.ts`

- Toujours synchrone en apparence (résultat rapide depuis localStorage).
- La méthode `getSuggestions(prefix)` est appelée à chaque frappe clavier (pas de debounce nécessaire grâce à localStorage synchrone).
- La méthode `getLastParams(exerciseName)` retourne les paramètres `{ weightKg, sets, reps, breakDurationSeconds }` de la **dernière occurrence** en date de cet exercice.
- La correspondance des noms est stricte (pas de fuzzy matching) : `startsWith` insensible à la casse.

---

### 10.3 `SessionChronoService` — Persistance en arrière-plan

**Fichier** : `src/app/core_logic/chrono/session-chrono.service.ts`

**Mécanisme de persistance** :
- Lors du `start()`, la valeur `Date.now()` est sauvegardée dans `localStorage` sous la clé `'egn_chrono_start'`.
- Lors de la navigation entre pages, le service (singleton `providedIn: 'root'`) reste en mémoire et l'`intervalId` continue de tourner.
- Si l'application est rechargée (F5, fermeture/réouverture de l'onglet), le constructeur du service appelle `resume()`, qui lit le timestamp depuis le localStorage et recalcule le temps écoulé.
- La clé `'egn_chrono_start'` est supprimée uniquement lors de l'appel à `stop()`.

**Précisions** :
- Le `setInterval` utilise `Date.now() - startTime` pour calculer le temps écoulé (et non un simple incrément de 1 par seconde) afin de compenser les éventuels décalages.
- Si aucune clé n'est présente dans le localStorage au démarrage, `resume()` ne fait rien.

---

### 10.4 `LongPressDirective` — Implémentation

**Fichier** : `src/app/primary_adapters/shared/long-press.directive.ts`

```ts
@Directive({
  selector: '[longPress]',
  standalone: true,
})
export class LongPressDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly longPress = output<void>();

  private readonly THRESHOLD_MS = 700;
  private destroy$ = new Subject<void>();

  constructor() {
    const nativeEl = this.el.nativeElement;

    fromEvent<PointerEvent>(nativeEl, 'pointerdown').pipe(
      switchMap(() =>
        timer(this.THRESHOLD_MS).pipe(
          takeUntil(
            merge(
              fromEvent(nativeEl, 'pointerup'),
              fromEvent(nativeEl, 'pointercancel'),
              fromEvent(nativeEl, 'pointermove').pipe(
                filter((e: PointerEvent) => Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5)
              )
            )
          )
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(() => this.longPress.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Précisions** :
- `switchMap` annule le timer précédent si un nouveau `pointerdown` survient.
- `pointermove` avec seuil de 5px permet d'annuler si l'utilisateur fait défiler.
- La directive émet `(longPress)` après 700 ms de pression sans mouvement ni relâchement.
- Le clic normal (inférieur à 700 ms) n'émet rien.

---

### 10.5 `DrumPickerComponent` — Implémentation détaillée

**Fichier** : `src/app/primary_adapters/shared/drum-picker.component.ts`

**Structure HTML** :
```html
<div class="drum-picker" #container (scroll)="onScroll()">
  <div class="drum-item phantom"></div> <!-- padding top -->
  @for (value of values(); track value) {
    <div class="drum-item" [class.active]="value === selectedValue()">
      {{ value }}{{ unit() }}
    </div>
  }
  <div class="drum-item phantom"></div> <!-- padding bottom -->
</div>
```

**CSS critique** :
```scss
.drum-picker {
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  height: 200px; // Affiche 5 items (5 × 40px)
  -webkit-overflow-scrolling: touch;
}

.drum-item {
  height: 40px;
  scroll-snap-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, opacity 0.15s;

  &.active {
    transform: scale(1.2);
    font-weight: bold;
    opacity: 1;
  }

  &:not(.active) {
    opacity: 0.4;
  }
}
```

**Logique TypeScript** :
```ts
readonly ITEM_HEIGHT = 40;

onScroll(): void {
  const scrollTop = this.container.nativeElement.scrollTop;
  const activeIndex = Math.round(scrollTop / this.ITEM_HEIGHT);
  const value = this.values()[activeIndex];
  if (value !== this.selectedValue()) {
    this.valueChange.emit(value);
  }
}

ngAfterViewInit(): void {
  // Positionner le scroll sur la valeur initiale
  const idx = this.values().indexOf(this.selectedValue());
  if (idx >= 0) {
    this.container.nativeElement.scrollTop = idx * this.ITEM_HEIGHT;
  }
}
```

---

### 10.6 `ConfirmDialogComponent` — Implémentation

**Fichier** : `src/app/primary_adapters/shared/confirm-dialog.component.ts`

Modal simple sans dépendance à Angular CDK (afin de minimiser les dépendances).

**Template** :
```html
<div class="overlay" (click)="onOverlayClick()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <p>{{ message() }}</p>
    <div class="actions">
      <button class="btn-cancel" (click)="cancelled.emit()">Annuler</button>
      <button class="btn-confirm" (click)="confirmed.emit()">Confirmer</button>
    </div>
  </div>
</div>
```

**CSS** :
```scss
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 320px;
  width: 90%;
}
```

Le clic sur l'overlay déclenche `cancelled.emit()` (fermeture sans action).

---

### 10.7 Structure de stockage localStorage — Détail complet

#### Clé `'egn_sessions'`

Tableau JSON de `RawSession[]`. Les exercices ne sont **jamais inclus** dans cet objet.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-03-15T08:30:00.000Z",
    "durationSeconds": 3600,
    "muscleGroup": "Biceps",
    "status": "completed"
  }
]
```

#### Clé `'egn_exercises'`

Tableau JSON de `RawExercise[]`. La relation avec la session est portée par `sessionId`.

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Curl haltères",
    "muscleGroup": "Biceps",
    "weightKg": 15,
    "sets": 4,
    "reps": 10,
    "breakDurationSeconds": 90,
    "status": "validated"
  }
]
```

#### Clé `'egn_chrono_start'`

Entier (timestamp en millisecondes depuis Epoch) représentant l'instant de démarrage du chrono de séance. Absent si aucune séance n'est en cours.

```
"1742041800000"
```

#### Clé `'egn_exercise_chrono'`

Objet JSON contenant l'état du chrono exercice pour la persistance entre navigations.

```json
{
  "breakDuration": 90,
  "startedAt": 1742041800000,
  "mode": "pause"
}
```

---

### 10.8 Génération d'UUID

Utiliser exclusivement l'API native du navigateur :

```ts
const id = crypto.randomUUID(); // Retourne un string UUID v4 standard
```

Aucune bibliothèque externe n'est nécessaire. Cette API est disponible dans tous les navigateurs modernes (Chrome 92+, Firefox 95+, Safari 15.4+). Elle est également disponible dans les contextes non-sécurisés depuis Chrome 113.

---

## 11. Structure complète des fichiers

```
src/
└── app/
    │
    ├── app.component.ts
    ├── app.component.html
    ├── app.component.scss
    ├── app.config.ts                          ← Configuration Angular (provideRouter, etc.)
    ├── app.routes.ts                          ← Routes principales avec lazy loading
    │
    ├── primary_adapters/
    │   │
    │   ├── session-list/
    │   │   ├── session-list.component.ts
    │   │   ├── session-list.component.html
    │   │   ├── session-list.component.scss
    │   │   ├── session-card.component.ts
    │   │   ├── session-card.component.html
    │   │   └── session-card.component.scss
    │   │
    │   ├── session-detail/
    │   │   ├── session-detail.component.ts
    │   │   ├── session-detail.component.html
    │   │   ├── session-detail.component.scss
    │   │   ├── exercise-card.component.ts
    │   │   ├── exercise-card.component.html
    │   │   ├── exercise-card.component.scss
    │   │   ├── exercise-expanded.component.ts
    │   │   ├── exercise-expanded.component.html
    │   │   ├── exercise-expanded.component.scss
    │   │   ├── add-exercise-form.component.ts
    │   │   ├── add-exercise-form.component.html
    │   │   └── add-exercise-form.component.scss
    │   │
    │   ├── session-chrono/
    │   │   ├── session-chrono.component.ts
    │   │   ├── session-chrono.component.html
    │   │   └── session-chrono.component.scss
    │   │
    │   ├── exercise-chrono/
    │   │   ├── exercise-chrono.component.ts
    │   │   ├── exercise-chrono.component.html
    │   │   └── exercise-chrono.component.scss
    │   │
    │   ├── stats-global/
    │   │   ├── stats-global.component.ts
    │   │   ├── stats-global.component.html
    │   │   ├── stats-global.component.scss
    │   │   ├── heatmap.component.ts
    │   │   ├── heatmap.component.html
    │   │   ├── heatmap.component.scss
    │   │   ├── donut-chart.component.ts
    │   │   ├── donut-chart.component.html
    │   │   ├── donut-chart.component.scss
    │   │   ├── exercise-summary-row.component.ts
    │   │   ├── exercise-summary-row.component.html
    │   │   └── exercise-summary-row.component.scss
    │   │
    │   ├── stats-exercise/
    │   │   ├── stats-exercise.component.ts
    │   │   ├── stats-exercise.component.html
    │   │   ├── stats-exercise.component.scss
    │   │   ├── dual-line-chart.component.ts
    │   │   ├── dual-line-chart.component.html
    │   │   └── dual-line-chart.component.scss
    │   │
    │   └── shared/
    │       ├── bottom-nav.component.ts
    │       ├── bottom-nav.component.html
    │       ├── bottom-nav.component.scss
    │       ├── confirm-dialog.component.ts
    │       ├── confirm-dialog.component.html
    │       ├── confirm-dialog.component.scss
    │       ├── context-menu.component.ts
    │       ├── context-menu.component.html
    │       ├── context-menu.component.scss
    │       ├── drum-picker.component.ts
    │       ├── drum-picker.component.html
    │       ├── drum-picker.component.scss
    │       └── long-press.directive.ts
    │
    ├── primary_ports/
    │   │
    │   ├── session-list/
    │   │   ├── get-sessions.usecase.ts
    │   │   ├── create-session.usecase.ts
    │   │   ├── duplicate-session.usecase.ts
    │   │   └── delete-session.usecase.ts
    │   │
    │   ├── session-detail/
    │   │   ├── get-session-detail.usecase.ts
    │   │   ├── add-exercise.usecase.ts
    │   │   ├── update-exercise.usecase.ts
    │   │   ├── validate-exercise.usecase.ts
    │   │   ├── cancel-exercise.usecase.ts
    │   │   ├── delete-exercise.usecase.ts
    │   │   └── end-session.usecase.ts
    │   │
    │   ├── session-chrono/
    │   │   ├── get-session-chrono.usecase.ts
    │   │   └── stop-session-chrono.usecase.ts
    │   │
    │   ├── exercise-chrono/
    │   │   └── exercise-chrono.usecase.ts
    │   │
    │   ├── stats-global/
    │   │   ├── get-global-stats.usecase.ts
    │   │   └── select-month.usecase.ts
    │   │
    │   └── stats-exercise/
    │       └── get-exercise-stats.usecase.ts
    │
    ├── core_logic/
    │   │
    │   ├── session/
    │   │   └── session.service.ts
    │   │
    │   ├── session-detail/
    │   │   ├── exercise.service.ts
    │   │   └── autocomplete.service.ts
    │   │
    │   ├── chrono/
    │   │   └── session-chrono.service.ts
    │   │
    │   ├── exercise-chrono/
    │   │   └── exercise-chrono.service.ts
    │   │
    │   ├── stats-global/
    │   │   └── stats.service.ts
    │   │
    │   ├── stats-exercise/
    │   │   └── exercise-stats.service.ts
    │   │
    │   └── shared/
    │       ├── models.ts                      ← Toutes les interfaces/types/enums du domaine
    │       └── muscle-group-detector.service.ts
    │
    ├── secondary_ports/
    │   │
    │   ├── session/
    │   │   ├── session.repository.interface.ts   ← ISessionRepository + SESSION_REPOSITORY token
    │   │   └── session.repository.ts             ← Implémentation localStorage
    │   │
    │   └── exercise/
    │       ├── exercise.repository.interface.ts  ← IExerciseRepository + EXERCISE_REPOSITORY token
    │       └── exercise.repository.ts            ← Implémentation localStorage
    │
    └── secondary_adapters/
        │
        ├── session/
        │   └── session.mapper.ts
        │
        └── exercise/
            └── exercise.mapper.ts
```

---

## Annexe A — Flux de données complet (exemple : ajout d'un exercice)

```
1. [UI] AddExerciseFormComponent
   └─ L'utilisateur saisit "Curl biceps haltères" et valide

2. [primary_ports] AddExerciseUseCase.execute({ name: "Curl biceps haltères", ... })
   ├─ Appelle MuscleGroupDetectorService.detect("Curl biceps haltères")
   │  └─ Retourne { muscleGroup: MuscleGroup.Biceps, cleanedName: "Curl haltères" }
   ├─ Construit Exercise { id: crypto.randomUUID(), name: "Curl haltères", muscleGroup: Biceps, ... }
   └─ Appelle ExerciseService.add(exercise)

3. [core_logic] ExerciseService.add(exercise)
   └─ Appelle ExerciseRepository.save(exercise) [via InjectionToken]

4. [secondary_ports] ExerciseRepository.save(exercise)
   ├─ Appelle ExerciseMapper.toRaw(exercise) → RawExercise
   └─ Écrit dans localStorage['egn_exercises']

5. [core_logic] ExerciseService met à jour le signal _exercises
   └─ Signal exercises déclenche le re-render du composant

6. [UI] SessionDetailComponent re-render automatiquement
   └─ Le nouvel exercice apparaît dans la liste
```

---

## Annexe B — Gestion des providers Angular

Les `InjectionToken` pour les repositories doivent être enregistrés dans `app.config.ts` :

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { SESSION_REPOSITORY } from './secondary_ports/session/session.repository.interface';
import { SessionRepository } from './secondary_ports/session/session.repository';
import { EXERCISE_REPOSITORY } from './secondary_ports/exercise/exercise.repository.interface';
import { ExerciseRepository } from './secondary_ports/exercise/exercise.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    { provide: SESSION_REPOSITORY, useClass: SessionRepository },
    { provide: EXERCISE_REPOSITORY, useClass: ExerciseRepository },
  ],
};
```

---

## Annexe C — États visuels des exercices

| Statut | Bordure | Tag | Texte | Déclencheur |
|---|---|---|---|---|
| `pending` | Orange (#FF9800) | Orange | Standard | Ajout de l'exercice ou duplication |
| `validated` | Verte (#4CAF50) | Vert | Standard | Clic sur « Valider » |
| `cancelled` | Orange (#FF9800) | Gris (#9E9E9E) | Barré | Clic sur « Annuler » |

---

## Annexe D — Conventions de nommage

| Type | Convention | Exemple |
|---|---|---|
| Composant | `kebab-case.component.ts` | `session-list.component.ts` |
| Use case | `kebab-case.usecase.ts` | `create-session.usecase.ts` |
| Service | `kebab-case.service.ts` | `session.service.ts` |
| Repository interface | `kebab-case.repository.interface.ts` | `session.repository.interface.ts` |
| Repository | `kebab-case.repository.ts` | `session.repository.ts` |
| Mapper | `kebab-case.mapper.ts` | `session.mapper.ts` |
| Modèles domaine | `models.ts` | `core_logic/shared/models.ts` |
| Directive | `kebab-case.directive.ts` | `long-press.directive.ts` |
| InjectionToken | `SCREAMING_SNAKE_CASE` | `SESSION_REPOSITORY` |
| Signal (privé) | `_camelCase` | `_sessions` |
| Signal (public) | `camelCase` | `sessions` |
