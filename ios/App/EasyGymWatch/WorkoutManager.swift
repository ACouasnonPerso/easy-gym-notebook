import Foundation
import HealthKit
import WatchKit

/// HealthKit strength training workout that follows the session of the iPhone.
///
/// While it runs, the app stays on screen when the wrist is raised and keeps running
/// in the background (chrono, end of rest). It also gives the heart rate and saves
/// the workout in the Health app.
///
/// Lifecycle:
/// - starts when a session is active (opened on the watch, or the iPhone launches
///   the watch app through `HKHealthStore.startWatchApp`);
/// - ends when the session ends on the iPhone, or when the user taps "End workout";
/// - workouts shorter than 2 minutes are discarded (e.g. an outdated session
///   restored for a few seconds before the iPhone sync).
@MainActor
final class WorkoutManager: NSObject, ObservableObject {
    static let shared = WorkoutManager()

    @Published private(set) var isRunning = false
    @Published private(set) var heartRate: Int?
    @Published private(set) var activeCalories: Int?

    private let healthStore = HKHealthStore()
    private var workoutSession: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var isStarting = false
    /// Session to start once the current workout is saved.
    private var nextSessionId: String?

    private let defaults = UserDefaults.standard
    private let linkedSessionKey = "egn.watch.workout.session"
    private let endedSessionKey = "egn.watch.workout.endedSession"
    private let startDateKey = "egn.watch.workout.start"

    private static let minimumDuration: TimeInterval = 2 * 60
    /// Safety net if the session is never ended on the iPhone.
    private static let maximumDuration: TimeInterval = 4 * 60 * 60

    static var configuration: HKWorkoutConfiguration {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .traditionalStrengthTraining
        configuration.locationType = .indoor
        return configuration
    }

    private override init() {
        super.init()
    }

    private var linkedSessionId: String? {
        get { defaults.string(forKey: linkedSessionKey) }
        set { defaults.set(newValue, forKey: linkedSessionKey) }
    }

    // MARK: Sync with the session of the iPhone

    func sync(with sessionId: String?) async {
        if isRunning, let start = defaults.object(forKey: startDateKey) as? Date,
           Date().timeIntervalSince(start) > Self.maximumDuration {
            endByUser()
            return
        }

        guard let sessionId else {
            nextSessionId = nil
            if isRunning { end() }
            return
        }

        if isRunning {
            if linkedSessionId == nil {
                linkedSessionId = sessionId // launched by the iPhone before the first sync
                return
            }
            if linkedSessionId == sessionId { return }
            nextSessionId = sessionId // another session started on the iPhone
            end()
            return
        }

        guard defaults.string(forKey: endedSessionKey) != sessionId else { return }
        await start(linkedTo: sessionId)
    }

    // MARK: Lifecycle

    func start(linkedTo sessionId: String?, configuration: HKWorkoutConfiguration = WorkoutManager.configuration) async {
        guard HKHealthStore.isHealthDataAvailable(), !isRunning, !isStarting else { return }
        isStarting = true
        defer { isStarting = false }

        guard await requestAuthorization() else { return }

        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            attach(session: session, builder: builder)
            linkedSessionId = sessionId

            let startDate = Date()
            defaults.set(startDate, forKey: startDateKey)
            session.startActivity(with: startDate)
            try await builder.beginCollection(at: startDate)
        } catch {
            NSLog("[EGNWatch] Workout start failed: \(error.localizedDescription)")
            workoutSession?.end()
            clear()
        }
    }

    /// "End workout" on the watch: do not restart it for this session.
    func endByUser() {
        nextSessionId = nil
        if let id = linkedSessionId {
            defaults.set(id, forKey: endedSessionKey)
        }
        end()
    }

    func end() {
        guard let workoutSession else { return }
        if workoutSession.state == .ended {
            Task { await finish(at: Date()) }
        } else {
            workoutSession.end()
        }
    }

    /// The app was relaunched by the system while a workout was running.
    func recover() {
        healthStore.recoverActiveWorkoutSession { [weak self] session, error in
            Task { @MainActor in
                guard let self, let session else {
                    if let error { NSLog("[EGNWatch] Workout recovery failed: \(error.localizedDescription)") }
                    return
                }
                self.attach(session: session, builder: session.associatedWorkoutBuilder())
            }
        }
    }

    // MARK: Private

    private func requestAuthorization() async -> Bool {
        let share: Set<HKSampleType> = [HKObjectType.workoutType()]
        let read: Set<HKObjectType> = [
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned)
        ]
        do {
            try await healthStore.requestAuthorization(toShare: share, read: read)
            return healthStore.authorizationStatus(for: HKObjectType.workoutType()) == .sharingAuthorized
        } catch {
            NSLog("[EGNWatch] HealthKit authorization failed: \(error.localizedDescription)")
            return false
        }
    }

    private func attach(session: HKWorkoutSession, builder: HKLiveWorkoutBuilder) {
        workoutSession = session
        self.builder = builder
        session.delegate = self
        builder.delegate = self
        isRunning = true
    }

    private func finish(at date: Date) async {
        guard let builder else {
            clear()
            return
        }
        let start = builder.startDate ?? (defaults.object(forKey: startDateKey) as? Date) ?? date
        do {
            try await builder.endCollection(at: date)
            if date.timeIntervalSince(start) < Self.minimumDuration {
                builder.discardWorkout()
            } else {
                _ = try await builder.finishWorkout()
            }
        } catch {
            NSLog("[EGNWatch] Workout save failed: \(error.localizedDescription)")
        }
        clear()
        if let next = nextSessionId {
            nextSessionId = nil
            await start(linkedTo: next)
        }
    }

    private func clear() {
        workoutSession = nil
        builder = nil
        isRunning = false
        heartRate = nil
        activeCalories = nil
        linkedSessionId = nil
        defaults.removeObject(forKey: startDateKey)
    }
}

extension WorkoutManager: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        guard toState == .ended else { return }
        Task { @MainActor in await self.finish(at: date) }
    }

    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        NSLog("[EGNWatch] Workout session failed: \(error.localizedDescription)")
    }
}

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        let beatsPerMinute = HKUnit.count().unitDivided(by: .minute())
        let bpm = workoutBuilder.statistics(for: HKQuantityType(.heartRate))?
            .mostRecentQuantity()?.doubleValue(for: beatsPerMinute)
        let kcal = workoutBuilder.statistics(for: HKQuantityType(.activeEnergyBurned))?
            .sumQuantity()?.doubleValue(for: .kilocalorie())
        Task { @MainActor in
            if let bpm { self.heartRate = Int(bpm.rounded()) }
            if let kcal { self.activeCalories = Int(kcal.rounded()) }
        }
    }
}

/// Receives the workout launch requested by the iPhone and the crash recovery.
final class WatchAppDelegate: NSObject, WKApplicationDelegate {
    func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
        Task { @MainActor in
            await WorkoutManager.shared.start(linkedTo: nil, configuration: workoutConfiguration)
        }
    }

    func handleActiveWorkoutRecovery() {
        Task { @MainActor in
            WorkoutManager.shared.recover()
        }
    }
}
