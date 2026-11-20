import SwiftUI

/// Colors of the Easy Gym app (src/styles.scss).
enum Theme {
    static let background = Color(hex: "#0c0c14")
    static let card = Color(hex: "#16161f")
    static let card2 = Color(hex: "#1e1e2a")
    static let border = Color(hex: "#2a2a38")
    static let orange = Color(hex: "#f5a623")
    static let green = Color(hex: "#22c55e")
    static let ringTraining = Color(hex: "#4caf50")
    static let ringRest = Color(hex: "#f5a623")
    static let red = Color(hex: "#ef4444")
    static let text = Color(hex: "#f0f0f8")
    static let sub = Color(hex: "#9999aa")
}

extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        let r, g, b: Double
        if cleaned.count == 6 {
            r = Double((value >> 16) & 0xFF) / 255
            g = Double((value >> 8) & 0xFF) / 255
            b = Double(value & 0xFF) / 255
        } else {
            r = 1; g = 1; b = 1
        }
        self.init(red: r, green: g, blue: b)
    }
}

/// Applies the double tap gesture (Apple Watch Series 9 / Ultra 2 and later, watchOS 11+).
struct PrimaryHandGesture: ViewModifier {
    func body(content: Content) -> some View {
        if #available(watchOS 11.0, *) {
            content.handGestureShortcut(.primaryAction)
        } else {
            content
        }
    }
}

struct MuscleTag: View {
    let label: String
    let colorHex: String?

    var body: some View {
        let color = colorHex.map { Color(hex: $0) } ?? Theme.orange
        Text(label)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
            .background(color.opacity(0.15), in: Capsule())
            .overlay(Capsule().stroke(color.opacity(0.3), lineWidth: 1))
    }
}

func formatClock(_ seconds: Int) -> String {
    let safe = max(0, seconds)
    return String(format: "%d:%02d", safe / 60, safe % 60)
}
