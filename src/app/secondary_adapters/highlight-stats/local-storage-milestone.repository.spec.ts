import { LocalStorageMilestoneRepository } from "./local-storage-milestone.repository";

describe("LocalStorageMilestoneRepository", () => {
	let repo: LocalStorageMilestoneRepository;

	beforeEach(() => {
		localStorage.clear();
		repo = new LocalStorageMilestoneRepository();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("should return 0 when no milestone has been stored", () => {
		expect(repo.getLastMilestoneKg()).toBe(0);
	});

	it("should persist a milestone value and return it on next read", () => {
		repo.setLastMilestoneKg(50_000);
		expect(repo.getLastMilestoneKg()).toBe(50_000);
	});

	it("should overwrite a previously stored milestone with the new value", () => {
		repo.setLastMilestoneKg(50_000);
		repo.setLastMilestoneKg(100_000);
		expect(repo.getLastMilestoneKg()).toBe(100_000);
	});

	it("should return 0 when the stored value is corrupted", () => {
		localStorage.setItem("highlight_stats_last_milestone_kg", "corrupted");
		expect(repo.getLastMilestoneKg()).toBe(0);
	});
});
