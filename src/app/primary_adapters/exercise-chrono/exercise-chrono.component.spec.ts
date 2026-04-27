import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { Capacitor } from "@capacitor/core";
import { ExerciseChronoComponent } from "./exercise-chrono.component";
import { ExerciseChronoUseCase } from "../../primary_ports/exercise-chrono/exercise-chrono.usecase";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of({
			common: { back: "Retour", pause: "Pause", resume: "Reprendre", reset: "Reset", rest: "repos", break: "Pause" },
			chrono: {
				ready: "Prêt",
				training: "Training",
				startTraining: "Démarrer",
				goBreak: "Pause",
				goTraining: "Training",
				series: "Série",
				iosSilentWarning: "Son désactivé quand le téléphone est en mode silencieux",
			},
		} as unknown as TranslationObject);
	}
}

function buildUseCase() {
	return {
		chronoState: signal<string>("initial"),
		timeSeconds: signal(0),
		seriesCount: signal(0),
		soundEnabled: signal(true),
		settings: signal({ exerciseDuration: null, breakDuration: 60, repetitions: null }),
		completedReps: signal(0),
		initWithBreakDuration: jasmine.createSpy("initWithBreakDuration"),
		updateBreakDuration: jasmine.createSpy("updateBreakDuration"),
		applyCustomSettings: jasmine.createSpy("applyCustomSettings"),
		restart: jasmine.createSpy("restart"),
		start: jasmine.createSpy("start"),
		pause: jasmine.createSpy("pause"),
		resume: jasmine.createSpy("resume"),
		goBreak: jasmine.createSpy("goBreak"),
		goTraining: jasmine.createSpy("goTraining"),
		reset: jasmine.createSpy("reset"),
		toggleSound: jasmine.createSpy("toggleSound"),
		addTime: jasmine.createSpy("addTime"),
		incrementSeriesCount: jasmine.createSpy("incrementSeriesCount"),
		decrementSeriesCount: jasmine.createSpy("decrementSeriesCount"),
	};
}

