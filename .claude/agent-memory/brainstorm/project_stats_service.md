---
name: stats-service analytics brainstorm
description: Décisions de conception pour le service de télémétrie anonyme Firestore — UID localStorage, fire-and-forget, ports/adapters pattern
type: project
---

Plan de télémétrie anonyme Firestore finalisé le 2026-03-26 et sauvegardé dans
`.claude/brainstorming/stats-service.md`.

Décisions clés arrêtées par l'utilisateur :
- UID anonyme en localStorage (`egn_anon_uid`), persisté indéfiniment, pas de récupération en cas de perte
- Document Firestore `sessions/{sessionId}` créé au démarrage de la session, mis à jour incrémentalement
- Document agrégé `user_stats/{uid}` mis à jour à la complétion (increment Firestore)
- `navigator.language` pour détecter le pays (ex: `"fr-FR"` → `"FR"`)
- Échec réseau ignoré silencieusement — aucun retry, aucun feedback UI
- Noms d'exercices non considérés comme données personnelles — pas de contrainte RGPD
- Duplication de session = nouvelle entrée Firestore indépendante

**Why:** Feature de monitoring d'usage produit sans authentification ni données personnelles.

**How to apply:** Les trois use cases d'entrée (CreateSession, DuplicateSession, EndSession)
appellent `AnalyticsService` en fire-and-forget. L'implémentation suit le pattern
ports/adapters existant (`secondary_ports/analytics/` + `secondary_adapters/analytics/`).
Le nouveau dossier `core_logic/analytics/` contient `AnonymousIdService` et `AnalyticsService`.
