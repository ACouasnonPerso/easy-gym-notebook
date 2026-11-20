import SwiftUI

/// No active session on the iPhone.
struct NoSessionView: View {
    @EnvironmentObject private var store: WatchStore

    var body: some View {
        VStack(spacing: 10) {
            AppBadge(size: 44)
            Text(store.text("noSession"))
                .font(.system(size: 16, weight: .bold))
                .multilineTextAlignment(.center)
            Text(store.text("noSessionHint"))
                .font(.system(size: 13))
                .foregroundStyle(Theme.sub)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, 8)
        .containerBackground(Theme.background, for: .navigation)
    }
}

/// Shown automatically when a new session starts on the iPhone.
struct DetectionView: View {
    @EnvironmentObject private var store: WatchStore

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle().stroke(Theme.orange.opacity(0.25), lineWidth: 1).frame(width: 78, height: 78)
                Circle().stroke(Theme.orange.opacity(0.5), lineWidth: 1.5).frame(width: 62, height: 62)
                AppBadge(size: 46)
            }
            VStack(spacing: 2) {
                Text(store.text("sessionDetected"))
                    .font(.system(size: 16, weight: .bold))
                Text(store.session?.title ?? "")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.orange)
                Text("\(store.text("startedOnIphone")) · \(store.exercises.count) \(store.text(store.exercises.count == 1 ? "exerciseCountOne" : "exercisesCount"))")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.sub)
            }
            .multilineTextAlignment(.center)
            Button(store.text("followSession")) {
                store.dismissDetection()
            }
            .buttonStyle(FilledCapsuleStyle(color: Theme.orange))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(Theme.background, for: .navigation)
    }
}

/// No exercise selected: pick one of the session.
struct ExerciseListView: View {
    @EnvironmentObject private var store: WatchStore
    let onSelect: (WatchExercise) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                if store.isSessionComplete {
                    SessionCompleteCard()
                }
                if store.exercises.isEmpty {
                    Text(store.text("noExercise"))
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.sub)
                        .multilineTextAlignment(.center)
                        .padding(.top, 12)
                }
                ForEach(store.exercises) { exercise in
                    Button {
                        onSelect(exercise)
                    } label: {
                        ExerciseRow(exercise: exercise)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .navigationTitle(store.session?.title ?? "")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Text("\(store.validatedCount)/\(store.exercises.count)")
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(Theme.sub)
            }
        }
        .containerBackground(Theme.background, for: .navigation)
    }
}

private struct ExerciseRow: View {
    let exercise: WatchExercise

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(exercise.muscleColor.map { Color(hex: $0) } ?? Theme.orange)
                .frame(width: 8, height: 8)
            VStack(alignment: .leading, spacing: 1) {
                Text(exercise.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(exercise.isValidated ? Theme.sub : Theme.text)
                    .lineLimit(1)
                Text(exercise.summary)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Theme.sub)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            if exercise.isValidated {
                Image(systemName: "checkmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(Theme.green)
                    .frame(width: 20, height: 20)
                    .background(Theme.green.opacity(0.18), in: Circle())
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(minHeight: 48)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
    }
}

private struct SessionCompleteCard: View {
    @EnvironmentObject private var store: WatchStore
    @EnvironmentObject private var workout: WorkoutManager

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: "checkmark")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Theme.green)
                .frame(width: 40, height: 40)
                .background(Theme.green.opacity(0.15), in: Circle())
            Text(store.text("sessionDone"))
                .font(.system(size: 15, weight: .bold))
            Text(store.text("allValidated"))
                .font(.system(size: 12))
                .foregroundStyle(Theme.sub)
                .multilineTextAlignment(.center)
            if workout.isRunning {
                Button(store.text("endWorkout")) {
                    workout.endByUser()
                }
                .buttonStyle(FilledCapsuleStyle(color: Theme.red, foreground: Theme.text))
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }
}

struct AppBadge: View {
    let size: CGFloat

    var body: some View {
        Image(systemName: "dumbbell.fill")
            .font(.system(size: size * 0.48, weight: .bold))
            .foregroundStyle(Theme.background)
            .frame(width: size, height: size)
            .background(Theme.orange, in: RoundedRectangle(cornerRadius: size * 0.32))
    }
}

struct FilledCapsuleStyle: ButtonStyle {
    let color: Color
    var foreground: Color = Theme.background

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(color.opacity(configuration.isPressed ? 0.75 : 1), in: Capsule())
    }
}