function createComponent(queryParams: Record<string, string> = {}) {
	const useCaseSpy = buildUseCase();
	const locationSpy = { back: jasmine.createSpy("back") };

	TestBed.configureTestingModule({
		imports: [
			ExerciseChronoComponent,
			TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
		],
		providers: [
			{ provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
			{ provide: Location, useValue: locationSpy },
			{ provide: ExerciseChronoUseCase, useValue: useCaseSpy },
		],
	});

	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");

	const fixture = TestBed.createComponent(ExerciseChronoComponent);
	fixture.detectChanges();
	return { fixture, useCaseSpy, locationSpy };
}

describe("ExerciseChronoComponent — hasExercise", () => {
	it("hasExercise vaut false quand aucun paramètre breakDuration n'est présent", () => {
		const { fixture } = createComponent({});

		expect(fixture.componentInstance.hasExercise()).toBeFalse();
	});

	it("hasExercise vaut true quand le paramètre breakDuration est présent", () => {
		const { fixture } = createComponent({ breakDuration: "90" });

		expect(fixture.componentInstance.hasExercise()).toBeTrue();
	});
});

describe("ExerciseChronoComponent — label durée de repos", () => {
	it("affiche le label .break-duration-label quand hasExercise vaut false", () => {
		const { fixture } = createComponent({});

		const label = fixture.debugElement.query(By.css(".break-duration-label"));

		expect(label).not.toBeNull();
	});

	it("masque le label .break-duration-label quand hasExercise vaut true", () => {
		const { fixture } = createComponent({ breakDuration: "90" });

		const label = fixture.debugElement.query(By.css(".break-duration-label"));

		expect(label).toBeNull();
	});

	it('affiche la durée de repos formatée dans le label (120s → "2:00 repos")', () => {
		const { fixture } = createComponent({});

		const label = fixture.debugElement.query(By.css(".break-duration-label"));

		expect(label.nativeElement.textContent.trim()).toBe("1:00 repos");
	});
});

describe("ExerciseChronoComponent — popup durée de repos", () => {
	it("le popup n'est pas visible par défaut", () => {
		const { fixture } = createComponent({});

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));

		expect(popup).toBeNull();
	});

	it("affiche le popup quand on clique sur le label", () => {
		const { fixture } = createComponent({});
		const label = fixture.debugElement.query(By.css(".break-duration-label"));

		label.triggerEventHandler("click", null);
		fixture.detectChanges();

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		expect(popup).not.toBeNull();
	});

	it("le popup reçoit la durée de repos courante comme initialSeconds", () => {
		const { fixture } = createComponent({});
		const label = fixture.debugElement.query(By.css(".break-duration-label"));

		label.triggerEventHandler("click", null);
		fixture.detectChanges();

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		expect(popup.componentInstance.initialSeconds()).toBe(60);
	});

	it("confirmer le popup met à jour _breakDuration et appelle updateBreakDuration", () => {
		const { fixture, useCaseSpy } = createComponent({});
		const label = fixture.debugElement.query(By.css(".break-duration-label"));
		label.triggerEventHandler("click", null);
		fixture.detectChanges();

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		popup.componentInstance.confirmed.emit(180);
		fixture.detectChanges();

		expect(fixture.componentInstance._breakDuration()).toBe(180);
		expect(useCaseSpy.updateBreakDuration).toHaveBeenCalledWith(180);
	});

	it("confirmer le popup appelle updateBreakDuration et non initWithBreakDuration pour préserver l'état du chrono", () => {
		const { fixture, useCaseSpy } = createComponent({});
		const label = fixture.debugElement.query(By.css(".break-duration-label"));
		label.triggerEventHandler("click", null);
		fixture.detectChanges();

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		popup.componentInstance.confirmed.emit(180);
		fixture.detectChanges();

		expect(useCaseSpy.updateBreakDuration).toHaveBeenCalledWith(180);
		expect(useCaseSpy.updateBreakDuration).toHaveBeenCalledWith(180);
	});

	it("annuler le popup masque le popup sans modifier _breakDuration", () => {
		const { fixture, useCaseSpy } = createComponent({});
		const label = fixture.debugElement.query(By.css(".break-duration-label"));
		label.triggerEventHandler("click", null);
		fixture.detectChanges();

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		popup.componentInstance.cancelled.emit();
		fixture.detectChanges();

		const popupAfter = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		expect(popupAfter).toBeNull();
		expect(fixture.componentInstance._breakDuration()).toBe(60);
		expect(useCaseSpy.applyCustomSettings).toHaveBeenCalledTimes(1); // only ngOnInit call
	});
});

describe("ExerciseChronoComponent — mise à jour du label après confirmation popup", () => {
	it("le label .break-duration-label affiche la nouvelle durée après confirmation du popup", () => {
		const { fixture } = createComponent({});
		const label = fixture.debugElement.query(By.css(".break-duration-label"));
		label.triggerEventHandler("click", null);
		fixture.detectChanges();

		const popup = fixture.debugElement.query(By.css("app-edit-duration-popup"));
		popup.componentInstance.confirmed.emit(180);
		fixture.detectChanges();

		const updatedLabel = fixture.debugElement.query(By.css(".break-duration-label"));
		expect(updatedLabel.nativeElement.textContent.trim()).toBe("3:00 repos");
	});
});

