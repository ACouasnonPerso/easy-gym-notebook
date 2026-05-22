import { TestBed, ComponentFixture, fakeAsync, tick } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { AggregationToggleComponent } from "./aggregation-toggle.component";
import { AggregationMode } from "../../core_logic/stats-exercise/group-by.model";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const TRANSLATIONS = {
	statsExercise: {
		aggregation: {
			average: "Average",
			sum: "Sum",
			sameToast: "Average = Sum for this period",
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
	imports: [AggregationToggleComponent],
	template: `<app-aggregation-toggle [value]="value()" [averageEqualsSum]="averageEqualsSum()" (aggregationChange)="lastAggregation = $event" />`,
})
class HostComponent {
	value = signal<AggregationMode>("average");
	averageEqualsSum = signal<boolean>(false);
	lastAggregation: AggregationMode | undefined = undefined;
}

function setup(value: AggregationMode = "average", averageEqualsSum = false): ComponentFixture<HostComponent> {
	TestBed.configureTestingModule({
		imports: [HostComponent, translateModuleConfig],
	});
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("en");
	translate.use("en");
	const fixture = TestBed.createComponent(HostComponent);
	fixture.componentInstance.value.set(value);
	fixture.componentInstance.averageEqualsSum.set(averageEqualsSum);
	fixture.detectChanges();
	return fixture;
}

describe("AggregationToggleComponent — initial render", () => {
	it("should render exactly one button", () => {
		const fixture = setup();
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelectorAll("button.aggregation-btn").length).toBe(1);
	});

	it("should render 'Average' label when value is average", () => {
		const fixture = setup("average");
		const el: HTMLElement = fixture.nativeElement;
		const btn = el.querySelector("button.aggregation-btn");
		expect(btn?.textContent?.trim()).toBe("Average");
	});

	it("should render 'Sum' label when value is sum", () => {
		const fixture = setup("sum");
		const el: HTMLElement = fixture.nativeElement;
		const btn = el.querySelector("button.aggregation-btn");
		expect(btn?.textContent?.trim()).toBe("Sum");
	});
});

describe("AggregationToggleComponent — label update on input change", () => {
	it("should update label from Average to Sum when value input changes", () => {
		const fixture = setup("average");
		const el: HTMLElement = fixture.nativeElement;
		const btn = el.querySelector("button.aggregation-btn")!;
		expect(btn.textContent?.trim()).toBe("Average");

		fixture.componentInstance.value.set("sum");
		fixture.detectChanges();

		expect(btn.textContent?.trim()).toBe("Sum");
	});

	it("should update label from Sum to Average when value input changes", () => {
		const fixture = setup("sum");
		const el: HTMLElement = fixture.nativeElement;
		const btn = el.querySelector("button.aggregation-btn")!;
		expect(btn.textContent?.trim()).toBe("Sum");

		fixture.componentInstance.value.set("average");
		fixture.detectChanges();

		expect(btn.textContent?.trim()).toBe("Average");
	});
});

describe("AggregationToggleComponent — toast on averageEqualsSum", () => {
	it("should not show toast initially even when averageEqualsSum is true", () => {
		const fixture = setup("average", true);
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector(".aggregation-toast")).toBeNull();
	});

	it("should show toast when averageEqualsSum is true and button is clicked", fakeAsync(() => {
		const fixture = setup("average", true);
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector("button.aggregation-btn") as HTMLElement).click();
		fixture.detectChanges();
		expect(el.querySelector(".aggregation-toast")).not.toBeNull();
		tick(2500);
		fixture.detectChanges();
	}));

	it("should hide toast after 2500ms", fakeAsync(() => {
		const fixture = setup("average", true);
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector("button.aggregation-btn") as HTMLElement).click();
		fixture.detectChanges();
		tick(2500);
		fixture.detectChanges();
		expect(el.querySelector(".aggregation-toast")).toBeNull();
	}));
});

describe("AggregationToggleComponent — aggregationChange output", () => {
	it("should emit 'sum' when button is clicked while value is average", () => {
		const fixture = setup("average");
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector("button.aggregation-btn") as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastAggregation).toBe("sum");
	});

	it("should emit 'average' when button is clicked while value is sum", () => {
		const fixture = setup("sum");
		const el: HTMLElement = fixture.nativeElement;
		(el.querySelector("button.aggregation-btn") as HTMLElement).click();
		fixture.detectChanges();
		expect(fixture.componentInstance.lastAggregation).toBe("average");
	});

	it("should not have emitted anything before any click", () => {
		const fixture = setup("average");
		expect(fixture.componentInstance.lastAggregation).toBeUndefined();
	});
});
