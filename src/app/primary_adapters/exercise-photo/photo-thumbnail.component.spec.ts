import { TestBed } from "@angular/core/testing";
import { PhotoThumbnailComponent } from "./photo-thumbnail.component";
import { GetExercisePhotoUseCase } from "../../primary_ports/exercise-photo/get-exercise-photo.usecase";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";

function makeUseCase(dataUrl: string | undefined): GetExercisePhotoUseCase {
	const store = new ExercisePhotoStore();
	if (dataUrl) {
		store.setAll([{ exerciseName: "Squat", dataUrl, capturedAt: new Date() }]);
	}
	const useCase = new GetExercisePhotoUseCase();
	(useCase as any).store = store;
	return useCase;
}

async function setup(exerciseName: string, dataUrl?: string) {
	const useCaseSpy = jasmine.createSpyObj<GetExercisePhotoUseCase>("GetExercisePhotoUseCase", ["photoFor"]);
	useCaseSpy.photoFor.and.returnValue(dataUrl);

	await TestBed.configureTestingModule({
		imports: [PhotoThumbnailComponent],
		providers: [
			{ provide: GetExercisePhotoUseCase, useValue: useCaseSpy },
		],
	}).compileComponents();

	const fixture = TestBed.createComponent(PhotoThumbnailComponent);
	fixture.componentRef.setInput("exerciseName", exerciseName);
	fixture.detectChanges();

	return { fixture, component: fixture.componentInstance, useCaseSpy };
}

describe("PhotoThumbnailComponent", () => {
	it("should render nothing when no photo exists for the given exercise name", async () => {
		const { fixture } = await setup("Squat", undefined);

		const img = fixture.nativeElement.querySelector("img");

		expect(img).toBeFalsy();
	});

	it("should render an img element when a photo exists for the given exercise name", async () => {
		const { fixture } = await setup("Squat", "data:image/jpeg;base64,squat");

		const img = fixture.nativeElement.querySelector("img");

		expect(img).toBeTruthy();
	});

	it("should set the img src to the data URL when a photo exists", async () => {
		const { fixture } = await setup("Squat", "data:image/jpeg;base64,squat");

		const img: HTMLImageElement = fixture.nativeElement.querySelector("img");

		expect(img.src).toContain("data:image/jpeg;base64,squat");
	});

	it("should emit clickPhoto event when the img is clicked", async () => {
		const { fixture, component } = await setup("Squat", "data:image/jpeg;base64,squat");
		const emitted: string[] = [];
		component.clickPhoto.subscribe((url: string) => emitted.push(url));

		const img: HTMLImageElement = fixture.nativeElement.querySelector("img");
		img.click();

		expect(emitted.length).toBe(1);
		expect(emitted[0]).toBe("data:image/jpeg;base64,squat");
	});

	it("should not emit clickPhoto when no photo is present and the component renders nothing", async () => {
		const { fixture, component } = await setup("Squat", undefined);
		const emitted: string[] = [];
		component.clickPhoto.subscribe((url: string) => emitted.push(url));
		fixture.detectChanges();

		// no img to click, no events should fire
		expect(emitted.length).toBe(0);
	});
});
