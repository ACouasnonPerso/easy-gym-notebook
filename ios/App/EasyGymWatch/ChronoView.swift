import SwiftUI

/// Timer of the selected exercise. Double tap (thumb + index) triggers the
/// highlighted button: start, then rest, then next set.
struct ChronoView: View {
    @EnvironmentObject private var store: WatchStore
    @EnvironmentObject private var chrono: ChronoEngine
    @EnvironmentObject private var workout: WorkoutManager
    /// Set duration of the auto mode, driven by the Digital Crown on the "Ready?" screen.
    @State private var crownValue: Double = ChronoEngine.defaultSetDuration

    private var isEditingAuto: Bool { chrono.canEditAuto && chrono.state.isAuto }

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { context in
            VStack(spacing: 6) {
                ring(at: context.date)
                if chrono.canEditAuto {
                    autoToggle
                } else {
                    hint
                }
                controls
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle(store.selectedExercise?.name ?? "")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Text("\(store.text("setShort"))\(chrono.state.currentSet)/\(chrono.state.totalSets)")
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.orange)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Theme.orange.opacity(0.15), in: Capsule())
            }
        }
        .containerBackground(Theme.background, for: .navigation)
        .onChange(of: crownValue) { _, value in
            chrono.setSetDuration(value)
        }
        .onAppear {
            if let exercise = store.selectedExercise {
                chrono.configure(
                    for: exercise,
                    texts: ChronoEngine.PhaseTexts(
                        restOverTitle: store.text("restOver"),
                        restOverBody: store.text("restOverBody"),
                        setOverTitle: store.text("setOver"),
                        setOverBody: store.text("setOverBody"),
                        finishedTitle: store.text("exerciseFinished"),
                        finishedBody: store.text("exerciseFinishedBody")
                    )
                )
            }
            crownValue = chrono.state.setDuration
            ChronoEngine.requestNotificationPermission()
        }
    }

    // MARK: Parts

    private var ringColor: Color {
        chrono.state.mode == .rest ? Theme.ringRest : Theme.ringTraining
    }

    private func ring(at date: Date) -> some View {
        ZStack {
            RoundedRing(cornerRadius: 30)
                .stroke(Theme.card2, lineWidth: 6)
            RoundedRing(cornerRadius: 30)
                .trim(from: 0, to: chrono.progress(at: date))
                .stroke(ringColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .animation(.linear(duration: 0.4), value: chrono.progress(at: date))
            VStack(spacing: 2) {
                Text(formatClock(chrono.displayedSeconds(at: date)))
                    .font(.system(size: 30, weight: .semibold, design: .monospaced))
                    .minimumScaleFactor(0.7)
                Text(statusLabel)
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.2)
                    .foregroundStyle(ringColor)
                if isEditingAuto {
                    Image(systemName: "digitalcrown.arrow.clockwise")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.sub)
                        .accessibilityHidden(true)
                }
                if let bpm = workout.heartRate {
                    HStack(spacing: 2) {
                        Image(systemName: "heart.fill")
                        Text("\(bpm)")
                    }
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.red)
                    .accessibilityLabel("\(bpm) BPM")
                }
            }
        }
        // Wide and low rather than a circle, so it does not go up under the exercise name.
        .frame(maxWidth: 156)
        .frame(height: 84)
        .padding(.horizontal, 6)
        .focusable(isEditingAuto)
        .digitalCrownRotation(
            $crownValue,
            from: ChronoEngine.setDurationRange.lowerBound,
            through: ChronoEngine.setDurationRange.upperBound,
            by: ChronoEngine.setDurationStep,
            sensitivity: .medium,
            isContinuous: false,
            isHapticFeedbackEnabled: true
        )
        .accessibilityValue(isEditingAuto ? "\(Int(chrono.state.setDuration)) s" : "")
    }

    /// "Ready?" screen only: turns the auto mode on or off for this exercise.
    private var autoToggle: some View {
        Button {
            chrono.setAuto(!chrono.state.isAuto)
            crownValue = chrono.state.setDuration
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "repeat")
                    .font(.system(size: 11, weight: .bold))
                Text(store.text("auto"))
                    .font(.system(size: 12, weight: .bold))
                if chrono.state.isAuto {
                    Text("· \(store.text("setLabel")) \(Int(chrono.state.setDuration)) s")
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                }
            }
            .foregroundStyle(chrono.state.isAuto ? Theme.background : Theme.sub)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(chrono.state.isAuto ? Theme.green : Theme.card2, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(chrono.state.isAuto ? .isSelected : [])
    }

    private var hint: some View {
        HStack(spacing: 4) {
            if chrono.state.isAuto {
                Text(store.text("auto").uppercased())
                    .font(.system(size: 9, weight: .heavy))
                    .foregroundStyle(Theme.background)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 1)
                    .background(Theme.green, in: Capsule())
            }
            Image(systemName: "hand.tap")
                .font(.system(size: 11))
            Text(hintText)
                .font(.system(size: 11))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .foregroundStyle(Theme.sub)
    }

    private var controls: some View {
        HStack(spacing: 8) {
            Button {
                chrono.reset()
            } label: {
                Image(systemName: "arrow.counterclockwise")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(Theme.red)
                    .frame(width: 40, height: 40)
                    .background(Theme.red.opacity(0.15), in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(store.text("reset"))

            Button {
                chrono.toggleRunning()
            } label: {
                Image(systemName: chrono.state.isRunning ? "pause.fill" : "play.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(ringColor)
                    .frame(width: 44, height: 44)
                    .background(ringColor.opacity(0.15), in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(store.text(chrono.state.isRunning ? "pause" : "resume"))

            Button {
                chrono.primaryAction()
            } label: {
                Text(primaryLabel)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primaryColor)
                    .frame(width: 64, height: 40)
                    .background(primaryColor.opacity(0.18), in: Capsule())
            }
            .buttonStyle(.plain)
            .modifier(PrimaryHandGesture())
        }
    }

    // MARK: Texts

    private var statusLabel: String {
        if chrono.state.isFinished { return store.text("finished") }
        if !chrono.state.hasStarted { return store.text("readyQuestion") }
        if !chrono.state.isRunning { return store.text("paused") }
        return store.text(chrono.state.mode == .rest ? "rest" : "training")
    }

    private var hintText: String {
        if chrono.state.isFinished { return store.text("doubleTapRestart") }
        if !chrono.state.hasStarted { return store.text("doubleTapStart") }
        return store.text(chrono.state.mode == .rest ? "doubleTapNextSet" : "doubleTapRest")
    }

    private var primaryLabel: String {
        if !chrono.state.hasStarted || chrono.state.isFinished { return store.text("startButton") }
        return store.text(chrono.state.mode == .rest ? "setButton" : "restButton")
    }

    private var primaryColor: Color {
        if !chrono.state.hasStarted || chrono.state.isFinished { return Theme.ringTraining }
        return chrono.state.mode == .rest ? Theme.ringTraining : Theme.ringRest
    }
}

/// Rounded rectangle outline that starts at the top center and goes clockwise,
/// so `trim` fills it like a clock (the chrono progress).
struct RoundedRing: Shape {
    var cornerRadius: CGFloat

    func path(in rect: CGRect) -> Path {
        let radius = min(cornerRadius, rect.width / 2, rect.height / 2)
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY), tangent2End: CGPoint(x: rect.maxX, y: rect.maxY), radius: radius)
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY), tangent2End: CGPoint(x: rect.minX, y: rect.maxY), radius: radius)
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY), tangent2End: CGPoint(x: rect.minX, y: rect.minY), radius: radius)
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY), tangent2End: CGPoint(x: rect.midX, y: rect.minY), radius: radius)
        path.closeSubpath()
        return path
    }
}
