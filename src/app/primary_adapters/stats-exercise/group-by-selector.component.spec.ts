import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { GroupBySelectorComponent } from "./group-by-selector.component";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const TRANSLATIONS = {
	statsExercise: {
		groupBy: {
			session: "Session",
			week: "Week",
			month: "Month",
			year: "Year",
		},
	},
};

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of(TRANSLATIONS as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

@Component({
	standalone: true,
	imports: [GroupBySelectorComponent],
	template: `<app-group-by-selector [selected]="selected()" (groupByChange)="lastGroupBy = $event" />`,
})
class HostComponent {
	selected = signal<GroupBy>("session");
	lastGroupBy: GroupBy | undefined = undefined;
}

function setup(selected: GroupBy = "session"): ComponentFixture<HostComponent> {
	TestBed.configureTestingModule({
		imports: [HostComponent, translateModuleConfig],
	});
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("en");
	translate.use("en");
	const fixture = TestBed.createComponent(HostComponent);
	fixture.componentInstance.selected.set(selected);
	fixture.detectChanges();
	return fixture;
}

describe("GroupBySelectorComponent — initial render", () => {
	it("should render the trigger wrapper element", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector(".select-wrapper")).not.toBeNull();
	});

	it("should display the translated Session label in the trigger when selected is 'session'", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		const wrapper = el.querySelector(".select-wrapper");
		expect(wrapper?.textContent).toContain("Session");
	});

	it("should not render any dropdown items before the trigger is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelectorAll(".dropdown-item").length).toBe(0);
	});
});

describe("GroupBySelectorComponent — trigger label reflects selected input", () => {
	it("should display the Week label when selected is 'week'", () => {
		const fixture = setup("week");
		const el: HTMLElement = fixture.nativeElement;
		const wrapper = el.querySelector(".select-wrapper");
		expect(wrapper?.textContent).toContain("Week");
	});

	it("should display the Month label when selected is 'month'", () => {
		const fixture = setup("month");
		const el: HTMLElement = fixture.nativeElement;
		const wrapper = el.querySelector(".select-wrapper");
		expect(wrapper?.textContent).toContain("Month");
	});

	it("should display the Year label when selected is 'year'", () => {
		const fixture = setup("year");
		const el: HTMLElement = fixture.nativeElement;
		const wrapper = el.querySelector(".select-wrapper");
		expect(wrapper?.textContent).toContain("Year");
	});

	it("should update the trigger label when the selected input changes from 'session' to 'month'", () => {
		const fixture = setup("session");
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector(".select-wrapper")?.textContent).toContain("Session");

		fixture.componentInstance.selected.set("month");
		fixture.detectChanges();

		expect(el.querySelector(".select-wrapper")?.textContent).toContain("Month");
	});
});

describe("GroupBySelectorComponent — dropdown visibility", () => {
	it("should open the dropdown and render four option items when the trigger is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		expect(el.querySelectorAll(".dropdown-item").length).toBe(4);
	});

	it("should render options in order: Session, Week, Month, Year", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		const items = Array.from(el.querySelectorAll(".dropdown-item"));
		expect(items[0].textContent?.trim()).toBe("Session");
		expect(items[1].textContent?.trim()).toBe("Week");
		expect(items[2].textContent?.trim()).toBe("Month");
		expect(items[3].textContent?.trim()).toBe("Year");
	});

	it("should close the dropdown (remove items) after an option is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		expect(el.querySelectorAll(".dropdown-item").length).toBe(4);

		(el.querySelectorAll(".dropdown-item")[0] as HTMLElement).click();
		fixture.detectChanges();
		expect(el.querySelectorAll(".dropdown-item").length).toBe(0);
	});

	it("should close the dropdown when the backdrop overlay is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		expect(el.querySelector(".dropdown-backdrop")).not.toBeNull();

		(el.querySelector(".dropdown-backdrop") as HTMLElement).click();
		fixture.detectChanges();
		expect(el.querySelector(".dropdown-backdrop")).toBeNull();
		expect(el.querySelectorAll(".dropdown-item").length).toBe(0);
	});
});

describe("GroupBySelectorComponent — active option marking", () => {
	it("should mark the Session item as selected when selected is 'session'", () => {
		const fixture = setup("session");
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		const items = Array.from(el.querySelectorAll(".dropdown-item"));
		expect(items[0].classList.contains("selected")).toBeTrue();
		expect(items[1].classList.contains("selected")).toBeFalse();
		expect(items[2].classList.contains("selected")).toBeFalse();
		expect(items[3].classList.contains("selected")).toBeFalse();
	});

	it("should mark the Week item as selected when selected is 'week'", () => {
		const fixture = setup("week");
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		const items = Array.from(el.querySelectorAll(".dropdown-item"));
		expect(items[0].classList.contains("selected")).toBeFalse();
		expect(items[1].classList.contains("selected")).toBeTrue();
		expect(items[2].classList.contains("selected")).toBeFalse();
		expect(items[3].classList.contains("selected")).toBeFalse();
	});

	it("should mark the Month item as selected when selected is 'month'", () => {
		const fixture = setup("month");
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		const items = Array.from(el.querySelectorAll(".dropdown-item"));
		expect(items[0].classList.contains("selected")).toBeFalse();
		expect(items[1].classList.contains("selected")).toBeFalse();
		expect(items[2].classList.contains("selected")).toBeTrue();
		expect(items[3].classList.contains("selected")).toBeFalse();
	});

	it("should mark the Year item as selected when selected is 'year'", () => {
		const fixture = setup("year");
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		const items = Array.from(el.querySelectorAll(".dropdown-item"));
		expect(items[0].classList.contains("selected")).toBeFalse();
		expect(items[1].classList.contains("selected")).toBeFalse();
		expect(items[2].classList.contains("selected")).toBeFalse();
		expect(items[3].classList.contains("selected")).toBeTrue();
	});
});

describe("GroupBySelectorComponent — groupByChange output", () => {
	it("should emit 'session' when the Session option is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		(el.querySelectorAll(".dropdown-item")[0] as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastGroupBy).toBe("session");
	});

	it("should emit 'week' when the Week option is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		(el.querySelectorAll(".dropdown-item")[1] as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastGroupBy).toBe("week");
	});

	it("should emit 'month' when the Month option is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		(el.querySelectorAll(".dropdown-item")[2] as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastGroupBy).toBe("month");
	});

	it("should emit 'year' when the Year option is clicked", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		(el.querySelectorAll(".dropdown-item")[3] as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastGroupBy).toBe("year");
	});

	it("should not emit groupByChange when the trigger is clicked (only opens dropdown)", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector(".select-wrapper") as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastGroupBy).toBeUndefined();
	});
});
