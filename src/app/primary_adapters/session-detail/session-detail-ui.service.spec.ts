import { TestBed } from "@angular/core/testing";
import { SessionDetailUiService } from "./session-detail-ui.service";

describe("SessionDetailUiService", () => {
	let service: SessionDetailUiService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(SessionDetailUiService);
	});

	it("showAddExerciseForm starts as false", () => {
		expect(service.showAddExerciseForm()).toBe(false);
	});

	it("openAddExerciseForm sets showAddExerciseForm to true", () => {
		service.openAddExerciseForm();

		expect(service.showAddExerciseForm()).toBe(true);
	});

	it("closeAddExerciseForm sets showAddExerciseForm back to false", () => {
		service.openAddExerciseForm();
		service.closeAddExerciseForm();

		expect(service.showAddExerciseForm()).toBe(false);
	});
});
