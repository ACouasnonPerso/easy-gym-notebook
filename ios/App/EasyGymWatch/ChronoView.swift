import SwiftUI

/// Timer of the selected exercise. Double tap (thumb + index) triggers the
/// highlighted button: start, then rest, then next set.
struct ChronoView: View {
    @EnvironmentObject private var store: WatchStore
    @EnvironmentObject private var chrono: ChronoEngine

    private let ticker = Timer.publish(every: 0.5, on: .main, in: .common).autoconnect()

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { context in
            VStack(spacing: 6) {
                ring(at: context.date)
                hint
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
        .onAppear {
            if let exercise = store.selectedExercise {
                chrono.configure(
                    for: exercise,
                    restOverTitle: store.text("restOver"),
                    restOverBody: store.text("restOverBody")
                )
            }
            ChronoEngine.requestNotificationPermission()
        }
        .onReceive(ticker) { now in
            chrono.tick(now: now)
        }
    }

    // MARK: Parts

    private var ringColor: Color {
        chrono.state.mode == .rest ? Theme.ringRest : Theme.ringTraining
    }

    private func ring(at date: Date) -> some View {
        ZStack {
            Circle()
                .stroke(Theme.card2, lineWidth: 6)
            Circle()
                .trim(from: 0, to: chrono.progress(at: date))
                .stroke(ringColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 0.4), value: chrono.progress(at: date))
            VStack(spacing: 2) {
                Text(formatClock(chrono.displayedSeconds(at: date)))
                    .font(.system(size: 30, weight: .semibold, design: .monospaced))
                    .minimumScaleFactor(0.7)
                Text(statusLabel)
                    .font(.system(size: 10, weight: .bold))
                    .tracking(1.2)
                    .foregroundStyle(ringColor)
            }
        }
        .frame(width: 104, height: 104)
    }

    private var hint: some View {
        HStack(spacing: 4) {
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
        if !chrono.state.hasStarted { return store.text("readyQuestion") }
        if !chrono.state.isRunning { return store.text("paused") }
        return store.text(chrono.state.mode == .rest ? "rest" : "training")
    }

    private var hintText: String {
        if !chrono.state.hasStarted { return store.text("doubleTapStart") }
        return store.text(chrono.state.mode == .rest ? "doubleTapNextSet" : "doubleTapRest")
    }

    private var primaryLabel: String {
        if !chrono.state.hasStarted { return store.text("startButton") }
        return store.text(chrono.state.mode == .rest ? "setButton" : "restButton")
    }

    private var primaryColor: Color {
        if !chrono.state.hasStarted { return Theme.ringTraining }
        return chrono.state.mode == .rest ? Theme.ringTraining : Theme.ringRest
    }
}
