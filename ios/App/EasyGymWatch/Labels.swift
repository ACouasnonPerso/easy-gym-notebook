import Foundation

/// Texts come from the iPhone (same translations as the app, key "watch.*").
/// These fallbacks are used only before the first sync.
enum Labels {
    private static let french: [String: String] = [
        "sessionTitle": "Séance",
        "sessionDetected": "Séance détectée",
        "startedOnIphone": "Lancée sur iPhone",
        "exercisesCount": "exercices",
        "followSession": "Suivre la séance",
        "pickExercise": "Choisis un exercice",
        "chrono": "Chrono",
        "difficulty": "Difficulté",
        "rate": "Noter",
        "ready": "Prêt",
        "readyQuestion": "PRÊT ?",
        "nextExercise": "Exercice suivant",
        "training": "ENTRAÎNEMENT",
        "rest": "REPOS",
        "paused": "EN PAUSE",
        "startButton": "Go",
        "restButton": "Repos",
        "setButton": "Série",
        "doubleTapStart": "Double tap : démarrer",
        "doubleTapRest": "Double tap : repos",
        "doubleTapNextSet": "Double tap : série suivante",
        "setShort": "S",
        "sessionDone": "Séance terminée",
        "allValidated": "Tous les exercices sont validés",
        "noSession": "Aucune séance en cours",
        "noSessionHint": "Lance une séance sur ton iPhone, elle apparaîtra ici automatiquement.",
        "noExercise": "Ajoute des exercices sur ton iPhone",
        "bodyweight": "PDC",
        "restOver": "Repos terminé",
        "restOverBody": "C'est parti pour la série suivante",
        "reset": "Réinitialiser",
        "pause": "Pause",
        "resume": "Reprendre",
        "back": "Retour"
    ]

    private static let english: [String: String] = [
        "sessionTitle": "Workout",
        "sessionDetected": "Workout detected",
        "startedOnIphone": "Started on iPhone",
        "exercisesCount": "exercises",
        "followSession": "Follow workout",
        "pickExercise": "Pick an exercise",
        "chrono": "Timer",
        "difficulty": "Difficulty",
        "rate": "Rate",
        "ready": "Ready",
        "readyQuestion": "READY?",
        "nextExercise": "Next exercise",
        "training": "TRAINING",
        "rest": "REST",
        "paused": "PAUSED",
        "startButton": "Go",
        "restButton": "Rest",
        "setButton": "Set",
        "doubleTapStart": "Double tap: start",
        "doubleTapRest": "Double tap: rest",
        "doubleTapNextSet": "Double tap: next set",
        "setShort": "S",
        "sessionDone": "Workout complete",
        "allValidated": "All exercises are done",
        "noSession": "No workout in progress",
        "noSessionHint": "Start a workout on your iPhone, it will show up here automatically.",
        "noExercise": "Add exercises on your iPhone",
        "bodyweight": "BW",
        "restOver": "Rest is over",
        "restOverBody": "Time for the next set",
        "reset": "Reset",
        "pause": "Pause",
        "resume": "Resume",
        "back": "Back"
    ]

    static var fallback: [String: String] {
        let language = Locale.preferredLanguages.first ?? "fr"
        return language.hasPrefix("fr") ? french : english
    }

    static func text(_ key: String, from synced: [String: String]?) -> String {
        synced?[key] ?? fallback[key] ?? key
    }
}
