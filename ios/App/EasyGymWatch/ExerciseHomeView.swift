import SwiftUI

/// Exercise selected: access to the chrono and the difficulty, and "next exercise".
struct ExerciseHomeView: View {
    @EnvironmentObject private var store: WatchStore
    @EnvironmentObject private var chrono: ChronoEngine
    @Binding var path: [WatchRoute]

    var body: some View {
        Group {
            if let exercise = store.selectedExercise {
                content(for: exercise)
            } else {
                Color.clear
            }
        }
        .containerBackground(Theme.background, for: .navigation)
    }

    private func content(for exercise: WatchExercise) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(exercise.name)
                        .font(.system(size: 17, weight: .bold))
                        .lineLimit(2)
                    HStack(spacing: 6) {
                        if let label = exercise.muscleLabel {
                            MuscleTag(label: label, colorHex: exercise.muscleColor)
                        }
                        Text(setLine(for: exercise))
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundStyle(Theme.sub)
                            .lineLimit(1)
                    }
                }

                HStack(spacing: 6) {
                    NavigationLink(value: WatchRoute.chrono) {
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            Tile(
                                icon: "stopwatch",
                                iconColor: Theme.ringTraining,
                                title: store.text("chrono"),
                                value: chronoValue(at: context.date),
                                valueColor: chronoValueColor
                            )
                        }
                    }
                    .buttonStyle(.plain)

                    NavigationLink(value: WatchRoute.rating) {
                        Tile(
                            icon: "gauge.with.dots.needle.33percent",
                            iconColor: Theme.orange,
                            title: store.text("difficulty"),
                            value: exercise.rating.map { "\(displayRating($0))/20" } ?? store.text("rate"),
                            valueColor: exercise.rating == nil ? Theme.text : Theme.orange
                        )
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    if store.validateSelectedAndGoNext() == nil {
                        path = []
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(store.text("nextExercise"))
                        Image(systemName: "chevron.right")
                    }
                }
                .buttonStyle(FilledCapsuleStyle(color: Theme.orange))
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
    }

    private var isChronoForThisExercise: Bool {
        chrono.state.exerciseId == store.selectedExerciseId
    }

    private func setLine(for exercise: WatchExercise) -> String {
        if exercise.isCardio { return exercise.loadLabel }
        let set = isChronoForThisExercise ? chrono.state.currentSet : 1
        return "\(store.text("setShort"))\(set)/\(exercise.sets) · \(exercise.loadLabel) × \(exercise.reps)"
    }

    private func chronoValue(at date: Date) -> String {
        guard isChronoForThisExercise, chrono.state.hasStarted else { return store.text("ready") }
        return formatClock(chrono.displayedSeconds(at: date))
    }

    private var chronoValueColor: Color {
        guard isChronoForThisExercise, chrono.state.hasStarted else { return Theme.text }
        return chrono.state.mode == .rest ? Theme.ringRest : Theme.ringTraining
    }

    private func displayRating(_ value: Int) -> String {
        store.ratingOptions.first { $0.value == value }?.display ?? String(value)
    }
}

private struct Tile: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    let valueColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(iconColor)
            Spacer(minLength: 0)
            Text(title)
                .font(.system(size: 12))
                .foregroundStyle(Theme.sub)
                .lineLimit(1)
            Text(value)
                .font(.system(size: 17, weight: .semibold, design: .monospaced))
                .foregroundStyle(valueColor)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(10)
        .frame(maxWidth: .infinity, minHeight: 92, alignment: .leading)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.border, lineWidth: 1))
    }
}
