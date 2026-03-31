import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, RouterLink } from "@angular/router";
import { SessionBottomNavComponent } from "./session-bottom-nav.component";
import { SessionDetailUiService } from "../session-detail/session-detail-ui.service";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const FR_TRANSLATIONS = {
	nav: {
		sessionNavigation: "Navigation session",
		session: "Session",
		addExercise: "Ajouter un exercice",
		chrono: "Chrono",
	},
};

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of(FR_TRANSLATIONS as unknown as TranslationObject);
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

function createUiServiceSpy() {
	return {
		showAddExerciseForm: jasmine.createSpy("showAddExerciseForm"),
		openAddExerciseForm: jasmine.createSpy("openAddExerciseForm"),
		closeAddExerciseForm: jasmine.createSpy("closeAddExerciseForm"),
		currentSessionId: signal(null),
	};
}

async function setup() {
	const uiServiceSpy = createUiServiceSpy();

	await TestBed.configureTestingModule({
		imports: [SessionBottomNavComponent, translateModuleConfig],
		providers: [provideRouter([]), { provide: SessionDetailUiService, useValue: uiServiceSpy }],
	}).compileComponents();
	setupI18n();

	const fixture = TestBed.createComponent(SessionBottomNavComponent);
	fixture.detectChanges();

	return { fixture, uiServiceSpy };
}

describe("SessionBottomNavComponent", () => {
	it('affiche un lien "Sessions" vers /sessions', async () => {
		const { fixture } = await setup();

		const links = fixture.debugElement.queryAll(By.directive(RouterLink));
		const sessionsLink = links.find((l) => {
			const rl = l.injector.get(RouterLink);
			return rl.href === "/sessions";
		});
		expect(sessionsLink).toBeTruthy();
	});

	it('affiche un lien "Chrono" vers /chrono/exercise', async () => {
		const { fixture } = await setup();

		const links = fixture.debugElement.queryAll(By.directive(RouterLink));
		const chronoLink = links.find((l) => {
			const rl = l.injector.get(RouterLink);
			return rl.href === "/chrono/exercise";
		});
		expect(chronoLink).toBeTruthy();
	});

	it('le bouton central "+" appelle openAddExerciseForm au clic', async () => {
		const { fixture, uiServiceSpy } = await setup();

		const addBtn = fixture.debugElement.query(By.css('[aria-label="Ajouter un exercice"]'));
		addBtn.nativeElement.click();

		expect(uiServiceSpy.openAddExerciseForm).toHaveBeenCalledTimes(1);
	});
});
