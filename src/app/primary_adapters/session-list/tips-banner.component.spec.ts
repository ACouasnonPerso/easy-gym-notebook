import { TestBed, ComponentFixture } from "@angular/core/testing";
import { signal, Signal } from "@angular/core";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { TipsBannerComponent } from "./tips-banner.component";
import { RequestReviewUseCase } from "../../primary_ports/session-list/request-review.usecase";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of({
			sessionList: {
				tip: "Conseil",
				reviewTip: "Notez cette application",
				reviewThanks: "Merci pour votre avis !",
				reviewConfirmTitle: "Vous aimez cette app ?",
				reviewConfirmYes: "Oui, noter",
				reviewConfirmNo: "Non merci",
			},
		} as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function makeUseCaseSpy(hasRequestedValue = false) {
	const hasRequestedSignal = signal(hasRequestedValue);
	return {
		hasRequested: hasRequestedSignal as Signal<boolean>,
		execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve(true)),
	};
}

function setupFixture(
	sessionCount: number,
	hasRequested = false
): {
	fixture: ComponentFixture<TipsBannerComponent>;
	useCaseSpy: ReturnType<typeof makeUseCaseSpy>;
} {
	const useCaseSpy = makeUseCaseSpy(hasRequested);

	TestBed.configureTestingModule({
		imports: [TipsBannerComponent, translateModuleConfig],
		providers: [{ provide: RequestReviewUseCase, useValue: useCaseSpy }],
	});

	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");

	const fixture = TestBed.createComponent(TipsBannerComponent);
	fixture.componentRef.setInput("sessionCount", sessionCount);
	fixture.detectChanges();

	return { fixture, useCaseSpy };
}

