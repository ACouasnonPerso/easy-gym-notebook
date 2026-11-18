import SwiftUI

/// Difficulty /20, same scale and texts as the app. Tap the current value again to clear it.
struct RatingView: View {
    @EnvironmentObject private var store: WatchStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 4) {
                    ForEach(store.ratingOptions) { option in
                        Button {
                            if let exercise = store.selectedExercise {
                                store.toggleRating(option.value, for: exercise)
                            }
                            dismiss()
                        } label: {
                            row(option)
                        }
                        .buttonStyle(.plain)
                        .id(option.value)
                    }
                }
            }
            .onAppear {
                if let current = store.selectedExercise?.rating {
                    proxy.scrollTo(current, anchor: .center)
                }
            }
        }
        .navigationTitle(store.text("difficulty"))
        .containerBackground(Theme.background, for: .navigation)
    }

    private func row(_ option: WatchRatingOption) -> some View {
        let isSelected = store.selectedExercise?.rating == option.value
        return HStack(spacing: 8) {
            Text(option.display)
                .font(.system(size: 16, weight: .bold, design: .monospaced))
                .foregroundStyle(Theme.orange)
                .frame(minWidth: 42, alignment: .trailing)
            Text(option.label)
                .font(.system(size: 12))
                .foregroundStyle(Theme.sub)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 7)
        .padding(.trailing, 8)
        .background(isSelected ? Theme.orange.opacity(0.15) : Theme.card, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(isSelected ? Theme.orange : Theme.border, lineWidth: 1))
    }
}
