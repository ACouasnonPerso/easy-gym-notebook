import SwiftUI
import WatchKit

@main
struct EasyGymWatchApp: App {
    @WKApplicationDelegateAdaptor private var appDelegate: WatchAppDelegate
    @StateObject private var store = WatchStore()
    @StateObject private var chrono = ChronoEngine()
    @ObservedObject private var workout = WorkoutManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(chrono)
                .environmentObject(workout)
                .tint(Theme.orange)
        }
    }
}
