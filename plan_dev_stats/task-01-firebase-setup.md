# Task 01 — Firebase Setup

**Agent :** `/dev`
**Dépendances :** aucune

---

## Objectif

Installer le SDK Firebase vanilla, configurer le projet Firestore, et exposer l'instance `Firestore` via l'injection de dépendances Angular dans `app.config.ts`. Lier le token `ANALYTICS_REPOSITORY` à l'implémentation `FirestoreAnalyticsRepository`.

---

## Décisions techniques

- **SDK :** Firebase SDK vanilla (`firebase` / `firebase/firestore`) — pas d'AngularFire, pour un bundle plus léger.
- **Pas d'authentification Firebase** — les écritures sont anonymes, identifiées par l'UID local.
- La config Firebase est lue depuis `src/environments/environment.ts`.

---

## Tâches concrètes

### 1. Installation

```bash
npm install firebase
```

### 2. Fichier `environment.ts`

Ajouter les clés Firebase dans `src/environments/environment.ts` et `environment.prod.ts` :

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: '...',
    authDomain: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...'
  }
};
```

### 3. `app.config.ts` — Token Firestore

Initialiser l'app Firebase et exposer `Firestore` comme valeur injectable :

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { InjectionToken } from '@angular/core';
import { environment } from '../environments/environment';

export const FIRESTORE = new InjectionToken<Firestore>('Firestore');

const firebaseApp = initializeApp(environment.firebase);

// Dans appConfig.providers :
{ provide: FIRESTORE, useValue: getFirestore(firebaseApp) }
```

### 4. `app.config.ts` — Provider `ANALYTICS_REPOSITORY`

```typescript
import { ANALYTICS_REPOSITORY } from './secondary_ports/analytics/analytics.repository.interface';
import { FirestoreAnalyticsRepository } from './secondary_adapters/analytics/firestore-analytics.repository';

// Dans appConfig.providers :
{ provide: ANALYTICS_REPOSITORY, useClass: FirestoreAnalyticsRepository }
```

---

## Critères de succès

- `npm install` sans erreur
- `app.config.ts` compile sans erreur TypeScript
- `FIRESTORE` injectable dans `FirestoreAnalyticsRepository`
- `ANALYTICS_REPOSITORY` injectable dans `AnalyticsService`

---

## Fichiers créés / modifiés

- `package.json` — ajout de `firebase`
- `src/environments/environment.ts` — ajout config Firebase
- `src/environments/environment.prod.ts` — ajout config Firebase
- `src/app/app.config.ts` — ajout providers `FIRESTORE` et `ANALYTICS_REPOSITORY`
