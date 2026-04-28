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

	it("expandedExerciseId starts as null", () => {
		expect(service.expandedExerciseId()).toBeNull();
	});

	it("setExpandedExerciseId remembers which exercise is expanded", () => {
		service.setExpandedExerciseId("exercise-42");

		expect(service.expandedExerciseId()).toBe("exercise-42");
	});

	it("toggleExpandedExercise collapses the exercise when called twice with the same id", () => {
		service.toggleExpandedExercise("exercise-42");
		service.toggleExpandedExercise("exercise-42");

		expect(service.expandedExerciseId()).toBeNull();
	});
});
