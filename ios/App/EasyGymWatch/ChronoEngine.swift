import Foundation
import SwiftUI
import UserNotifications
import WatchKit

/// Exercise timer running on the watch, based on timestamps so it stays exact
/// when the screen sleeps. Rest counts down and starts the next set automatically.
///
/// Training counts up, unless the auto mode is on: each set then lasts a fixed
/// duration, and the timer chains set → rest → set by itself until the last set.
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
        /// Auto mode: sets last `setDuration` and chain with the rests.
        var isAuto = false
        var setDuration: TimeInterval = ChronoEngine.defaultSetDuration
        /// Auto mode only: the last set is over.
        var isFinished = false

        init(
            exerciseId: String? = nil,
            restDuration: TimeInterval = 90,
            totalSets: Int = 1,
            isAuto: Bool = false,
            setDuration: TimeInterval = ChronoEngine.defaultSetDuration
        ) {
            self.exerciseId = exerciseId
            self.restDuration = restDuration
            self.totalSets = totalSets
            self.isAuto = isAuto
            self.setDuration = setDuration
        }

        // Tolerant decoding: a state saved by an older version has no auto fields.
        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            exerciseId = try c.decodeIfPresent(String.self, forKey: .exerciseId)
            mode = try c.decodeIfPresent(Mode.self, forKey: .mode) ?? .training
            isRunning = try c.decodeIfPresent(Bool.self, forKey: .isRunning) ?? false
            hasStarted = try c.decodeIfPresent(Bool.self, forKey: .hasStarted) ?? false
            accumulated = try c.decodeIfPresent(TimeInterval.self, forKey: .accumulated) ?? 0
            segmentStart = try c.decodeIfPresent(Date.self, forKey: .segmentStart)
            restDuration = try c.decodeIfPresent(TimeInterval.self, forKey: .restDuration) ?? 90
            currentSet = try c.decodeIfPresent(Int.self, forKey: .currentSet) ?? 1
            totalSets = try c.decodeIfPresent(Int.self, forKey: .totalSets) ?? 1
            isAuto = try c.decodeIfPresent(Bool.self, forKey: .isAuto) ?? false
            setDuration = try c.decodeIfPresent(TimeInterval.self, forKey: .setDuration) ?? ChronoEngine.defaultSetDuration
            isFinished = try c.decodeIfPresent(Bool.self, forKey: .isFinished) ?? false
        }
    }

    nonisolated static let defaultSetDuration: TimeInterval = 40
    nonisolated static let setDurationRange: ClosedRange<Double> = 5...300
    nonisolated static let setDurationStep: Double = 5

    @Published private(set) var state = State()

    private let storageKey = "egn.watch.chrono"
    /// Auto mode remembered per exercise: [exerciseId: set duration]. Absent = off.
    private let autoByExerciseKey = "egn.watch.chrono.autoByExercise"
    /// Last set duration chosen, used as the default for other exercises.
    private let lastSetDurationKey = "egn.watch.chrono.lastSetDuration"
    private let notificationId = "egn.watch.restOver"
    private var texts = PhaseTexts()
    private var ticker: Timer?

    struct PhaseTexts {
        var restOverTitle = ""
        var restOverBody = ""
        var setOverTitle = ""
        var setOverBody = ""
        var finishedTitle = ""
        var finishedBody = ""
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let saved = try? JSONDecoder().decode(State.self, from: data) {
            state = saved
        }
        // Lives as long as the engine, whatever screen is shown, so the end of a phase
        // is handled everywhere (and in the background while a workout session runs).
        let timer = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick(now: Date()) }
        }
        RunLoop.main.add(timer, forMode: .common)
        ticker = timer
    }

    // MARK: Setup

    func configure(for exercise: WatchExercise, texts: PhaseTexts) {
        self.texts = texts
        if state.exerciseId != exercise.id {
            cancelNotification()
            let remembered = autoByExercise[exercise.id]
            state = State(
                exerciseId: exercise.id,
                restDuration: TimeInterval(max(exercise.breakDurationSeconds, 5)),
                totalSets: max(exercise.sets, 1),
                isAuto: remembered != nil,
                setDuration: remembered ?? lastSetDuration
            )
        } else {
            state.restDuration = TimeInterval(max(exercise.breakDurationSeconds, 5))
            state.totalSets = max(exercise.sets, 1)
        }
        persist()
    }

    /// Auto settings can be changed only before the timer starts ("Ready?" screen).
    var canEditAuto: Bool { !state.hasStarted }

    func setAuto(_ isOn: Bool) {
        guard canEditAuto else { return }
        state.isAuto = isOn
        rememberAuto()
        persist()
    }

    func setSetDuration(_ seconds: TimeInterval) {
        guard canEditAuto else { return }
        let range = Self.setDurationRange
        let snapped = (seconds / Self.setDurationStep).rounded() * Self.setDurationStep
        state.setDuration = min(max(snapped, range.lowerBound), range.upperBound)
        rememberAuto()
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

    /// Length of the current phase when it is timed (rest, or set in auto mode).
    private var phaseDuration: TimeInterval? {
        switch state.mode {
        case .rest: return state.restDuration
        case .training: return state.isAuto ? state.setDuration : nil
        }
    }

    func displayedSeconds(at now: Date) -> Int {
        if state.isFinished { return 0 }
        guard let duration = phaseDuration else { return Int(elapsed(at: now)) }
        return Int(ceil(max(0, duration - elapsed(at: now))))
    }

    /// Ring progress between 0 and 1.
    func progress(at now: Date) -> Double {
        if state.isFinished { return 0 }
        guard let duration = phaseDuration else {
            return elapsed(at: now).truncatingRemainder(dividingBy: 60) / 60
        }
        guard duration > 0 else { return 0 }
        return max(0, duration - elapsed(at: now)) / duration
    }

    private var isLastSet: Bool { state.currentSet >= state.totalSets }

    // MARK: Controls

    /// Double tap / main button: start, then rest, then next set.
    func primaryAction() {
        if state.isFinished {
            reset()
            startTraining(at: Date())
        } else if !state.hasStarted {
            startTraining(at: Date())
        } else if state.mode == .training {
            if state.isAuto && isLastSet {
                finish()
            } else {
                startRest(at: Date())
            }
        } else {
            startNextSet(at: Date())
        }
    }

    func toggleRunning() {
        if state.isFinished {
            primaryAction()
            return
        }
        let now = Date()
        if state.isRunning {
            state.accumulated = elapsed(at: now)
            state.segmentStart = nil
            state.isRunning = false
            cancelNotification()
        } else {
            state.segmentStart = now
            state.isRunning = true
            state.hasStarted = true
            scheduleNotification()
        }
        persist()
    }

    func reset() {
        cancelNotification()
        state.currentSet = 1
        state.mode = .training
        state.isRunning = false
        state.hasStarted = false
        state.isFinished = false
        state.accumulated = 0
        state.segmentStart = nil
        persist()
    }

    /// Called every half second: ends the timed phases that are over. Loops so that
    /// coming back after a long time catches up with every phase that ended meanwhile.
    func tick(now: Date) {
        var lastEnd: Date?
        while state.isRunning, let start = state.segmentStart, let duration = phaseDuration {
            let end = start.addingTimeInterval(duration - state.accumulated)
            guard now >= end else { break }
            switch state.mode {
            case .rest:
                startNextSet(at: end, playHaptic: false)
            case .training:
                if isLastSet {
                    finish(playHaptic: false)
                } else {
                    startRest(at: end, playHaptic: false)
                }
            }
            lastEnd = end
        }
        // Do not buzz when coming back long after the end (the notification already did).
        guard let lastEnd, now.timeIntervalSince(lastEnd) < 5 else { return }
        if state.isFinished {
            WKInterfaceDevice.current().play(.success)
        } else if state.mode == .rest {
            WKInterfaceDevice.current().play(.stop)
        } else {
            WKInterfaceDevice.current().play(.notification)
        }
    }

    private func startTraining(at date: Date, playHaptic: Bool = true) {
        state.mode = .training
        state.accumulated = 0
        state.segmentStart = date
        state.isRunning = true
        state.hasStarted = true
        state.isFinished = false
        if playHaptic { WKInterfaceDevice.current().play(.start) }
        scheduleNotification()
        persist()
    }

    private func startRest(at date: Date, playHaptic: Bool = true) {
        state.mode = .rest
        state.accumulated = 0
        state.segmentStart = date
        state.isRunning = true
        state.hasStarted = true
        if playHaptic { WKInterfaceDevice.current().play(.stop) }
        scheduleNotification()
        persist()
    }

    private func startNextSet(at date: Date, playHaptic: Bool = true) {
        state.currentSet = min(state.currentSet + 1, state.totalSets)
        startTraining(at: date, playHaptic: playHaptic)
    }

    private func finish(playHaptic: Bool = true) {
        cancelNotification()
        state.mode = .training
        state.isRunning = false
        state.isFinished = true
        state.accumulated = 0
        state.segmentStart = nil
        if playHaptic { WKInterfaceDevice.current().play(.success) }
        persist()
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: Auto mode memory

    private var autoByExercise: [String: Double] {
        UserDefaults.standard.dictionary(forKey: autoByExerciseKey) as? [String: Double] ?? [:]
    }

    private var lastSetDuration: TimeInterval {
        let saved = UserDefaults.standard.double(forKey: lastSetDurationKey)
        return saved > 0 ? saved : Self.defaultSetDuration
    }

    private func rememberAuto() {
        guard let id = state.exerciseId else { return }
        var memory = autoByExercise
        memory[id] = state.isAuto ? state.setDuration : nil
        UserDefaults.standard.set(memory, forKey: autoByExerciseKey)
        if state.isAuto {
            UserDefaults.standard.set(state.setDuration, forKey: lastSetDurationKey)
        }
    }

    // MARK: End of phase notification (buzzes the wrist if the app is not on screen)

    static func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    /// Schedules the notification for the end of the current timed phase, if any.
    private func scheduleNotification() {
        cancelNotification()
        guard state.isRunning, let duration = phaseDuration else { return }
        let remaining = duration - elapsed(at: Date())
        guard remaining > 1 else { return }
        let content = UNMutableNotificationContent()
        switch state.mode {
        case .rest:
            content.title = texts.restOverTitle
            content.body = texts.restOverBody
        case .training:
            content.title = isLastSet ? texts.finishedTitle : texts.setOverTitle
            content.body = isLastSet ? texts.finishedBody : texts.setOverBody
        }
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: remaining, repeats: false)
        let request = UNNotificationRequest(identifier: notificationId, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private func cancelNotification() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [notificationId])
    }
}
