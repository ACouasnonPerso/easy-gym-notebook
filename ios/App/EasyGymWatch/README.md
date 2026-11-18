# Easy Gym sur Apple Watch

App watchOS (SwiftUI) embarquée dans l'app iPhone. Cible Xcode : `EasyGymWatch` (watchOS 10+).

## Parcours

1. **Détection automatique** : dès qu'une séance est active sur l'iPhone (statut `active`, créée il y a moins de 12 h), la montre l'affiche (« Séance détectée »).
2. **Aucun exercice sélectionné** : liste des exercices de la séance, on en touche un.
3. **Exercice sélectionné** : tuiles **Chrono** et **Difficulté**, bouton **Exercice suivant** (valide l'exercice et passe au suivant non validé).
4. **Chrono** : entraînement (vert, compte) / repos (orange, décompte avec la durée de repos de l'exercice). Le bouton de droite est l'action principale, déclenchée aussi par le **double tap** (Series 9 / Ultra 2 et plus, watchOS 11+) : démarrer, puis repos, puis série suivante. Fin du repos : vibration, ou notification si l'app n'est pas à l'écran.
5. **Difficulté** : même échelle /20 que l'app. Toucher à nouveau la valeur actuelle l'efface.

## Synchronisation

```
Angular (WatchSyncService) ──snapshot JSON──▶ WatchConnectivityPlugin ──applicationContext──▶ WatchStore
Angular ◀──actions (note, validation)── WatchSessionManager (file persistée) ◀──transferUserInfo── WatchStore
```

- Le contrat JSON est dans `src/app/core_logic/watch/watch.models.ts` et `WatchModels.swift` : modifier les deux ensemble.
- Les actions faites sur la montre sont appliquées tout de suite sur la montre, mises en file côté iPhone (même si l'app web est en veille), puis appliquées par Angular au retour au premier plan. L'iPhone renvoie les ids appliqués (`appliedActionIds`) pour que la montre les retire de sa file.
- Le chrono tourne sur la montre (indépendant du chrono de l'iPhone).
- Les textes viennent des traductions de l'app (clé `watch.*` et `rating.*`). `Labels.swift` ne sert qu'avant la première synchro.

## Tester

1. Ouvrir `ios/App/App.xcodeproj` dans Xcode.
2. Signature : choisir l'équipe pour la cible `EasyGymWatch` (bundle id `easy.gym.notebook.watchkitapp`).
3. Lancer le schéma `App` sur un iPhone appairé à une montre (ou sur un simulateur iPhone appairé à un simulateur Watch), puis le schéma `EasyGymWatch` sur la montre.
4. Créer une séance sur l'iPhone : elle apparaît sur la montre.

À chaque nouvelle version, garder `MARKETING_VERSION` et `CURRENT_PROJECT_VERSION` identiques entre les cibles `App` et `EasyGymWatch` (sinon App Store Connect refuse l'envoi).
