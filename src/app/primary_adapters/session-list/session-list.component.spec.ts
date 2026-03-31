import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { SessionListComponent } from "./session-list.component";
import { GetSessionsUseCase } from "../../primary_ports/session-list/get-sessions.usecase";
import { CreateSessionUseCase } from "../../primary_ports/session-list/create-session.usecase";
import { DuplicateSessionUseCase } from "../../primary_ports/session-list/duplicate-session.usecase";
import { DeleteSessionUseCase } from "../../primary_ports/session-list/delete-session.usecase";
import { SetLanguageUseCase } from "../../primary_ports/language/set-language.usecase";
import { LanguageService } from "../../core_logic/language/language.service";
import { RequestReviewUseCase } from "../../primary_ports/session-list/request-review.usecase";
import { ReviewService } from "../../core_logic/review/review.service";
import { REVIEW_REPOSITORY } from "../../secondary_ports/review/review.repository.interface";
import { Router } from "@angular/router";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of({
			sessionList: {
				title: "Mes séances",
				empty: "Aucune séance",
				duplicate: "Dupliquer",
				delete: "Supprimer",
				deleteConfirm: "Supprimer ?",
				tip: "Conseil",
			},
		} as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n() {
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");
}

function makeProviders(
	activeLang = signal<"fr" | "en">("fr"),
	activeMassUnit = signal<"metric" | "imperial" | "us">("metric")
) {
	const getSessionsSpy = {
		sessions: signal([]),
		execute: jasmine.createSpy("execute"),
	};
	const createSessionSpy = { execute: jasmine.createSpy("execute") };
	const duplicateSessionSpy = { execute: jasmine.createSpy("execute") };
	const deleteSessionSpy = { execute: jasmine.createSpy("execute") };
	const setLanguageSpy = { execute: jasmine.createSpy("execute") };
	const languageServiceSpy = { activeLang, setLanguage: jasmine.createSpy("setLanguage") };
	const massUnitServiceSpy = {
		activeMassUnit,
		setMassUnit: jasmine.createSpy("setMassUnit"),
		detect: jasmine.createSpy("detect").and.returnValue("metric"),
	};
	const routerSpy = { navigate: jasmine.createSpy("navigate") };
	const requestReviewSpy = {
		hasRequested: signal(false),
		execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()),
	};
	const reviewServiceSpy = {
		initialize: jasmine.createSpy("initialize").and.returnValue(Promise.resolve()),
		hasRequested: signal(false),
	};

	return {
		getSessionsSpy,
		createSessionSpy,
		duplicateSessionSpy,
		deleteSessionSpy,
		setLanguageSpy,
		languageServiceSpy,
		massUnitServiceSpy,
		routerSpy,
		requestReviewSpy,
		reviewServiceSpy,
	};
}