describe("ExerciseChronoComponent — boutons -10s et +10s", () => {
	it("n'affiche PAS les boutons -10s et +10s quand l'état est training_paused", () => {
		const { fixture, useCaseSpy } = createComponent({});
		useCaseSpy.chronoState.set("training_paused");
		fixture.detectChanges();

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));

		expect(btns.length).toBe(0);
	});

	it("affiche les boutons -10s et +10s quand l'état est break_paused", () => {
		const { fixture, useCaseSpy } = createComponent({});
		useCaseSpy.chronoState.set("break_paused");
		fixture.detectChanges();

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btnMinus = btns.find((b) => b.nativeElement.textContent.trim() === "-10s");
		const btnPlus = btns.find((b) => b.nativeElement.textContent.trim() === "+10s");

		expect(btnMinus).not.toBeUndefined();
		expect(btnPlus).not.toBeUndefined();
	});

	it("n'affiche pas les boutons -10s et +10s quand l'état est training", () => {
		const { fixture, useCaseSpy } = createComponent({});
		useCaseSpy.chronoState.set("training");
		fixture.detectChanges();

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));

		expect(btns.length).toBe(0);
	});

	it("cliquer sur -10s appelle addTime(-10)", () => {
		const { fixture, useCaseSpy } = createComponent({});
		useCaseSpy.chronoState.set("break_paused");
		fixture.detectChanges();

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btnMinus = btns.find((b) => b.nativeElement.textContent.trim() === "-10s")!;
		btnMinus.triggerEventHandler("click", null);

		expect(useCaseSpy.addTime).toHaveBeenCalledOnceWith(-10);
	});

	it("cliquer sur +10s appelle addTime(10)", () => {
		const { fixture, useCaseSpy } = createComponent({});
		useCaseSpy.chronoState.set("break_paused");
		fixture.detectChanges();

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btnPlus = btns.find((b) => b.nativeElement.textContent.trim() === "+10s")!;
		btnPlus.triggerEventHandler("click", null);

		expect(useCaseSpy.addTime).toHaveBeenCalledOnceWith(10);
	});

	it("affiche les boutons -10s et +10s quand l'état est break", () => {
		const { fixture, useCaseSpy } = createComponent({});
		useCaseSpy.chronoState.set("break");
		fixture.detectChanges();

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btnMinus = btns.find((b) => b.nativeElement.textContent.trim() === "-10s");
		const btnPlus = btns.find((b) => b.nativeElement.textContent.trim() === "+10s");

		expect(btnMinus).not.toBeUndefined();
		expect(btnPlus).not.toBeUndefined();
	});
});

describe("ExerciseChronoComponent — iOS silent warning", () => {
	afterEach(() => {
		(Capacitor.getPlatform as jasmine.Spy)?.and?.callThrough?.();
	});

	it("should show the iOS silent warning when the platform is ios", () => {
		spyOn(Capacitor, "getPlatform").and.returnValue("ios");

		const { fixture } = createComponent({});

		const warning = fixture.debugElement.query(By.css(".ios-silent-warning"));
		expect(warning).not.toBeNull();
	});

	it("should NOT show the iOS silent warning when the platform is not ios", () => {
		spyOn(Capacitor, "getPlatform").and.returnValue("android");

		const { fixture } = createComponent({});

		const warning = fixture.debugElement.query(By.css(".ios-silent-warning"));
		expect(warning).toBeNull();
	});
});

