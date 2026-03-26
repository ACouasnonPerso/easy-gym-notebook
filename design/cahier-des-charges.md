# Cahier des Charges — Application Musculation
*Version 1.1 — Mars 2026*

---

## 1. Objectif

L'application permet de **gagner du temps pendant les séances de musculation** et de **sauvegarder ses records**. Elle centralise la gestion des séances, des exercices et des statistiques de progression dans une interface mobile rapide.

---

## 2. Structure générale

Trois zones accessibles depuis la barre de navigation en bas de chaque écran :

- **Sessions** — liste des séances passées et en cours
- **Chrono** — chronomètre de la séance active
- **Stats** — tableau de bord de progression

---

## 3. Navigation entre les pages

| Depuis | Action | Vers | Note |
|--------|--------|------|------|
| Liste Sessions | Appui sur « + » | Page Session | Crée la séance et lance le chrono de séance automatiquement |
| Liste Sessions | Appui sur une session | Page Session | Ouvre la session en lecture/édition |
| Liste Sessions | Appui long sur une session | Page Session | Propose les options : Dupliquer ou Supprimer |
| Liste Sessions | Dupliquer (depuis appui long) | Page Session | Crée une nouvelle session à la date du jour, exercices copiés en état « non validé », chrono de séance lancé automatiquement |
| Liste Sessions | Supprimer (depuis appui long) | Liste Sessions | Popup de confirmation avant suppression |
| Page Session | Appui sur « + » | Ajout exercice | Ouvre le formulaire d'ajout |
| Page Session | Appui sur un exercice | Exercice étendu | Déplie les paramètres et les actions |
| Exercice étendu | « Chronomètre » | Page Chrono exercice | Configure le chrono avec le temps de pause de l'exercice |
| Exercice étendu | « Page exercice » | Stats exercice | Historique et courbes de progression |
| Exercice étendu | « Valider » | Page Session | Marque en vert, met à jour les stats |
| Exercice étendu | « Annuler » | Page Session | Marque en orange (non réalisé) |
| Exercice étendu | « Supprimer » | Page Session | Popup de confirmation avant suppression |
| Page Session | Bouton « End » | Liste Sessions | Arrête le chrono de séance et sauvegarde |
| Page Session | Nav bas « Chrono » | Page Chrono séance | Affiche le chrono de séance en plein écran |
| Page Chrono séance | « STOP » | Page Session | Arrête et enregistre le temps de séance |
| Page Chrono séance | « Go Break » | Page Chrono exercice | Lance le chrono de break/exercice |
| Page Chrono exercice | « Go Break » | Page Chrono exercice | Repasse en mode Pause (relance le décompte) |
| Page Chrono exercice | « Reset » | Page Chrono exercice | Remet le chrono à zéro sur le mode actuel |
| Stats globales | Sélection d'un mois | Stats globales | Filtre toutes les données sur le mois choisi |
| Stats globales | Appui sur un exercice | Stats exercice | Ouvre la page de stats de cet exercice |
| Stats exercice | Bouton « Back » | Page précédente | Retour à la page d'origine |

---

## 4. Détail des pages

### 4.1 Liste des Sessions

Page d'accueil. Affiche toutes les séances de la plus récente à la plus ancienne.

**Contenu d'une carte de session**
- Date de la séance
- Tag du groupe musculaire principal
- Poids total soulevé, nombre d'exercices, temps total

**Actions**
- **Créer** (bouton « + ») → redirige automatiquement vers la Page Session, le chrono de séance démarre immédiatement
- **Dupliquer** (appui long → « Dupliquer ») → crée une nouvelle séance datée d'aujourd'hui, recopie tous les exercices en état « non validé », ouvre directement la Page Session et lance le chrono de séance
- **Supprimer** (appui long → « Supprimer ») → popup de confirmation avant suppression définitive

---

### 4.2 Page Session

Affiche le détail d'une séance : en-tête, liste des exercices, zone d'ajout.

**En-tête**
- Date, tag groupe musculaire, poids total, nombre d'exercices
- Chrono de séance affiché en grand
- Bouton **« Break »** : ouvre la Page Chrono exercice configurée avec le temps de pause de l'exercice précédent
- Bouton **« End »** : arrête le chrono et sauvegarde. Si le chrono a été oublié, le temps est modifiable manuellement avant validation.

**Liste des exercices**

Chaque exercice est affiché en carte compacte (nom, tag, poids, séries, break, répétitions). Un appui sur la carte l'étend et affiche :
- Le **sélecteur de paramètres** (poids, séries, break, répétitions) — colonne scrollable avec la valeur active mise en évidence
- Bouton **« Chronomètre »** : ouvre la Page Chrono exercice, préconfigurée avec le temps de break de cet exercice
- Bouton **« Valider »** : marque l'exercice comme réalisé → passe en vert et actualise les stats
- Bouton **« Annuler »** : marque l'exercice comme non réalisé → passe en orange
- Bouton **« Page exercice »** : ouvre la page de stats de cet exercice
- Bouton **« Supprimer »** : supprime l'exercice avec popup de confirmation

**Ajout d'un exercice**

