import { TestBed, ComponentFixture, fakeAsync, tick } from "@angular/core/testing";
import { signal } from "@angular/core";
import { TranslateLoader, TranslateModule, TranslateService } from "@ngx-translate/core";
import { of } from "rxjs";
import { StatsImportExportCardComponent } from "./stats-import-export-card.component";
import { ImportDataUseCase } from "../../primary_ports/stats-global/import-data.usecase";
import { DeleteAllDataUseCase } from "../../primary_ports/stats-global/delete-all-data.usecase";
import { GetSessionsUseCase } from "../../primary_ports/session-list/get-sessions.usecase";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Router } from "@angular/router";
import { Session } from "../../core_logic/shared/models";

class FakeLoader implements TranslateLoader {
	getTranslation(_lang: string) {
		return of({
			import: {
				cardTitle: "Import / Export",
				exportJson: "Export JSON",
				importJson: "Import JSON",
				confirmTitle: "Confirm import",
				sessions: "session(s)",
				exercises: "exercise(s)",
				successMessage: "Import successful",
				errorInvalidJson: "Invalid JSON file",
				errorMissingSessions: "Missing sessions array",
				errorMissingExercises: "Missing exercises array",
				errorInvalidSession: "Invalid session entry",
				errorInvalidExercise: "Invalid exercise entry",
				errorUnknown: "Unknown error",
			},
			deleteAllData: {
				buttonLabel: "Delete all data",
				title: "Delete all data",
				body: "This will permanently delete all your sessions.",
				inputLabel: "Type to confirm",
				inputPlaceholder: "Supprimer",
				confirmWord: "Supprimer",
				successMessage: "All data deleted",
				errorMessage: "An error occurred.",
			},
			common: {
				cancel: "Cancel",
				delete: "Delete",
				confirm: "Confirm",
			},
		});
	}
}

function makeSession(id: string): Session {
	return {
		id,
		date: new Date("2024-01-01"),
		status: "completed",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
	};
}

describe("StatsImportExportCardComponent — delete all data", () => {
	let fixture: ComponentFixture<StatsImportExportCardComponent>;
	let component: StatsImportExportCardComponent;
	let deleteAllUseCase: jasmine.SpyObj<DeleteAllDataUseCase>;
	let routerSpy: jasmine.SpyObj<Router>;
	let sessionsSignal: ReturnType<typeof signal<Session[]>>;

	beforeEach(async () => {
		sessionsSignal = signal<Session[]>([]);
		deleteAllUseCase = jasmine.createSpyObj<DeleteAllDataUseCase>("DeleteAllDataUseCase", {
			execute: Promise.resolve(),
		});
		routerSpy = jasmine.createSpyObj<Router>("Router", { navigate: Promise.resolve(true) });

		const importUseCase = jasmine.createSpyObj("ImportDataUseCase", ["validate", "persist"], {
			importError: signal(null),
			importCount: signal(0),
			importPending: signal(false),
		});

		const getSessionsUseCase = { sessions: sessionsSignal, execute: () => {} };

		await TestBed.configureTestingModule({
			imports: [
				StatsImportExportCardComponent,
				TranslateModule.forRoot({
					loader: { provide: TranslateLoader, useClass: FakeLoader },
				}),
			],
			providers: [
				{ provide: ImportDataUseCase, useValue: importUseCase },
				{ provide: DeleteAllDataUseCase, useValue: deleteAllUseCase },
				{ provide: GetSessionsUseCase, useValue: getSessionsUseCase },
				{ provide: Router, useValue: routerSpy },
				{
					provide: SESSION_REPOSITORY,
					useValue: {
						getAll: jasmine.createSpy().and.returnValue(Promise.resolve([])),
						getById: jasmine.createSpy().and.returnValue(Promise.resolve(null)),
						save: jasmine.createSpy().and.returnValue(Promise.resolve()),
						delete: jasmine.createSpy().and.returnValue(Promise.resolve()),
					},
				},
				{
					provide: EXERCISE_REPOSITORY,
					useValue: {
						getAll: jasmine.createSpy().and.returnValue(Promise.resolve([])),
						getBySessionId: jasmine.createSpy().and.returnValue(Promise.resolve([])),
						save: jasmine.createSpy().and.returnValue(Promise.resolve()),
						delete: jasmine.createSpy().and.returnValue(Promise.resolve()),
					},
				},
			],
		}).compileComponents();

		const translate = TestBed.inject(TranslateService);
		translate.use("en");

		fixture = TestBed.createComponent(StatsImportExportCardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	function getDeleteAllBtn(): HTMLButtonElement | null {
		return fixture.nativeElement.querySelector("[data-testid='delete-all-btn']");
	}

	function getModal(): HTMLElement | null {
		return fixture.nativeElement.querySelector("[data-testid='delete-all-modal']") ??
			fixture.nativeElement.querySelector("app-delete-all-modal");
	}

	describe("button visibility", () => {
		it("should NOT render the delete all button when sessions is empty", () => {
			sessionsSignal.set([]);
			fixture.detectChanges();
			expect(getDeleteAllBtn()).toBeNull();
		});

		it("should render the delete all button when sessions has entries", () => {
			sessionsSignal.set([makeSession("s1")]);
			fixture.detectChanges();
			expect(getDeleteAllBtn()).not.toBeNull();
		});
	});

	describe("modal opening", () => {
		it("should show the modal when delete all button is clicked", () => {
			sessionsSignal.set([makeSession("s1")]);
			fixture.detectChanges();
			expect(getModal()).toBeNull();

			getDeleteAllBtn()!.click();
			fixture.detectChanges();

			expect(getModal()).not.toBeNull();
		});

		it("should hide the modal when cancelled", () => {
			sessionsSignal.set([makeSession("s1")]);
			fixture.detectChanges();

			component.showDeleteAllModal.set(true);
			fixture.detectChanges();
			expect(getModal()).not.toBeNull();

			component.onDeleteAllCancelled();
			fixture.detectChanges();
			expect(getModal()).toBeNull();
		});
	});

	describe("success path", () => {
		it("should call use case, navigate, and show success toast on confirm", fakeAsync(async () => {
			deleteAllUseCase.execute.and.returnValue(Promise.resolve());

			await component.onDeleteAllConfirmed();
			tick(20);
			fixture.detectChanges();

			expect(deleteAllUseCase.execute).toHaveBeenCalledTimes(1);
			expect(routerSpy.navigate).toHaveBeenCalledWith(["/sessions"]);
			expect(component.toastType()).toBe("success");
			expect(component.toastMessage()).toBe("All data deleted");
		}));
	});

	describe("error path", () => {
		it("should show error toast and NOT navigate when use case throws", fakeAsync(async () => {
			deleteAllUseCase.execute.and.returnValue(Promise.reject(new Error("fail")));

			await component.onDeleteAllConfirmed();
			tick(20);
			fixture.detectChanges();

			expect(routerSpy.navigate).not.toHaveBeenCalled();
			expect(component.toastType()).toBe("error");
			expect(component.toastMessage()).toBe("An error occurred.");
		}));
	});

	describe("cancel path", () => {
		it("should close the modal without side effects", () => {
			component.showDeleteAllModal.set(true);
			fixture.detectChanges();

			component.onDeleteAllCancelled();
			fixture.detectChanges();

			expect(component.showDeleteAllModal()).toBe(false);
			expect(deleteAllUseCase.execute).not.toHaveBeenCalled();
			expect(routerSpy.navigate).not.toHaveBeenCalled();
		});
	});
});
