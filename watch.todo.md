# Apple Watch : TODO

Suivi de ce qu'il reste à faire pour sortir l'app Apple Watch. Le fonctionnement est décrit dans [ios/App/EasyGymWatch/README.md](ios/App/EasyGymWatch/README.md).

Branche : `claude/admiring-heisenberg-71ake9`

## Déjà fait

- [x] App watchOS SwiftUI (cible `EasyGymWatch`) : détection auto, liste, exercice, chrono avec double tap, difficulté /20
- [x] Pont iPhone ↔ montre (plugin Capacitor `WatchConnectivity` + `WatchSessionManager`)
- [x] Synchro Angular (`WatchSyncService`) avec tests
- [x] Entraînement HealthKit (ouverture auto depuis l'iPhone, arrière-plan, cœur, enregistrement dans Santé)
- [x] Corrections de la revue de code (7 points)

## 1. Premier build sur le Mac (bloquant)

Le code Swift n'a jamais été compilé (écrit sous Linux).

- [ ] `npm install`, `npm run build`, `npx cap sync ios`
- [ ] Ouvrir `ios/App/App.xcodeproj` et vérifier que la cible `EasyGymWatch` apparaît
- [ ] Compiler le schéma `App` (iPhone) et corriger les erreurs éventuelles (`WatchSessionManager`, `WatchConnectivityPlugin`, `WatchWorkoutLauncher`, `MainViewController`)
- [ ] Compiler le schéma `EasyGymWatch` et corriger les erreurs éventuelles
- [ ] Vérifier que l'app iPhone se lance toujours normalement (storyboard pointe maintenant sur `MainViewController`)

## 2. Compte Apple Developer et signature

- [ ] Signing & Capabilities : choisir l'équipe pour `App` et `EasyGymWatch`
- [ ] Vérifier que la capacité **HealthKit** est active sur les deux cibles (`easy.gym.notebook` et `easy.gym.notebook.watchkitapp`)
- [ ] Vérifier sur developer.apple.com que les deux App IDs ont HealthKit coché et que les profils sont régénérés
- [ ] Vérifier le mode d'arrière-plan **Workout processing** sur la cible `EasyGymWatch` (déclaré dans `EasyGymWatch/Info.plist`)

## 3. Tests sur simulateurs (iPhone + Watch appairés)

- [ ] Créer une séance sur l'iPhone : « Séance détectée » s'affiche sur la montre
- [ ] Aucun exercice sélectionné : la liste s'affiche, toucher un exercice ouvre l'écran exercice
- [ ] Noter un exercice sur la montre : la note apparaît sur l'iPhone
- [ ] Toucher la note actuelle à nouveau : elle s'efface sur les deux
- [ ] « Exercice suivant » : l'exercice est validé sur l'iPhone, la montre passe au suivant
- [ ] Dernier exercice validé : carte « Séance terminée » sur la montre
- [ ] Terminer la séance sur l'iPhone : la montre affiche « Aucune séance en cours »
- [ ] Ajouter / modifier / supprimer un exercice sur l'iPhone : la montre se met à jour
- [ ] Changer la date de la séance sur l'iPhone : la séance reste visible sur la montre
- [ ] Changer la langue et l'unité de poids (kg / lb) sur l'iPhone : la montre suit

## 4. Tests sur vrais appareils

- [ ] **Double tap** (Series 9 / Ultra 2 ou plus récente, watchOS 11+) : démarrer, puis repos, puis série suivante
- [ ] Fin du repos sur l'écran chrono : vibration et passage à la série suivante
- [ ] Fin du repos sur un autre écran (exercice, liste) : vibration aussi
- [ ] Fin du repos poignet baissé : vibration (entraînement HealthKit actif)
- [ ] iPhone verrouillé dans la poche : noter et valider sur la montre, puis déverrouiller l'iPhone : tout est appliqué
- [ ] Montre hors de portée (mode avion iPhone) : actions gardées puis envoyées au retour
- [ ] Quitter de force l'app montre en pleine séance : elle reprend la séance et l'entraînement

## 5. HealthKit

- [ ] Démarrer une séance sur l'iPhone : l'app s'ouvre seule sur la montre (une seule fois par séance)
- [ ] Autorisations Santé demandées sur l'iPhone et sur la montre la première fois
- [ ] Refuser les autorisations : l'app montre fonctionne quand même (sans entraînement)
- [ ] Fréquence cardiaque affichée dans le chrono
- [ ] Séance terminée sur l'iPhone : l'entraînement est enregistré dans Santé (Renforcement musculaire)
- [ ] Bouton « Terminer l'entraînement » sur la montre : entraînement enregistré, il ne redémarre pas pour cette séance
- [ ] Séance de moins de 2 min : aucun entraînement enregistré
- [ ] Séance oubliée : l'entraînement s'arrête après 4 h

## 6. App Store Connect

- [ ] Garder `MARKETING_VERSION` et `CURRENT_PROJECT_VERSION` identiques entre `App` et `EasyGymWatch` (actuellement 1.0.4 / 5)
- [ ] Captures d'écran Apple Watch (taille exigée par App Store Connect)
- [ ] Confidentialité de l'app : déclarer les données Santé et Forme (fréquence cardiaque, entraînements), non partagées, non utilisées pour le suivi
- [ ] Notes pour la review Apple : expliquer l'usage de HealthKit (entraînement de musculation suivi depuis la montre)
- [ ] Traduire les textes d'autorisation Santé (`NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`) : ils sont en anglais dans `App/Info.plist` et `EasyGymWatch/Info.plist` (ajouter des `InfoPlist.strings` si besoin)
- [ ] Mettre à jour la description de l'App Store (mentionner l'Apple Watch)

## 7. Traductions

- [ ] `npm run translate` pour générer les clés `watch.*` dans les 13 autres langues (seuls fr, en et es sont faits)

## 8. Dette du repo (hors montre)

- [ ] Ajouter `fake-indexeddb` en devDependency (utilisé par `exercise-photo.repository.spec.ts` mais absent de `package.json`)
- [ ] Corriger les tests `AppComponent` qui échouent déjà (`No provider for ExercisePhotoService`)

## Idées pour plus tard

- [ ] Complication / widget Smart Stack (séance en cours, repos restant)
- [ ] Calories actives affichées sur la montre (déjà collectées par `WorkoutManager`)
- [ ] Terminer la séance depuis la montre (pas seulement l'entraînement)
- [ ] Synchroniser le chrono de la montre avec celui de l'iPhone
- [ ] Modifier poids / répétitions depuis la montre avec la couronne
