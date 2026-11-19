import SwiftUI

enum WatchRoute: Hashable {
    case exercise
    case chrono
    case rating
}

struct RootView: View {
    @EnvironmentObject private var store: WatchStore
    @EnvironmentObject private var workout: WorkoutManager
    @State private var path: [WatchRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            content
                .navigationDestination(for: WatchRoute.self) { route in
                    switch route {
                    case .exercise: ExerciseHomeView(path: $path)
                    case .chrono: ChronoView()
                    case .rating: RatingView()
                    }
                }
        }
        .onAppear {
            // Reopen the exercise that was being followed.
            if store.selectedExercise != nil && path.isEmpty {
                path = [.exercise]
            }
        }
        .onChange(of: path) { _, newPath in
            if newPath.isEmpty { store.select(nil) }
        }
        .onChange(of: store.session?.id) { _, _ in
            path = []
        }
        .task(id: store.session?.id) {
            // Start / stop the HealthKit workout with the session of the iPhone.
            await workout.sync(with: store.session?.id)
        }
        .onChange(of: store.selectedExerciseId) { _, id in
            if id == nil && !path.isEmpty { path = [] }
        }
    }

    @ViewBuilder
    private var content: some View {
        if store.session == nil {
            NoSessionView()
        } else if store.isShowingDetection {
            DetectionView()
        } else {
            ExerciseListView { exercise in
                store.select(exercise.id)
                path = [.exercise]
            }
        }
    }
}
