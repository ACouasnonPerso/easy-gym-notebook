import Foundation
import WatchConnectivity

/// Owns the WatchConnectivity session on the iPhone side.
///
/// - Snapshots pushed by the web app are stored and sent to the watch as the
///   application context (the watch always gets the latest one, even if it was
///   not running when it was sent).
/// - Actions done on the watch (rating, validation) arrive through
///   `transferUserInfo`, which wakes this app in the background if needed.
///   They are persisted until the web app reads and acknowledges them, so
///   nothing is lost while the web view is suspended.
final class WatchSessionManager: NSObject {
    static let shared = WatchSessionManager()
    static let actionsAvailableNotification = Notification.Name("EGNWatchActionsAvailable")
    /// Posted when the connection state changes or an error is recorded (status screen).
    static let statusChangedNotification = Notification.Name("EGNWatchStatusChanged")

    private let pendingActionsKey = "egn.watch.pendingActions"
    private let lastSnapshotKey = "egn.watch.lastSnapshot"
    private let lastSnapshotSentAtKey = "egn.watch.lastSnapshotSentAt"
    private let lastActionReceivedAtKey = "egn.watch.lastActionReceivedAt"
    private let errorsKey = "egn.watch.errors"
    private static let maxErrors = 10
    private let lock = NSLock()
    private let defaults = UserDefaults.standard

    private override init() {
        super.init()
    }

    var isSupported: Bool { WCSession.isSupported() }

    func activate() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    // MARK: Snapshot (iPhone -> watch)

    func pushSnapshot(json: String) {
        defaults.set(json, forKey: lastSnapshotKey)
        sendLatestSnapshot()
    }

    private func sendLatestSnapshot() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated,
              session.isPaired,
              session.isWatchAppInstalled,
              let json = defaults.string(forKey: lastSnapshotKey) else { return }

        if let sessionId = Self.sessionId(of: json) {
            WatchWorkoutLauncher.shared.launchIfNeeded(sessionId: sessionId)
        }

        let payload: [String: Any] = ["snapshot": json]
        do {
            try session.updateApplicationContext(payload)
            defaults.set(Date(), forKey: lastSnapshotSentAtKey)
            postStatusChanged()
        } catch {
            NSLog("[EGNWatch] updateApplicationContext failed: \(error.localizedDescription)")
            recordError("Sync: \(error.localizedDescription)")
        }
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { [weak self] error in
                self?.recordError("Message: \(error.localizedDescription)")
            }
        }
    }

    // MARK: Status (shown on the iPhone, watch icon of the session list)

    func status() -> [String: Any] {
        var status: [String: Any] = [
            "supported": WCSession.isSupported(),
            "activation": "notActivated",
            "paired": false,
            "appInstalled": false,
            "reachable": false,
            "pendingActions": pendingActions().count,
            "errors": recentErrors()
        ]
        if let date = defaults.object(forKey: lastSnapshotSentAtKey) as? Date {
            status["lastSnapshotSentAt"] = Self.iso(date)
        }
        if let date = defaults.object(forKey: lastActionReceivedAtKey) as? Date {
            status["lastActionReceivedAt"] = Self.iso(date)
        }
        guard WCSession.isSupported() else { return status }
        let session = WCSession.default
        switch session.activationState {
        case .activated: status["activation"] = "activated"
        case .inactive: status["activation"] = "inactive"
        default: status["activation"] = "notActivated"
        }
        status["paired"] = session.isPaired
        status["appInstalled"] = session.isWatchAppInstalled
        status["reachable"] = session.isReachable
        return status
    }

    /// Keeps the last errors (most recent first) so they can be shown on the iPhone.
    func recordError(_ message: String) {
        lock.lock()
        var errors = defaults.array(forKey: errorsKey) as? [[String: String]] ?? []
        errors.insert(["at": Self.iso(Date()), "message": message], at: 0)
        defaults.set(Array(errors.prefix(Self.maxErrors)), forKey: errorsKey)
        lock.unlock()
        postStatusChanged()
    }

    func clearErrors() {
        defaults.removeObject(forKey: errorsKey)
        postStatusChanged()
    }

    private func recentErrors() -> [[String: String]] {
        lock.lock()
        defer { lock.unlock() }
        return defaults.array(forKey: errorsKey) as? [[String: String]] ?? []
    }

    private func postStatusChanged() {
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: Self.statusChangedNotification, object: nil)
        }
    }

    private static func iso(_ date: Date) -> String {
        ISO8601DateFormatter().string(from: date)
    }

    // MARK: Actions (watch -> iPhone)

    func pendingActions() -> [String] {
        lock.lock()
        defer { lock.unlock() }
        return defaults.stringArray(forKey: pendingActionsKey) ?? []
    }

    func acknowledgeActions(ids: [String]) {
        let toRemove = Set(ids)
        lock.lock()
        let remaining = (defaults.stringArray(forKey: pendingActionsKey) ?? []).filter { raw in
            guard let id = Self.actionId(of: raw) else { return false }
            return !toRemove.contains(id)
        }
        defaults.set(remaining, forKey: pendingActionsKey)
        lock.unlock()
    }

    private func enqueue(action raw: String) {
        guard let id = Self.actionId(of: raw) else { return }
        lock.lock()
        var actions = defaults.stringArray(forKey: pendingActionsKey) ?? []
        if !actions.contains(where: { Self.actionId(of: $0) == id }) {
            actions.append(raw)
            defaults.set(actions, forKey: pendingActionsKey)
        }
        lock.unlock()
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: Self.actionsAvailableNotification, object: nil)
        }
    }

    private static func sessionId(of snapshotJson: String) -> String? {
        guard let data = snapshotJson.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let session = object["session"] as? [String: Any] else { return nil }
        return session["id"] as? String
    }

    private static func actionId(of raw: String) -> String? {
        guard let data = raw.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return object["id"] as? String
    }

    private func handleIncoming(_ payload: [String: Any]) {
        if let action = payload["action"] as? String {
            defaults.set(Date(), forKey: lastActionReceivedAtKey)
            enqueue(action: action)
            postStatusChanged()
        }
    }
}

extension WatchSessionManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error {
            recordError("Activation: \(error.localizedDescription)")
        }
        if activationState == .activated {
            sendLatestSnapshot()
        }
        postStatusChanged()
    }

    func sessionDidBecomeInactive(_ session: WCSession) {
        postStatusChanged()
    }

    func sessionDidDeactivate(_ session: WCSession) {
        // Switching to another paired watch: reactivate for the new one.
        WCSession.default.activate()
    }

    func sessionWatchStateDidChange(_ session: WCSession) {
        sendLatestSnapshot()
        postStatusChanged()
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        if session.isReachable {
            sendLatestSnapshot()
        }
        postStatusChanged()
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleIncoming(userInfo)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleIncoming(message)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleIncoming(message)
        if message["request"] as? String == "snapshot", let json = defaults.string(forKey: lastSnapshotKey) {
            replyHandler(["snapshot": json])
        } else {
            replyHandler([:])
        }
    }
}
