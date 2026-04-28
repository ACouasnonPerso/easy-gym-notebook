import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Component, input, output, signal } from "@angular/core";
import { SessionExercisesListComponent } from "./session-exercises-list.component";
import { SessionDetailUiService } from "./session-detail-ui.service";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { Exercise } from "../../core_logic/shared/models";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of({} as TranslationObject);
	}
}
const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n(): void {
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");
}

@Component({ selector: "app-exercise-card", standalone: true, template: '<div class="card" [attr.data-expanded]="isExpanded()"></div>' })
class FakeExerciseCardComponent {
	readonly exercise = input.required<Exercise>();
	readonly isExpanded = input<boolean>(false);
	readonly toggleExpand = output<void>();
	readonly exerciseUpdate = output<Partial<Exercise>>();
	readonly exerciseValidate = output<void>();
	readonly exerciseCancel = output<void>();
	readonly exerciseDelete = output<void>();
	readonly openChrono = output<void>();
	readonly openStats = output<void>();
	readonly openRating = output<void>();
	readonly openComment = output<void>();
	readonly openPhoto = output<string>();
}

@Component({ selector: "app-add-exercise-form", standalone: true, template: '<div class="stub-add-form"></div>' })
class FakeAddExerciseFormComponent {
	readonly sessionId = input.required<string>();
	readonly exerciseAdded = output();
	readonly cancelled = output();
}

@Component({ selector: "app-confirm-dialog", standalone: true, template: "" })
class FakeConfirmDialogComponent {
	readonly message = input<string>();
	readonly confirmed = output();
	readonly cancelled = output();
}

const anExercise: Exercise = {
	id: "ex-1",
	sessionId: "session-1",
	name: "Squat",
	sets: 3,
	reps: 10,
	weightKg: 80,
	breakDurationSeconds: 90,
	status: "pending",
	muscleGroup: null,
	muscleGroups: [],
	isCardio: false,
	isPyramid: false,
	durationSeconds: 0,
	distanceKm: null,
	pyramidSets: [],
	rating: null,
	comment: null,
};

async function setup(expandedExerciseIdSignal = signal<string | null>(null)) {
	const showAddExerciseFormSignal = signal(false);
	const uiServiceStub = {
		showAddExerciseForm: showAddExerciseFormSignal,
		expandedExerciseId: expandedExerciseIdSignal,
		openAddExerciseForm: jasmine.createSpy("openAddExerciseForm"),
		closeAddExerciseForm: jasmine.createSpy("closeAddExerciseForm"),
		toggleExpandedExercise: jasmine.createSpy("toggleExpandedExercise"),
	};

	await TestBed.configureTestingModule({
		imports: [SessionExercisesListComponent, translateModuleConfig],
		providers: [{ provide: SessionDetailUiService, useValue: uiServiceStub }],
	})
		.overrideComponent(SessionExercisesListComponent, {
			set: {
				imports: [FakeExerciseCardComponent, FakeAddExerciseFormComponent, FakeConfirmDialogComponent, TranslateModule],
			},
		})
		.compileComponents();
	setupI18n();

	const fixture = TestBed.createComponent(SessionExercisesListComponent);
	fixture.componentRef.setInput("exercises", []);
	fixture.componentRef.setInput("sessionId", "session-1");
	fixture.detectChanges();

	return { fixture, showAddExerciseFormSignal, expandedExerciseIdSignal, uiServiceSpy: uiServiceStub };
}

describe("SessionExercisesListComponent", () => {
	it("ne contient pas de bouton FAB interne", async () => {
		const { fixture } = await setup();

		const fab = fixture.debugElement.query(By.css(".fab"));
		expect(fab).toBeNull();
	});

	it("should show the exercise as expanded when the service already has its id as expanded (regression: state survives navigation)", async () => {
		const expandedSignal = signal<string | null>("ex-1");
		const { fixture } = await setup(expandedSignal);
		fixture.componentRef.setInput("exercises", [anExercise]);
		fixture.detectChanges();

		const card = fixture.debugElement.query(By.css(".card"));
		expect(card.nativeElement.getAttribute("data-expanded")).toBe("true");
	});
});
