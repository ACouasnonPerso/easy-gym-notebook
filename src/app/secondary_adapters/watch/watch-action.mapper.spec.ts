import { WatchActionMapper } from "./watch-action.mapper";

describe("WatchActionMapper", () => {
	const mapper = new WatchActionMapper();

	it("parses a validate action", () => {
		const raw = JSON.stringify({
			id: "a1",
			type: "validate",
			sessionId: "s1",
			exerciseId: "e1",
			at: "2026-11-18T18:00:00Z",
		});
		expect(mapper.fromJson(raw)).toEqual({
			id: "a1",
			type: "validate",
			sessionId: "s1",
			exerciseId: "e1",
			at: "2026-11-18T18:00:00Z",
		});
	});

	it("parses a rate action, including a cleared rating", () => {
		const rate = JSON.stringify({ id: "a1", type: "rate", sessionId: "s1", exerciseId: "e1", rating: 16, at: "x" });
		const clear = JSON.stringify({ id: "a2", type: "rate", sessionId: "s1", exerciseId: "e1", rating: null, at: "x" });
		expect(mapper.fromJson(rate)).toEqual(jasmine.objectContaining({ type: "rate", rating: 16 }));
		expect(mapper.fromJson(clear)).toEqual(jasmine.objectContaining({ type: "rate", rating: null }));
	});

	it("rejects malformed payloads", () => {
		expect(mapper.fromJson("not json")).toBeNull();
		expect(mapper.fromJson("null")).toBeNull();
		expect(mapper.fromJson(JSON.stringify({ type: "validate", sessionId: "s1", exerciseId: "e1" }))).toBeNull();
		expect(mapper.fromJson(JSON.stringify({ id: "a", type: "delete", sessionId: "s1", exerciseId: "e1" }))).toBeNull();
		expect(
			mapper.fromJson(JSON.stringify({ id: "a", type: "rate", sessionId: "s1", exerciseId: "e1", rating: "16" }))
		).toBeNull();
	});
});
