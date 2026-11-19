import Foundation
import SwiftUI
import WatchConnectivity

/// Session state on the watch.
///
/// The iPhone pushes a snapshot of the active session (application context).
/// Actions done on the watch are applied locally right away, sent with
/// `transferUserInfo` (queued and delivered even if the iPhone app is asleep)
/// and kept as "pending" until the iPhone confirms them in a later snapshot.
@MainActor
final class WatchStore: NSObject, ObservableObject {
    @Published private(set) var snapshot: WatchSnapshot?
    @Published private(set) var pendingActions: [WatchAction] = []
    @Published private(set) var selectedExerciseId: String?
    @Published var isShowingDetection = false

    private let defaults = UserDefaults.standard
    private let snapshotKey = "egn.watch.snapshot"
    private let pendingKey = "egn.watch.pending"
    private let selectedKey = "egn.watch.selectedExercise"
    private let seenSessionKey = "egn.watch.seenSession"
    private var detectionTask: Task<Void, Never>?

    override init() {
        super.init()
        restore()
        activate()
    }

    // MARK: Derived state

    var session: WatchSessionPayload? { snapshot?.session }

    var labels: [String: String]? { snapshot?.labels }

    func text(_ key: String) -> String {
        Labels.text(key, from: labels)
    }

    var ratingOptions: [WatchRatingOption] { snapshot?.ratingOptions ?? [] }

    /// Exercises from the iPhone with the not-yet-confirmed watch actions applied on top.
    var exercises: [WatchExercise] {
        guard let session else { return [] }
        var list = session.exercises
        for action in pendingActions where action.sessionId == session.id {
            guard let index = list.firstIndex(where: { $0.id == action.exerciseId }) else { continue }
            switch action.type {
            case .rate: list[index].rating = action.rating
            case .validate: list[index].status = "validated"
            }
        }
        return list
    }

    var selectedExercise: WatchExercise? {
        guard let id = selectedExerciseId else { return nil }
        return exercises.first { $0.id == id }
    }

    var validatedCount: Int { exercises.filter(\.isValidated).count }

    var isSessionComplete: Bool { !exercises.isEmpty && exercises.allSatisfy(\.isValidated) }

    // MARK: User actions

    func select(_ exerciseId: String?) {
        selectedExerciseId = exerciseId
        defaults.set(exerciseId, forKey: selectedKey)
    }

    func dismissDetection() {
        detectionTask?.cancel()
        isShowingDetection = false
    }

    /// Tapping the current rating again clears it, like in the app.
    func toggleRating(_ value: Int, for exercise: WatchExercise) {
        guard let session else { return }
        let newValue: Int? = exercise.rating == value ? nil : value
        send(.rate(sessionId: session.id, exerciseId: exercise.id, rating: newValue))
    }

    /// Validates the selected exercise and selects the next pending one.
    /// Returns the next exercise, or nil when the session is complete.
    @discardableResult
    func validateSelectedAndGoNext() -> WatchExercise? {
        guard let session, let current = selectedExercise else { return nil }
        if !current.isValidated {
            send(.validate(sessionId: session.id, exerciseId: current.id))
        }
        let list = exercises
        let startIndex = list.firstIndex { $0.id == current.id } ?? -1
        let ordered = Array(list[(startIndex + 1)...]) + Array(list[..<max(0, startIndex)])
        let next = ordered.first { !$0.isValidated }
        select(next?.id)
        return next
    }

    // MARK: Sync

    private func send(_ action: WatchAction) {
        pendingActions.append(action)
        persistPending()
        transfer(action)
    }

    private func transfer(_ action: WatchAction) {
        guard WCSession.isSupported(), WCSession.default.activationState == .activated,
              let json = action.jsonString() else { return }
        WCSession.default.transferUserInfo(["action": json])
    }

    /// Re-sends pending actions that are no longer queued (e.g. the app was killed).
    private func resendLostActions() {
        guard WCSession.isSupported(), WCSession.default.activationState == .activated else { return }
        let queuedIds = Set(WCSession.default.outstandingUserInfoTransfers.compactMap { transfer -> String? in
            guard let json = transfer.userInfo["action"] as? String, let data = json.data(using: .utf8) else { return nil }
            return (try? JSONDecoder().decode(WatchAction.self, from: data))?.id
        })
        for action in pendingActions where !queuedIds.contains(action.id) {
            transfer(action)
        }
    }

    private func activate() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    private func receive(json: String) {
        guard let data = json.data(using: .utf8),
              let incoming = try? JSONDecoder().decode(WatchSnapshot.self, from: data) else { return }
        apply(incoming, persist: true)
    }

    private func apply(_ incoming: WatchSnapshot, persist: Bool) {
        let confirmed = Set(incoming.appliedActionIds)
        let previousSessionId = defaults.string(forKey: seenSessionKey)

        snapshot = incoming
        pendingActions.removeAll { confirmed.contains($0.id) || $0.sessionId != incoming.session?.id }
        persistPending()
        if persist, let data = try? JSONEncoder().encode(incoming) {
            defaults.set(data, forKey: snapshotKey)
        }

        guard let session = incoming.session else {
            select(nil)
            isShowingDetection = false
            return
        }

        if session.id != previousSessionId {
            // A new session was started on the iPhone: show it automatically.
            defaults.set(session.id, forKey: seenSessionKey)
            select(nil)
            showDetection()
        } else if let selected = selectedExerciseId, !session.exercises.contains(where: { $0.id == selected }) {
            select(nil)
        }
    }

    private func showDetection() {
        isShowingDetection = true
        detectionTask?.cancel()
        detectionTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            guard !Task.isCancelled else { return }
            self?.isShowingDetection = false
        }
    }

    private func restore() {
        if let data = defaults.data(forKey: snapshotKey),
           let saved = try? JSONDecoder().decode(WatchSnapshot.self, from: data) {
            snapshot = saved
        }
        if let data = defaults.data(forKey: pendingKey),
           let saved = try? JSONDecoder().decode([WatchAction].self, from: data) {
            pendingActions = saved
        }
        selectedExerciseId = defaults.string(forKey: selectedKey)
    }

    private func persistPending() {
        if let data = try? JSONEncoder().encode(pendingActions) {
            defaults.set(data, forKey: pendingKey)
        }
    }
}

extension WatchStore: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        guard activationState == .activated else { return }
        let context = session.receivedApplicationContext["snapshot"] as? String
        Task { @MainActor in
            if let context { self.receive(json: context) }
            self.resendLostActions()
            self.requestLatestSnapshot()
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        guard let json = applicationContext["snapshot"] as? String else { return }
        Task { @MainActor in self.receive(json: json) }
    }

    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let json = message["snapshot"] as? String else { return }
        Task { @MainActor in self.receive(json: json) }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        guard session.isReachable else { return }
        Task { @MainActor in self.requestLatestSnapshot() }
    }

    private func requestLatestSnapshot() {
        guard WCSession.default.activationState == .activated, WCSession.default.isReachable else { return }
        WCSession.default.sendMessage(["request": "snapshot"], replyHandler: { reply in
            guard let json = reply["snapshot"] as? String else { return }
            Task { @MainActor in self.receive(json: json) }
        }, errorHandler: nil)
    }
}
