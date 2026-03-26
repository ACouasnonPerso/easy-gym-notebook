# Task 08 — Firestore Security Rules

> ⚠️ Ce fichier remplace l'ancienne tâche "Firebase Stats Service" (qui est maintenant le Task 05 — AnalyticsService).

**Agent :** `/dev`
**Dépendances :** aucune (peut être fait indépendamment)

---

## Objectif

Définir les règles de sécurité Firestore qui autorisent uniquement les écritures anonymes structurées et interdisent toute lecture depuis le client.

---

## Contexte

L'app n'utilise pas Firebase Auth. Les documents sont écrits directement depuis le client Angular avec un UID auto-généré. Les règles doivent :
- Autoriser les écritures si les données respectent le schéma attendu
- Interdire toutes les lectures
- Refuser toute autre collection par défaut

---

## Fichier à créer

### `firestore.rules` (à la racine du projet)

#### Collection `sessions`

- **create** : autorisé si :
  - `uid` est une string de longueur 36 (UUID v4)
  - `status` est `"active"` ou `"completed"`
  - `exerciseNames` est une liste
  - `durationSeconds` est un nombre

- **update** : autorisé si :
  - `resource.data.uid == request.resource.data.uid` (empêche la réattribution)
  - `exerciseNames` est une liste

- **read / delete** : toujours refusé

#### Collection `user_stats`

- **write** (create + update) : autorisé si :
  - Le document ID est une string de longueur 36 (l'UID)
  - `totalSessions` est un nombre
  - `totalDurationSeconds` est un nombre

- **read / delete** : toujours refusé

#### Toutes les autres collections

- Tout refusé via `match /{document=**}` en catch-all.

---

## Structure

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /sessions/{docId} {
      allow create: if request.resource.data.uid is string
                    && request.resource.data.uid.size() == 36
                    && request.resource.data.exerciseNames is list
                    && request.resource.data.durationSeconds is number;
      allow update: if resource.data.uid == request.resource.data.uid
                    && request.resource.data.exerciseNames is list;
      allow read, delete: if false;
    }

    match /user_stats/{uid} {
      allow write: if uid.size() == 36
                   && request.resource.data.totalSessions is number
                   && request.resource.data.totalDurationSeconds is number;
      allow read, delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Déploiement

```bash
firebase deploy --only firestore:rules
```

Fichier `firebase.json` requis à la racine, avec :
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

---

## Limitations connues

- Sans Firebase Auth, impossible de valider que l'UID appartient à l'utilisateur qui écrit.
- Ces règles sont une **protection structurelle** uniquement.
- Un utilisateur malveillant pourrait écrire avec n'importe quel UUID valide — acceptable pour du tracking anonyme non critique.
