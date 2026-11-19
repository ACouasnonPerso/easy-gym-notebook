import Foundation

// Contract shared with the web app: src/app/core_logic/watch/watch.models.ts
// Any change here must be mirrored on the TypeScript side.

struct WatchSnapshot: Codable, Equatable {
    var version: Int
    var session: WatchSessionPayload?
    var ratingOptions: [WatchRatingOption]
    var labels: [String: String]
    var appliedActionIds: [String]
}

struct WatchSessionPayload: Codable, Equatable {
    var id: String
    var title: String
    var startedAt: String
    var exercises: [WatchExercise]
}

struct WatchExercise: Codable, Equatable, Identifiable, Hashable {
    var id: String
    var name: String
    var muscleLabel: String?
    var muscleColor: String?
    var sets: Int
    var reps: Int
    var loadLabel: String
    var isCardio: Bool
    var breakDurationSeconds: Int
    var status: String
    var rating: Int?

    var isValidated: Bool { status == "validated" }

    /// "4×10 · 60 kg", or "30 min · 5 km" for cardio.
    var summary: String {
        isCardio ? loadLabel : "\(sets)×\(reps) · \(loadLabel)"
    }
}

// Tolerant decoding: one odd number (null, decimal) must not drop the whole snapshot.
extension WatchExercise {
    enum CodingKeys: String, CodingKey {
        case id, name, muscleLabel, muscleColor, sets, reps, loadLabel, isCardio, breakDurationSeconds, status, rating
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = (try? c.decode(String.self, forKey: .name)) ?? ""
        muscleLabel = try? c.decodeIfPresent(String.self, forKey: .muscleLabel)
        muscleColor = try? c.decodeIfPresent(String.self, forKey: .muscleColor)
        sets = max(1, c.flexibleInt(.sets) ?? 1)
        reps = c.flexibleInt(.reps) ?? 0
        loadLabel = (try? c.decode(String.self, forKey: .loadLabel)) ?? ""
        isCardio = (try? c.decode(Bool.self, forKey: .isCardio)) ?? false
        breakDurationSeconds = c.flexibleInt(.breakDurationSeconds) ?? 90
        status = (try? c.decode(String.self, forKey: .status)) ?? "pending"
        rating = c.flexibleInt(.rating)
    }
}

extension KeyedDecodingContainer {
    /// Reads an integer sent as Int or Double; nil when missing, null or not a finite number.
    func flexibleInt(_ key: Key) -> Int? {
        if let value = try? decodeIfPresent(Int.self, forKey: key) { return value }
        if let value = try? decodeIfPresent(Double.self, forKey: key), value.isFinite { return Int(value.rounded()) }
        return nil
    }
}

struct WatchRatingOption: Codable, Equatable, Identifiable {
    var value: Int
    var display: String
    var label: String

    var id: Int { value }
}

enum WatchActionType: String, Codable {
    case rate
    case validate
}

struct WatchAction: Codable, Equatable, Identifiable {
    var id: String
    var type: WatchActionType
    var sessionId: String
    var exerciseId: String
    var rating: Int?
    var at: String

    static func rate(sessionId: String, exerciseId: String, rating: Int?) -> WatchAction {
        WatchAction(id: UUID().uuidString, type: .rate, sessionId: sessionId, exerciseId: exerciseId, rating: rating, at: Self.now())
    }

    static func validate(sessionId: String, exerciseId: String) -> WatchAction {
        WatchAction(id: UUID().uuidString, type: .validate, sessionId: sessionId, exerciseId: exerciseId, rating: nil, at: Self.now())
    }

    private static func now() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: Date())
    }

    enum CodingKeys: String, CodingKey {
        case id, type, sessionId, exerciseId, rating, at
    }

    // The web app expects `"rating": null` (not a missing key) when a rating is cleared.
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(type, forKey: .type)
        try container.encode(sessionId, forKey: .sessionId)
        try container.encode(exerciseId, forKey: .exerciseId)
        try container.encode(at, forKey: .at)
        if type == .rate {
            try container.encode(rating, forKey: .rating)
        }
    }

    func jsonString() -> String? {
        guard let data = try? JSONEncoder().encode(self) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
