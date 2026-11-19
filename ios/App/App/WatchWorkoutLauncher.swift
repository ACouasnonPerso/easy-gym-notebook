import Foundation
import HealthKit
import WatchConnectivity

/// Opens Easy Gym on the Apple Watch, with a strength training workout, when a
/// new session becomes active on the iPhone. Done once per session.
final class WatchWorkoutLauncher {
    static let shared = WatchWorkoutLauncher()

    private let healthStore = HKHealthStore()
    private let launchedSessionKey = "egn.watch.launchedWorkoutSession"

    private init() {}

    /// Caller guarantees the WCSession is activated, paired and the watch app installed.
    func launchIfNeeded(sessionId: String) {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let defaults = UserDefaults.standard
        guard defaults.string(forKey: launchedSessionKey) != sessionId else { return }
        defaults.set(sessionId, forKey: launchedSessionKey)

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .traditionalStrengthTraining
        configuration.locationType = .indoor

        DispatchQueue.main.async {
            self.healthStore.requestAuthorization(toShare: [HKObjectType.workoutType()], read: nil) { _, _ in
                self.healthStore.startWatchApp(with: configuration) { _, error in
                    if let error {
                        NSLog("[EGNWatch] startWatchApp failed: \(error.localizedDescription)")
                    }
                }
            }
        }
    }
}
