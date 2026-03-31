import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Router, provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { AppComponent } from "./app.component";
import { CreateSessionUseCase } from "./primary_ports/session-list/create-session.usecase";
import { SessionDetailUiService } from "./primary_adapters/session-detail/session-detail-ui.service";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { SESSION_REPOSITORY } from "./secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "./secondary_ports/exercise/exercise.repository.interface";

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

function createCreateSessionSpy() {
	return { execute: jasmine.createSpy("execute") };
}

function createUiServiceStub() {
	return {
		showAddExerciseForm: () => false,
		openAddExerciseForm: jasmine.createSpy("openAddExerciseForm"),
		closeAddExerciseForm: jasmine.createSpy("closeAddExerciseForm"),
		currentSessionId: signal<string | null>(null),
		setCurrentSessionId: jasmine.createSpy("setCurrentSessionId"),
	};
}

async function setup(initialUrl: string) {
	await TestBed.configureTestingModule({
		imports: [AppComponent, translateModuleConfig],
		providers: [
			provideRouter([
				{ path: "sessions", component: AppComponent },
				{ path: "sessions/:id", component: AppComponent },
				{ path: "stats", component: AppComponent },
				{ path: "chrono/session", component: AppComponent },
			]),
			{ provide: CreateSessionUseCase, useValue: createCreateSessionSpy() },
			{ provide: SessionDetailUiService, useValue: createUiServiceStub() },
			{
				provide: SESSION_REPOSITORY,
				useValue: {
					getAll: () => Promise.resolve([]),
					getById: () => Promise.resolve(null),
					save: () => Promise.resolve(),
					delete: () => Promise.resolve(),
				},
			},
			{
				provide: EXERCISE_REPOSITORY,
				useValue: {
					getAll: () => Promise.resolve([]),
					getBySessionId: () => Promise.resolve([]),
					save: () => Promise.resolve(),
					delete: () => Promise.resolve(),
				},
			},
		],
	}).compileComponents();
	setupI18n();

	const router = TestBed.inject(Router);
	await router.navigateByUrl(initialUrl);

	const fixture = TestBed.createComponent(AppComponent);
	fixture.detectChanges();
	await fixture.whenStable();
	fixture.detectChanges();

	return { fixture };
}

describe("AppComponent — sélection de navbar selon la route", () => {
	it("affiche app-bottom-nav sur /sessions", async () => {
		const { fixture } = await setup("/sessions");

		const bottomNav = fixture.debugElement.query(By.css("app-bottom-nav"));
		const sessionNav = fixture.debugElement.query(By.css("app-session-bottom-nav"));

		expect(bottomNav).not.toBeNull();
		expect(sessionNav).toBeNull();
	});

	it("affiche app-session-bottom-nav sur /sessions/:id", async () => {
		const { fixture } = await setup("/sessions/abc-123");

		const bottomNav = fixture.debugElement.query(By.css("app-bottom-nav"));
		const sessionNav = fixture.debugElement.query(By.css("app-session-bottom-nav"));

		expect(sessionNav).not.toBeNull();
		expect(bottomNav).toBeNull();
	});

	it("affiche app-session-bottom-nav sur /chrono/session", async () => {
		const { fixture } = await setup("/chrono/session");

		const bottomNav = fixture.debugElement.query(By.css("app-bottom-nav"));
		const sessionNav = fixture.debugElement.query(By.css("app-session-bottom-nav"));

		expect(sessionNav).not.toBeNull();
		expect(bottomNav).toBeNull();
	});
});
