import SwiftUI

@main
struct EasyGymWatchApp: App {
    @StateObject private var store = WatchStore()
    @StateObject private var chrono = ChronoEngine()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(chrono)
                .tint(Theme.orange)
        }
    }
}