describe("TipsBannerComponent", () => {
	describe("bandeau onboarding", () => {
		it("affiche le conseil onboarding quand sessionCount est entre 1 et 3", () => {
			spyOn(Math, "random").and.returnValue(0);
			const { fixture } = setupFixture(2);
			const el: HTMLElement = fixture.nativeElement;
			const banner = el.querySelector(".tips-banner");
			expect(banner).toBeTruthy();
			const text = banner?.querySelector(".tips-text")?.textContent;
			expect(text).toContain("Long press a session to duplicate it");
		});

		it("affiche le contenu de onboardingTip dans le bandeau et non la clé de traduction fixe", () => {
			spyOn(Math, "random").and.returnValue(0);
			const { fixture } = setupFixture(2);
			const el: HTMLElement = fixture.nativeElement;
			const text = el.querySelector(".tips-banner .tips-text")?.textContent;
			expect(text).toContain("Long press a session to duplicate it");
		});
	});

	describe("bandeau review", () => {
		it("affiche le tips de review quand sessionCount >= 4 et que la review na pas encore été demandée", () => {
			const { fixture } = setupFixture(10, false);
			const el: HTMLElement = fixture.nativeElement;
			const banner = el.querySelector(".tips-banner");
			expect(banner).toBeTruthy();
			const text = banner?.querySelector(".tips-text")?.textContent;
			expect(text).toContain("Notez cette application");
		});

		it("affiche le tips de review quand sessionCount est exactement 4", () => {
			const { fixture } = setupFixture(4, false);
			const el: HTMLElement = fixture.nativeElement;
			const banner = el.querySelector(".tips-banner");
			expect(banner).toBeTruthy();
			const text = banner?.querySelector(".tips-text")?.textContent;
			expect(text).toContain("Notez cette application");
		});
	});

	describe("bandeau de remerciement après confirmation", () => {
		it("affiche le remerciement et appelle execute() après clic banner puis confirmation", async () => {
			const { fixture, useCaseSpy } = setupFixture(10, false);
			const el: HTMLElement = fixture.nativeElement;

			el.querySelector<HTMLButtonElement>(".tips-banner--clickable")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			el.querySelector<HTMLButtonElement>(".review-confirm-yes")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			expect(useCaseSpy.execute).toHaveBeenCalledTimes(1);
			expect(el.querySelector(".tips-banner")).toBeTruthy();
			const text = el.querySelector(".tips-text")?.textContent;
			expect(text).toContain("Merci pour votre avis");
		});

		it("n'affiche ni remerciement ni bandeau review quand execute() retourne false (erreur plugin)", async () => {
			const hasRequestedSignal = signal(false);
			const useCaseSpy = {
				hasRequested: hasRequestedSignal as Signal<boolean>,
				execute: jasmine.createSpy("execute").and.callFake(async () => {
					hasRequestedSignal.set(true);
					return false;
				}),
			};

			TestBed.configureTestingModule({
				imports: [TipsBannerComponent, translateModuleConfig],
				providers: [{ provide: RequestReviewUseCase, useValue: useCaseSpy }],
			});
			const translate = TestBed.inject(TranslateService);
			translate.setDefaultLang("fr");
			translate.use("fr");
			const fixture = TestBed.createComponent(TipsBannerComponent);
			fixture.componentRef.setInput("sessionCount", 10);
			fixture.detectChanges();

			const el: HTMLElement = fixture.nativeElement;
			el.querySelector<HTMLButtonElement>(".tips-banner--clickable")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			el.querySelector<HTMLButtonElement>(".review-confirm-yes")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			expect(useCaseSpy.execute).toHaveBeenCalledTimes(1);
			expect(el.querySelector(".tips-banner")).toBeNull();
		});
	});

	describe("popup de confirmation au clic sur le banner review", () => {
		it("affiche la popup de confirmation quand on clique sur le banner review (sans appeler execute)", async () => {
			const { fixture, useCaseSpy } = setupFixture(10, false);
			const el: HTMLElement = fixture.nativeElement;

			const button = el.querySelector<HTMLButtonElement>(".tips-banner--clickable");
			expect(button).toBeTruthy();
			button!.click();

			await fixture.whenStable();
			fixture.detectChanges();

			expect(useCaseSpy.execute).not.toHaveBeenCalled();
			const confirmPopup = el.querySelector(".review-confirm-popup");
			expect(confirmPopup).toBeTruthy();
			expect(confirmPopup?.textContent).toContain("Vous aimez cette app ?");
		});

		it("confirmer dans la popup appelle execute() et affiche les remerciements", async () => {
			const { fixture, useCaseSpy } = setupFixture(10, false);
			const el: HTMLElement = fixture.nativeElement;

			el.querySelector<HTMLButtonElement>(".tips-banner--clickable")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			const confirmBtn = el.querySelector<HTMLButtonElement>(".review-confirm-yes");
			expect(confirmBtn).toBeTruthy();
			confirmBtn!.click();

			await fixture.whenStable();
			fixture.detectChanges();

			expect(useCaseSpy.execute).toHaveBeenCalledTimes(1);
			expect(el.querySelector(".review-confirm-popup")).toBeNull();
			const text = el.querySelector(".tips-text")?.textContent;
			expect(text).toContain("Merci pour votre avis");
		});

		it("refuser dans la popup ne appelle pas execute() et fait disparaitre la bannière review", async () => {
			const { fixture, useCaseSpy } = setupFixture(10, false);
			const el: HTMLElement = fixture.nativeElement;

			el.querySelector<HTMLButtonElement>(".tips-banner--clickable")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			const refuseBtn = el.querySelector<HTMLButtonElement>(".review-confirm-no");
			expect(refuseBtn).toBeTruthy();
			refuseBtn!.click();

			await fixture.whenStable();
			fixture.detectChanges();

			expect(useCaseSpy.execute).not.toHaveBeenCalled();
			expect(el.querySelector(".review-confirm-popup")).toBeNull();
			expect(el.querySelector(".tips-banner--clickable")).toBeNull();
		});

		it("après refus, la bannière review ne réapparait pas dans la même session (pas de persistance)", async () => {
			const { fixture, useCaseSpy } = setupFixture(10, false);
			const el: HTMLElement = fixture.nativeElement;

			el.querySelector<HTMLButtonElement>(".tips-banner--clickable")!.click();
			await fixture.whenStable();
			fixture.detectChanges();
			el.querySelector<HTMLButtonElement>(".review-confirm-no")!.click();
			await fixture.whenStable();
			fixture.detectChanges();

			// Le banner review est masqué mais useCaseSpy.hasRequested reste false (non persisté)
			expect(useCaseSpy.execute).not.toHaveBeenCalled();
			expect(useCaseSpy.hasRequested()).toBe(false);
			expect(el.querySelector(".tips-banner--clickable")).toBeNull();
			expect(el.querySelector(".tips-banner")).toBeNull();
		});
	});

	describe("onboardingTip", () => {
		it("retourne le premier conseil quand Math.random() retourne 0", () => {
			spyOn(Math, "random").and.returnValue(0);
			const { fixture } = setupFixture(2);
			expect(fixture.componentInstance.onboardingTip).toBe("Long press a session to duplicate it");
		});

		it("retourne le dernier conseil quand Math.random() retourne 0.99", () => {
			spyOn(Math, "random").and.returnValue(0.99);
			const { fixture } = setupFixture(2);
			expect(fixture.componentInstance.onboardingTip).toBe("Try to select the current year in stats to see your yearly heatmap 😉");
		});
	});

	describe("masquage de la bannière", () => {
		it("masque la bannière quand sessionCount est 0", () => {
			const { fixture } = setupFixture(0);
			const el: HTMLElement = fixture.nativeElement;
			expect(el.querySelector(".tips-banner")).toBeNull();
		});

		it("masque la bannière au démarrage quand sessionCount >= 4 ET la review a déjà été demandée", () => {
			const { fixture } = setupFixture(10, true);
			const el: HTMLElement = fixture.nativeElement;
			expect(el.querySelector(".tips-banner")).toBeNull();
		});
	});
});
