import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Router, provideRouter } from "@angular/router";
import { BottomNavComponent } from "./bottom-nav.component";
import { CreateSessionUseCase } from "../../primary_ports/session-list/create-session.usecase";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const FR_TRANSLATIONS = {
	nav: { main: "Navigation principale", sessions: "Sessions", addSession: "Ajouter une séance", stats: "Stats" },
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

function createCreateSessionSpy() {
	return { execute: jasmine.createSpy("execute") };
}

async function setup(initialUrl = "/sessions") {
	const createSessionSpy = createCreateSessionSpy();

	await TestBed.configureTestingModule({
		imports: [BottomNavComponent, translateModuleConfig],
		providers: [
			provideRouter([
				{ path: "sessions", component: BottomNavComponent },
				{ path: "sessions/:id", component: BottomNavComponent },
				{ path: "stats", component: BottomNavComponent },
			]),
			{ provide: CreateSessionUseCase, useValue: createSessionSpy },
		],
	}).compileComponents();
	setupI18n();

	const router = TestBed.inject(Router);
	await router.navigateByUrl(initialUrl);

	const fixture = TestBed.createComponent(BottomNavComponent);
	fixture.detectChanges();
	await fixture.whenStable();
	fixture.detectChanges();

	return { fixture, createSessionSpy };
}

describe('BottomNavComponent — bouton central toujours "+"', () => {
	it('affiche toujours le bouton "+" sur /sessions', async () => {
		const { fixture } = await setup("/sessions");

		const addBtn = fixture.debugElement.query(By.css('[aria-label="Ajouter une séance"]'));
		expect(addBtn).not.toBeNull();
	});

	it('affiche toujours le bouton "+" sur /stats', async () => {
		const { fixture } = await setup("/stats");

		const addBtn = fixture.debugElement.query(By.css('[aria-label="Ajouter une séance"]'));
		expect(addBtn).not.toBeNull();
	});

	it('affiche toujours le bouton "+" sur /sessions/:id', async () => {
		const { fixture } = await setup("/sessions/session-42");

		const addBtn = fixture.debugElement.query(By.css('[aria-label="Ajouter une séance"]'));
		expect(addBtn).not.toBeNull();
	});

	it('appelle createSession au clic sur le bouton "+"', async () => {
		const { fixture, createSessionSpy } = await setup("/sessions");

		const addBtn = fixture.debugElement.query(By.css('[aria-label="Ajouter une séance"]'));
		addBtn.nativeElement.click();

		expect(createSessionSpy.execute).toHaveBeenCalledTimes(1);
	});
});
