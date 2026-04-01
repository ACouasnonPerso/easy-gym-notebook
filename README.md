# Easy Gym Notebook

## Configuration des fichiers sensibles

Ces fichiers ne sont pas versionnés (`.gitignore`). Ils doivent être obtenus depuis la [console Firebase](https://console.firebase.google.com) et placés manuellement aux emplacements ci-dessous.

### Fichiers requis

| Fichier | Emplacement dans le projet | Comment l'obtenir |
|---|---|---|
| `environment.ts` | `src/environments/environment.ts` | Console Firebase → Paramètres du projet → ton app web → **Voir la configuration** |
| `environment.prod.ts` | `src/environments/environment.prod.ts` | Même source, adapter `production: true` |
| `firebase.config.ts` | `src/environments/firebase.config.ts` | Même source |
| `google-services.json` | `android/app/google-services.json` | Console Firebase → Paramètres du projet → ton app Android → **Télécharger google-services.json** |
| `GoogleService-Info.plist` | `ios/App/App/GoogleService-Info.plist` | Console Firebase → Paramètres du projet → ton app iOS → **Télécharger GoogleService-Info.plist** |