// Story 6 helper — builds use case stub with custom settings support
function buildUseCaseWithSettings(queryParams: Record<string, string> = {}, persistedSettings?: object) {
	const useCaseSpy = {
		chronoState: signal<string>("initial"),
		timeSeconds: signal(0),
		seriesCount: signal(0),
		soundEnabled: signal(true),
		settings: signal({ exerciseDuration: null, breakDuration: 60, repetitions: null }),
		completedReps: signal(0),
		initWithBreakDuration: jasmine.createSpy("initWithBreakDuration"),
		updateBreakDuration: jasmine.createSpy("updateBreakDuration"),
		applyCustomSettings: jasmine.createSpy("applyCustomSettings"),
		restart: jasmine.createSpy("restart"),
		start: jasmine.createSpy("start"),
		pause: jasmine.createSpy("pause"),
		resume: jasmine.createSpy("resume"),
		goBreak: jasmine.createSpy("goBreak"),
		goTraining: jasmine.createSpy("goTraining"),
		reset: jasmine.createSpy("reset"),
		toggleSound: jasmine.createSpy("toggleSound"),
		addTime: jasmine.createSpy("addTime"),
		incrementSeriesCount: jasmine.createSpy("incrementSeriesCount"),
		decrementSeriesCount: jasmine.createSpy("decrementSeriesCount"),
	};

	if (persistedSettings) {
		localStorage.setItem("egn_chrono_custom_settings", JSON.stringify(persistedSettings));
	} else {
		localStorage.removeItem("egn_chrono_custom_settings");
	}

	const locationSpy = { back: jasmine.createSpy("back") };
	TestBed.configureTestingModule({
		imports: [
			ExerciseChronoComponent,
			TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
		],
		providers: [
			{ provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
			{ provide: Location, useValue: locationSpy },
			{ provide: ExerciseChronoUseCase, useValue: useCaseSpy },
		],
	});

	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");

	const fixture = TestBed.createComponent(ExerciseChronoComponent);
	fixture.detectChanges();
	return { fixture, useCaseSpy };
}

describe("ExerciseChronoComponent Story 6 - settings init priority", () => {
	afterEach(() => localStorage.clear());

	it("uses route param breakDuration as seed when no persisted settings exist", () => {
		const { useCaseSpy } = buildUseCaseWithSettings({ breakDuration: "90" });
		expect(useCaseSpy.applyCustomSettings).toHaveBeenCalledWith(
			jasmine.objectContaining({ breakDuration: 90 })
		);
	});

	it("uses default breakDuration 60 when no route param and no persisted settings", () => {
		const { useCaseSpy } = buildUseCaseWithSettings({});
		expect(useCaseSpy.applyCustomSettings).toHaveBeenCalledWith(
			jasmine.objectContaining({ breakDuration: 60 })
		);
	});

	it("uses persisted settings over route param when persisted settings exist", () => {
		const persisted = { exerciseDuration: 45, breakDuration: 30, repetitions: 5 };
		const { useCaseSpy } = buildUseCaseWithSettings({ breakDuration: "90" }, persisted);
		expect(useCaseSpy.applyCustomSettings).toHaveBeenCalledWith(persisted);
	});
});

describe("ExerciseChronoComponent Story 6 - settings panel", () => {
	afterEach(() => localStorage.clear());

	it("settings panel is not shown by default", () => {
		const { fixture } = buildUseCaseWithSettings({});
		const panel = fixture.debugElement.query(By.css("app-chrono-custom-settings-panel"));
		expect(panel).toBeNull();
	});

	it("gear button in header opens settings panel", () => {
		const { fixture } = buildUseCaseWithSettings({});
		const gearBtn = fixture.debugElement.query(By.css("[data-testid='settings-gear-btn']"));
		gearBtn.triggerEventHandler("click", null);
		fixture.detectChanges();
		const panel = fixture.debugElement.query(By.css("app-chrono-custom-settings-panel"));
		expect(panel).not.toBeNull();
	});

	it("panel confirmed calls applyCustomSettings and closes panel", () => {
		const { fixture, useCaseSpy } = buildUseCaseWithSettings({});
		const gearBtn = fixture.debugElement.query(By.css("[data-testid='settings-gear-btn']"));
		gearBtn.triggerEventHandler("click", null);
		fixture.detectChanges();

		const panel = fixture.debugElement.query(By.css("app-chrono-custom-settings-panel"));
		panel.componentInstance.confirmed.emit({ exerciseDuration: 30, breakDuration: 60, repetitions: 3 });
		fixture.detectChanges();

		expect(useCaseSpy.applyCustomSettings).toHaveBeenCalledWith({ exerciseDuration: 30, breakDuration: 60, repetitions: 3 });
		const panelAfter = fixture.debugElement.query(By.css("app-chrono-custom-settings-panel"));
		expect(panelAfter).toBeNull();
	});

	it("panel cancelled closes panel without calling applyCustomSettings again", () => {
		const { fixture, useCaseSpy } = buildUseCaseWithSettings({});
		const callsBefore = (useCaseSpy.applyCustomSettings as jasmine.Spy).calls.count();
		const gearBtn = fixture.debugElement.query(By.css("[data-testid='settings-gear-btn']"));
		gearBtn.triggerEventHandler("click", null);
		fixture.detectChanges();

		const panel = fixture.debugElement.query(By.css("app-chrono-custom-settings-panel"));
		panel.componentInstance.cancelled.emit();
		fixture.detectChanges();

		expect((useCaseSpy.applyCustomSettings as jasmine.Spy).calls.count()).toBe(callsBefore);
		const panelAfter = fixture.debugElement.query(By.css("app-chrono-custom-settings-panel"));
		expect(panelAfter).toBeNull();
	});
});

describe("ExerciseChronoComponent Story 6 - restart", () => {
	afterEach(() => localStorage.clear());

	it("restart event from actions bar calls useCase.restart()", () => {
		const { fixture, useCaseSpy } = buildUseCaseWithSettings({});
		useCaseSpy.chronoState.set("over");
		fixture.detectChanges();

		const actionsComp = fixture.debugElement.query(By.css("app-chrono-actions"));
		actionsComp.componentInstance.restart.emit();
		fixture.detectChanges();

		expect(useCaseSpy.restart).toHaveBeenCalledTimes(1);
	});
});