describe("SessionListComponent — sélecteur de langue", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<SessionListComponent>>;

	beforeEach(() => {
		const {
			getSessionsSpy,
			createSessionSpy,
			duplicateSessionSpy,
			deleteSessionSpy,
			setLanguageSpy,
			languageServiceSpy,
			massUnitServiceSpy,
			routerSpy,
			requestReviewSpy,
			reviewServiceSpy,
		} = makeProviders();

		TestBed.configureTestingModule({
			imports: [SessionListComponent, translateModuleConfig],
			providers: [
				{ provide: GetSessionsUseCase, useValue: getSessionsSpy },
				{ provide: CreateSessionUseCase, useValue: createSessionSpy },
				{ provide: DuplicateSessionUseCase, useValue: duplicateSessionSpy },
				{ provide: DeleteSessionUseCase, useValue: deleteSessionSpy },
				{ provide: SetLanguageUseCase, useValue: setLanguageSpy },
				{ provide: LanguageService, useValue: languageServiceSpy },
				{ provide: MassUnitService, useValue: massUnitServiceSpy },
				{ provide: RequestReviewUseCase, useValue: requestReviewSpy },
				{ provide: ReviewService, useValue: reviewServiceSpy },
				{ provide: REVIEW_REPOSITORY, useValue: { hasRequested: async () => false, markAsRequested: async () => {} } },
				{ provide: Router, useValue: routerSpy },
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(SessionListComponent);
		fixture.detectChanges();
	});

	it("devrait afficher les boutons de sélection de langue FR et EN dans le header", () => {
		const el: HTMLElement = fixture.nativeElement;
		// Open the dropdown to reveal language options
		const langToggle = el.querySelector<HTMLElement>(".lang-select-wrapper");
		langToggle!.click();
		fixture.detectChanges();

		const items = Array.from(el.querySelectorAll(".dropdown-item")).map((b) => b.textContent?.trim());

		expect(items).toContain("FR");
		expect(items).toContain("EN");
	});

	it("devrait appeler le use case avec en quand on clique sur le bouton EN", () => {
		const el: HTMLElement = fixture.nativeElement;
		// Open the dropdown
		const langToggle = el.querySelector<HTMLElement>(".lang-select-wrapper");
		langToggle!.click();
		fixture.detectChanges();

		const enItem = Array.from(el.querySelectorAll<HTMLElement>(".dropdown-item")).find(
			(b) => b.textContent?.trim() === "EN"
		);
		enItem!.click();
		fixture.detectChanges();

		const setLanguageSpy = TestBed.inject(SetLanguageUseCase) as unknown as { execute: jasmine.Spy };
		expect(setLanguageSpy.execute).toHaveBeenCalledOnceWith("en");
	});

	it("devrait ajouter la classe active au bouton correspondant à la langue active", () => {
		const el: HTMLElement = fixture.nativeElement;
		// Open the dropdown
		const langToggle = el.querySelector<HTMLElement>(".lang-select-wrapper");
		langToggle!.click();
		fixture.detectChanges();

		const frItem = Array.from(el.querySelectorAll<HTMLElement>(".dropdown-item")).find(
			(b) => b.textContent?.trim() === "FR"
		);
		const enItem = Array.from(el.querySelectorAll<HTMLElement>(".dropdown-item")).find(
			(b) => b.textContent?.trim() === "EN"
		);

		// langue active est fr par défaut
		expect(frItem!.classList).toContain("selected");
		expect(enItem!.classList).not.toContain("selected");
	});
});

describe("SessionListComponent — sélecteur d'unité de masse", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<SessionListComponent>>;
	let massUnitServiceSpy: {
		activeMassUnit: ReturnType<typeof signal<"metric" | "imperial" | "us">>;
		setMassUnit: jasmine.Spy;
		detect: jasmine.Spy;
	};

	beforeEach(() => {
		const providers = makeProviders();
		massUnitServiceSpy = providers.massUnitServiceSpy;

		TestBed.configureTestingModule({
			imports: [SessionListComponent, translateModuleConfig],
			providers: [
				{ provide: GetSessionsUseCase, useValue: providers.getSessionsSpy },
				{ provide: CreateSessionUseCase, useValue: providers.createSessionSpy },
				{ provide: DuplicateSessionUseCase, useValue: providers.duplicateSessionSpy },
				{ provide: DeleteSessionUseCase, useValue: providers.deleteSessionSpy },
				{ provide: SetLanguageUseCase, useValue: providers.setLanguageSpy },
				{ provide: LanguageService, useValue: providers.languageServiceSpy },
				{ provide: MassUnitService, useValue: massUnitServiceSpy },
				{ provide: RequestReviewUseCase, useValue: providers.requestReviewSpy },
				{ provide: ReviewService, useValue: providers.reviewServiceSpy },
				{ provide: REVIEW_REPOSITORY, useValue: { hasRequested: async () => false, markAsRequested: async () => {} } },
				{ provide: Router, useValue: providers.routerSpy },
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(SessionListComponent);
		fixture.detectChanges();
	});

	it("devrait afficher le sélecteur d'unité de masse dans le header", () => {
		const el: HTMLElement = fixture.nativeElement;
		const massUnitSelector = el.querySelector("app-mass-unit-selector");

		expect(massUnitSelector).not.toBeNull();
	});

	it("devrait appeler setMassUnit avec imperial quand l'utilisateur sélectionne Britanique", () => {
		const el: HTMLElement = fixture.nativeElement;
		const toggle = el.querySelector<HTMLElement>(".mass-unit-select-wrapper");
		toggle!.click();
		fixture.detectChanges();

		const items = Array.from(el.querySelectorAll<HTMLElement>(".mass-unit-dropdown-item"));
		const imperialItem = items.find((i) => i.textContent?.trim() === "Britanique");
		imperialItem!.click();
		fixture.detectChanges();

		expect(massUnitServiceSpy.setMassUnit).toHaveBeenCalledOnceWith("imperial");
	});
});
