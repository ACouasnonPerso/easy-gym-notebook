import Foundation
import SwiftUI
import UserNotifications
import WatchKit

/// Exercise timer running on the watch, based on timestamps so it stays exact
/// when the screen sleeps. Training counts up, rest counts down and starts the
/// next set automatically.
@MainActor
final class ChronoEngine: ObservableObject {
    enum Mode: String, Codable {
        case training
        case rest
    }

    struct State: Codable, Equatable {
        var exerciseId: String?
        var mode: Mode = .training
        var isRunning = false
        var hasStarted = false
        var accumulated: TimeInterval = 0
        var segmentStart: Date?
        var restDuration: TimeInterval = 90
        var currentSet = 1
        var totalSets = 1
    }

    @Published private(set) var state = State()

    private let storageKey = "egn.watch.chrono"
    private let notificationId = "egn.watch.restOver"
    private var notificationTitle = ""
    private var notificationBody = ""
    private var ticker: Timer?

    init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let saved = try? JSONDecoder().decode(State.self, from: data) {
            state = saved
        }
        // Lives as long as the engine, whatever screen is shown, so the end of the rest
        // is handled everywhere (and in the background while a workout session runs).
        let timer = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick(now: Date()) }
        }
        RunLoop.main.add(timer, forMode: .common)
        ticker = timer
    }

    // MARK: Setup

    func configure(for exercise: WatchExercise, restOverTitle: String, restOverBody: String) {
        notificationTitle = restOverTitle
        notificationBody = restOverBody
        if state.exerciseId != exercise.id {
            cancelRestNotification()
            state = State(
                exerciseId: exercise.id,
                restDuration: TimeInterval(max(exercise.breakDurationSeconds, 5)),
                totalSets: max(exercise.sets, 1)
            )
        } else {
            state.restDuration = TimeInterval(max(exercise.breakDurationSeconds, 5))
            state.totalSets = max(exercise.sets, 1)
        }
        persist()
    }

    // MARK: Reading

    func elapsed(at now: Date) -> TimeInterval {
        var total = state.accumulated
        if state.isRunning, let start = state.segmentStart {
            total += now.timeIntervalSince(start)
        }
        return max(0, total)
    }

    func displayedSeconds(at now: Date) -> Int {
        switch state.mode {
        case .training: return Int(elapsed(at: now))
        case .rest: return Int(ceil(max(0, state.restDuration - elapsed(at: now))))
        }
    }

    /// Ring progress between 0 and 1.
    func progress(at now: Date) -> Double {
        switch state.mode {
        case .training:
            return elapsed(at: now).truncatingRemainder(dividingBy: 60) / 60
        case .rest:
            guard state.restDuration > 0 else { return 0 }
            return max(0, state.restDuration - elapsed(at: now)) / state.restDuration
        }
    }

    // MARK: Controls

    /// Double tap / main button: start, then rest, then next set.
    func primaryAction() {
        if !state.hasStarted {
            startTraining(at: Date())
        } else if state.mode == .training {
            startRest()
        } else {
            startNextSet(at: Date())
        }
    }

    func toggleRunning() {
        let now = Date()
        if state.isRunning {
            state.accumulated = elapsed(at: now)
            state.segmentStart = nil
            state.isRunning = false
            cancelRestNotification()
        } else {
            state.segmentStart = now
            state.isRunning = true
            state.hasStarted = true
            if state.mode == .rest { scheduleRestNotification() }
        }
        persist()
    }

    func reset() {
        cancelRestNotification()
        state.currentSet = 1
        state.mode = .training
        state.isRunning = false
        state.hasStarted = false
        state.accumulated = 0
        state.segmentStart = nil
        persist()
    }

    /// Called every half second by the chrono screen: ends the rest when it is over.
    func tick(now: Date) {
        guard state.mode == .rest, state.isRunning, let start = state.segmentStart else { return }
        let restEnd = start.addingTimeInterval(state.restDuration - state.accumulated)
        if now >= restEnd {
            startNextSet(at: restEnd, playHaptic: false)
            // Do not buzz when coming back long after the end (the notification already did).
            if now.timeIntervalSince(restEnd) < 5 {
                WKInterfaceDevice.current().play(.notification)
            }
        }
    }

    private func startTraining(at date: Date, playHaptic: Bool = true) {
        state.mode = .training
        state.accumulated = 0
        state.segmentStart = date
        state.isRunning = true
        state.hasStarted = true
        if playHaptic { WKInterfaceDevice.current().play(.start) }
        persist()
    }

    private func startRest() {
        state.mode = .rest
        state.accumulated = 0
        state.segmentStart = Date()
        state.isRunning = true
        state.hasStarted = true
        WKInterfaceDevice.current().play(.stop)
        scheduleRestNotification()
        persist()
    }

    private func startNextSet(at date: Date, playHaptic: Bool = true) {
        cancelRestNotification()
        state.currentSet = min(state.currentSet + 1, state.totalSets)
        startTraining(at: date, playHaptic: playHaptic)
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: Rest notification (buzzes the wrist if the app is not on screen)

    static func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    private func scheduleRestNotification() {
        let remaining = state.restDuration - state.accumulated
        guard remaining > 1 else { return }
        let content = UNMutableNotificationContent()
        content.title = notificationTitle
        content.body = notificationBody
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: remaining, repeats: false)
        let request = UNNotificationRequest(identifier: notificationId, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private func cancelRestNotification() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [notificationId])
    }
}
