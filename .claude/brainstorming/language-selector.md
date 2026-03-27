# Language Selector

## What this feature does
Un sélecteur de langue positionné en haut à droite du composant `session-list` permet à l'utilisateur de basculer entre le français et l'anglais. Le changement est effectif immédiatement sur toute l'application via ngx-translate, et la préférence est persistée entre les sessions.

## Relation to cahier des charges
Gap : le cahier des charges ne mentionne pas de gestion de langue. Cette feature est une extension transversale qui n'entre pas en conflit avec les specs existantes. Elle enrichit la surface de la page `Liste des Sessions` (section 4.1) sans en modifier le comportement fonctionnel.

## Affected areas

**primary_adapters/session-list**
- `session-list.component.ts` — importer et injecter le nouveau use case ; exposer la langue courante et la méthode de changement
- `session-list.component.html` — ajouter le sélecteur de langue dans l'en-tête, à droite du titre
- `session-list.component.scss` — mettre en page le header (titre à gauche, sélecteur à droite) avec flexbox

**primary_ports** (nouveau dossier `language`)
- `set-language.usecase.ts` — déclenche le changement de langue via le service métier

**core_logic** (nouveau dossier `language`)
- `language.service.ts` — orchestre le changement via `TranslateService`, persiste la préférence dans `localStorage`, expose la langue active via un `signal<'fr' | 'en'>`

**app.config.ts**
- Lire la langue persistée dans `localStorage` au démarrage et la passer à `provideTranslateService({ lang: ... })`

## New elements to create

| Couche | Fichier |
|---|---|
| `primary_ports/language/` | `set-language.usecase.ts` |
| `core_logic/language/` | `language.service.ts` |

Aucun nouveau composant dédié n'est nécessaire : le sélecteur est un élément natif `<select>` ou deux boutons intégrés directement dans le template de `session-list`.

## State and data flow

```
SessionListComponent
  appelle ──► SetLanguageUseCase.execute(lang)
                    │
                    ▼
              LanguageService
                - appelle TranslateService.use(lang)
                - persiste lang dans localStorage
                - met à jour signal<ActiveLang>
                    │
                    ▼
              TranslateService (ngx-translate)
                - met à jour tous les pipes | translate
                  (re-render automatique via Angular CD)
```

Au démarrage (`app.config.ts`) : lire `localStorage.getItem('lang') ?? 'fr'` et l'injecter dans `provideTranslateService({ lang })` pour que la bonne langue soit active dès le premier rendu.

La langue active exposée par `LanguageService` est un `signal<'fr' | 'en'>` readonly, consommé par `SessionListComponent` pour afficher l'état courant du sélecteur (bouton actif).

## Edge cases to handle

- **Valeur invalide en localStorage** : si la valeur stockée n'est pas `'fr'` ou `'en'`, `LanguageService` retombe sur `'fr'` (fallback déjà configuré dans `app.config.ts`)
- **Langue déjà active** : `LanguageService` ignore l'appel si la langue demandée est déjà la langue courante (pas de re-chargement inutile)
- **Fichier de traduction manquant** : ngx-translate utilise déjà `fallbackLang: 'fr'` — comportement de repli garanti

## Testing strategy

- **Unit — `LanguageService`** : vérifier que `TranslateService.use()` est appelé avec la bonne valeur, que `localStorage` est mis à jour, et que le signal reflète la nouvelle langue
- **Unit — `SetLanguageUseCase`** : vérifier la délégation au service
- **Component — `SessionListComponent`** : vérifier que le sélecteur est rendu, que cliquer sur une langue déclenche le use case, et que le bouton correspondant à la langue active porte une classe CSS marquée
