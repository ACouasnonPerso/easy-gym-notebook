import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { RequestReviewUseCase } from "./request-review.usecase";
import { ReviewService } from "../../core_logic/review/review.service";
import { REVIEW_REPOSITORY } from "../../secondary_ports/review/review.repository.interface";

class FakeReviewRepository {
	async hasRequested(): Promise<boolean> {
		return false;
	}
	async markAsRequested(): Promise<void> {}
}

describe("RequestReviewUseCase", () => {
	let useCase: RequestReviewUseCase;
	let reviewServiceSpy: jasmine.SpyObj<ReviewService>;

	beforeEach(() => {
		const hasRequestedSignal = signal(false);
		reviewServiceSpy = jasmine.createSpyObj<ReviewService>("ReviewService", ["initialize", "requestReview"], {
			hasRequested: hasRequestedSignal,
		});

		TestBed.configureTestingModule({
			providers: [
				RequestReviewUseCase,
				{ provide: ReviewService, useValue: reviewServiceSpy },
				{ provide: REVIEW_REPOSITORY, useClass: FakeReviewRepository },
			],
		});

		useCase = TestBed.inject(RequestReviewUseCase);
	});

	it("expose le signal hasRequested du service", () => {
		expect(useCase.hasRequested).toBe(reviewServiceSpy.hasRequested);
	});

	it("execute() délègue à reviewService.requestReview() et retourne son résultat", async () => {
		reviewServiceSpy.requestReview.and.returnValue(Promise.resolve(true));
		const result = await useCase.execute();
		expect(reviewServiceSpy.requestReview).toHaveBeenCalledTimes(1);
		expect(result).toBe(true);
	});
});
