# Task 02 — AnonymousIdService

**Agent :** `/tdd-auto`
**Dépendances :** aucune (indépendant de Firebase)

---

## Objectif

Créer un service Angular qui génère et persiste un identifiant utilisateur anonyme en localStorage, et qui détecte le pays de l'utilisateur via `navigator.language`.

---

## Fichier à créer

### `src/app/core_logic/analytics/anonymous-id.service.ts`

**Classe :** `AnonymousIdService`
**Décorateur :** `@Injectable({ providedIn: 'root' })`
**Couche :** `core_logic` — logique pure, aucune connaissance de l'UI ni de Firebase

---

## Clé localStorage

```
egn_anon_uid
```

---

## Méthode publique `getId(): string`

- Lit `localStorage.getItem('egn_anon_uid')`
- Si la valeur existe et est non vide : la retourne directement
- Sinon : génère un UUID avec `crypto.randomUUID()`, le stocke via `localStorage.setItem('egn_anon_uid', uid)`, puis le retourne
- **Synchrone** et **idempotente** : retourne toujours le même UID pour un même navigateur

---

## Méthode publique `getCountry(): string`

- Calcule : `navigator.language.split('-')[1]?.toUpperCase() ?? 'unknown'`
- Retourne le code pays ISO 3166-1 alpha-2 (ex: `"FR"`, `"US"`)
- Si `navigator.language` ne contient pas de région (ex: `"fr"`), retourne `"unknown"`
- **Synchrone**, aucun appel réseau, aucun cache localStorage

---

## Tests unitaires

Fichier : `src/app/core_logic/analytics/anonymous-id.service.spec.ts`

### `getId()`
1. Si `egn_anon_uid` est absent → génère un UUID et le stocke
2. Si `egn_anon_uid` est présent → retourne la valeur existante sans la modifier
3. Deux appels successifs retournent le même UID
4. L'UID généré est une string non vide de 36 caractères (format UUID v4)

### `getCountry()`
1. `"fr-FR"` → retourne `"FR"`
2. `"en-US"` → retourne `"US"`
3. `"fr"` (sans région) → retourne `"unknown"`
4. `undefined` / absent → retourne `"unknown"`

**Stratégie de mock :** `spyOn(localStorage, 'getItem')` / `setItem` pour `getId()`. Pour `getCountry()`, mocker `navigator.language` via `Object.defineProperty(navigator, 'language', ...)`.

---

## Notes

- `crypto.randomUUID()` est disponible nativement dans tous les navigateurs modernes (déjà utilisé dans `create-session.usecase.ts`).
- Aucune dépendance injectée dans ce service.
- Ne pas exposer de méthode pour réinitialiser l'UID — permanent par conception.
- La perte du localStorage entraîne une rupture de continuité acceptée.