L'appui sur « + » ouvre un formulaire :
- Champ nom avec **auto-complétion** sur les exercices déjà enregistrés
- Le **groupe musculaire est détecté automatiquement** dans le nom saisi. Une fois détecté, il est retiré du titre et affiché en tag.
- Paramètres par défaut : poids, séries, durée de break, répétitions

---

### 4.3 Page Chrono de séance

Affiche le chrono global de la séance en cours en plein écran. Accessible depuis la navigation basse.

**Contenu**
- Temps écoulé depuis le début de la séance, affiché en grand
- Indicateur visuel de progression (anneau)
- Statut actuel : « Training »

**Actions**
- **« Go Break »** : ouvre la Page Chrono exercice
- **« STOP »** : arrête le chrono de séance et renvoie vers la Page Session
- En cas d'oubli, le temps est modifiable manuellement avant validation

---

### 4.4 Page Chrono exercice

Chrono dédié à la gestion des pauses entre séries. Accessible depuis un exercice étendu (bouton « Chronomètre ») ou depuis la Page Chrono séance (bouton « Go Break »). Il est préconfiguré avec le temps de break défini sur l'exercice concerné.

**Deux modes qui alternent automatiquement**

**Mode Pause** — décompte depuis le temps de break configuré jusqu'à 0
- Affiche le temps restant en grand
- Anneau de progression qui se vide
- Statut : « Break »
- Les 3 dernières secondes : le temps clignote
- À 0 seconde : bip sonore, bascule automatiquement en mode Exercice

**Mode Exercice** — compteur qui monte depuis 0
- Affiche le temps écoulé depuis la reprise
- Statut : « Training »

**Actions disponibles dans les deux modes**
- **« Go Break »** : repasse immédiatement en mode Pause et relance le décompte depuis le début
- **« Reset »** : remet le chrono à zéro sur le mode actuel (utile si on a oublié de reprendre)

---

### 4.5 Page Statistiques globales

Agrège toutes les sessions et exercices pour une vue de progression.

**Sélecteur de mois** : menu déroulant pour choisir le mois affiché (défaut : mois en cours)

**Contenu**
- **Heatmap de régularité** : grille semaines × jours, colorée selon la présence d'une séance
- **Résumé du mois** : poids total, nombre de sessions, temps total
- **Moyenne par semaine** : poids moyen, sessions/semaine, temps moyen
- **Graphique muscles travaillés** : répartition en donut des groupes musculaires sollicités
- **Liste des exercices** : tous les exercices réalisés sur le mois, regroupés par nom, avec poids max, volume total et nombre d'occurrences. Chaque ligne est cliquable et redirige vers la page de stats de cet exercice.

---

### 4.6 Page Statistiques d'un exercice

Accessible depuis un exercice étendu (« Page exercice ») ou depuis la liste des exercices dans les stats globales. Regroupe tous les enregistrements portant le même nom.

**Contenu**
- Nom de l'exercice en titre
- **Graphique double courbe** : évolution du poids et du volume (poids × répétitions × séries) dans le temps
- **Historique** : liste de toutes les occurrences avec date, poids, séries, répétitions

---

## 5. Comportements transversaux

### 5.1 Groupes musculaires

Le système reconnaît automatiquement les groupes musculaires dans le nom de l'exercice. Le terme détecté est retiré du titre et converti en tag affiché séparément.

| Groupe musculaire | Synonymes reconnus |
|-------------------|--------------------|
| Biceps | biceps, bibi |
| Triceps | triceps, tritri |
| Fessier | fessier, fesses, booty |
| Ischio-jambiers | ischio, ischios |
| Quadriceps | quadriceps, quadri |
| Trapèzes | trapèzes, traps |
| Abdominaux | abdos, core, sangle |
| Lombaires | lombaires, lombs, bas du dos |
| Mollets | mollets, mollos |
| Dos | dos, grand dorsal, dorsaux, lats |
| Épaules | épaules, deltos, deltoïdes |
| Pectoraux | pecs, poitrine |
| Avant-bras | avant-bras, grip |

### 5.2 Auto-complétion

À la saisie du nom d'un exercice, l'application propose en temps réel les exercices déjà enregistrés correspondants. Sélectionner une suggestion préremplie automatiquement les paramètres de la dernière occurrence de cet exercice.

### 5.3 Chrono de séance

Démarre automatiquement à la création d'une séance. Tourne en arrière-plan pendant toute la navigation. Ne s'arrête que sur action explicite (« End » ou « STOP »). En cas d'oubli, le temps est corrigeable manuellement à la clôture.

### 5.4 Chrono exercice (break / reprise)

Indépendant du chrono de séance. Préconfiguré avec le temps de break de l'exercice concerné. Alterne automatiquement entre mode Pause (décompte) et mode Exercice (compteur). Signal sonore et clignotement dans les 3 dernières secondes de la pause. Bascule automatiquement en mode Exercice à la fin du décompte.

### 5.5 Popups de confirmation

Toute suppression (séance ou exercice) déclenche une popup de confirmation avant action irréversible.

### 5.6 États visuels des exercices

| État | Déclencheur | Rendu visuel |
|------|-------------|--------------|
| Par défaut | Exercice ajouté, non encore réalisé | Bordure orange, texte standard |
| Validé | Bouton « Valider » pressé | Bordure et tag verts |
| Annulé | Bouton « Annuler » pressé | Bordure orange, tag grisé |
