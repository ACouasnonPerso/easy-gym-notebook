import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import {
	SessionTypeSuggestionsComponent,
	VISIBLE_TEMPLATES_LIMIT,
	VISIBLE_TYPES_LIMIT,
} from "./session-type-suggestions.component";
import { GetSessionTypesUseCase } from "../../primary_ports/session-detail/get-session-types.usecase";
import { ApplySessionTemplateUseCase } from "../../primary_ports/session-detail/apply-session-template.usecase";
import { SessionTemplate, SessionType } from "../../core_logic/session-template/session-template.service";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { LanguageService } from "../../core_logic/language/language.service";

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(): Observable<TranslationObject> {
		return of({ sessionTemplates: { showMore: "Voir plus ({{count}})" } } as unknown as TranslationObject);
	}
}

function makeTemplate(index: number): SessionTemplate {
	return {
		sourceSessionId: `s${index}`,
		lastDate: new Date(2026, 0, index + 1),
		occurrences: 1,
		exercises: [{ name: `Exercise ${index}`, sets: 3, isCardio: false }],
	};
}

function makeType(index: number, templateCount = 1): SessionType {
	return {
		key: `type${index}`,
		muscleGroups: [],
		isCardio: false,
		occurrences: 100 - index,
		lastDate: new Date(2026, 0, 1),
		templates: Array.from({ length: templateCount }, (_, i) => makeTemplate(index * 100 + i)),
	};
}

describe("SessionTypeSuggestionsComponent", () => {
	async function render(types: SessionType[]) {
		TestBed.configureTestingModule({
			imports: [
				SessionTypeSuggestionsComponent,
				TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: FakeTranslateLoader } }),
			],
			providers: [
				{ provide: GetSessionTypesUseCase, useValue: { execute: async () => types } },
				{ provide: ApplySessionTemplateUseCase, useValue: { execute: async () => {} } },
				{ provide: HapticService, useValue: { vibrate: () => {} } },
				// Locale registered by default in tests (dates of the past sessions).
				{ provide: LanguageService, useValue: { activeLang: signal("en-US") } },
			],
		});
		TestBed.inject(TranslateService).use("fr");
		const fixture = TestBed.createComponent(SessionTypeSuggestionsComponent);
		fixture.componentRef.setInput("sessionId", "current");
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
		return fixture;
	}

	const typeChips = (fixture: ComponentFixture<SessionTypeSuggestionsComponent>) =>
		fixture.debugElement.queryAll(By.css(".type-list .type-chip"));
	const templateCards = (fixture: ComponentFixture<SessionTypeSuggestionsComponent>) =>
		fixture.debugElement.queryAll(By.css(".template-card"));

	it("shows the first types only, with a show more button for the others", async () => {
		const fixture = await render(Array.from({ length: VISIBLE_TYPES_LIMIT + 4 }, (_, i) => makeType(i)));

		expect(typeChips(fixture).length).toBe(VISIBLE_TYPES_LIMIT);
		const button = fixture.debugElement.query(By.css("[data-testid=show-more-types]"));
		expect(button.nativeElement.textContent.trim()).toBe("Voir plus (4)");

		button.nativeElement.click();
		fixture.detectChanges();

		expect(typeChips(fixture).length).toBe(VISIBLE_TYPES_LIMIT + 4);
		expect(fixture.debugElement.query(By.css("[data-testid=show-more-types]"))).toBeNull();
	});

	it("has no show more button when every type fits", async () => {
		const fixture = await render([makeType(0), makeType(1)]);

		expect(typeChips(fixture).length).toBe(2);
		expect(fixture.debugElement.query(By.css("[data-testid=show-more-types]"))).toBeNull();
	});

	it("shows the first sessions of a type, with a show more button for the others", async () => {
		const fixture = await render([makeType(0, VISIBLE_TEMPLATES_LIMIT + 2)]);

		typeChips(fixture)[0].nativeElement.click();
		fixture.detectChanges();

		expect(templateCards(fixture).length).toBe(VISIBLE_TEMPLATES_LIMIT);
		const button = fixture.debugElement.query(By.css("[data-testid=show-more-templates]"));
		expect(button.nativeElement.textContent.trim()).toBe("Voir plus (2)");

		button.nativeElement.click();
		fixture.detectChanges();

		expect(templateCards(fixture).length).toBe(VISIBLE_TEMPLATES_LIMIT + 2);
	});

	it("collapses the sessions again when another type is opened", async () => {
		const fixture = await render([makeType(0, 5), makeType(1, 5)]);

		typeChips(fixture)[0].nativeElement.click();
		fixture.detectChanges();
		fixture.debugElement.query(By.css("[data-testid=show-more-templates]")).nativeElement.click();
		fixture.detectChanges();
		fixture.debugElement.query(By.css(".back-btn")).nativeElement.click();
		fixture.detectChanges();
		typeChips(fixture)[1].nativeElement.click();
		fixture.detectChanges();

		expect(templateCards(fixture).length).toBe(VISIBLE_TEMPLATES_LIMIT);
	});
});
