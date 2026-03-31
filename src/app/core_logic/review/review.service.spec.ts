import { TestBed } from "@angular/core/testing";
import { Capacitor } from "@capacitor/core";
import { ReviewService } from "./review.service";
import { REVIEW_REPOSITORY, IReviewRepository } from "../../secondary_ports/review/review.repository.interface";

class FakeReviewRepository implements IReviewRepository {
	private _hasRequested = false;

	async hasRequested(): Promise<boolean> {
		return this._hasRequested;
	}

	async markAsRequested(): Promise<void> {
		this._hasRequested = true;
	}
}

describe("ReviewService", () => {
	let service: ReviewService;
	let fakeRepo: FakeReviewRepository;

	beforeEach(() => {
		fakeRepo = new FakeReviewRepository();

		TestBed.configureTestingModule({
			providers: [ReviewService, { provide: REVIEW_REPOSITORY, useValue: fakeRepo }],
		});

		service = TestBed.inject(ReviewService);
	});

	describe("requestReview()", () => {
		it("retourne false et ne persiste pas le flag quand le plugin est indisponible", async () => {
			spyOn(Capacitor, "isPluginAvailable").and.returnValue(false);
			const result = await service.requestReview();
			expect(result).toBe(false);
			expect(service.hasRequested()).toBe(false);
			expect(await fakeRepo.hasRequested()).toBe(false);
		});

		it("retourne false et ne persiste pas le flag si le plugin lance une erreur", async () => {
			spyOn(Capacitor, "isPluginAvailable").and.returnValue(true);
			// Le dynamic import échoue en env de test (plugin natif absent) → catch → false
			const result = await service.requestReview();
			expect(result).toBe(false);
			expect(service.hasRequested()).toBe(false);
			expect(await fakeRepo.hasRequested()).toBe(false);
		});
	});

	describe("initialize()", () => {
		it("positionne hasRequested à false quand le dépôt retourne false", async () => {
			await service.initialize();
			expect(service.hasRequested()).toBe(false);
		});

		it("positionne hasRequested à true quand le dépôt retourne true", async () => {
			await fakeRepo.markAsRequested();
			await service.initialize();
			expect(service.hasRequested()).toBe(true);
		});
	});
});
