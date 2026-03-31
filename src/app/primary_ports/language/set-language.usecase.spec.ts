import { TestBed } from "@angular/core/testing";
import { SetLanguageUseCase } from "./set-language.usecase";
import { LanguageService } from "../../core_logic/language/language.service";

describe("SetLanguageUseCase", () => {
	let useCase: SetLanguageUseCase;
	let languageServiceSpy: jasmine.SpyObj<LanguageService>;

	beforeEach(() => {
		languageServiceSpy = jasmine.createSpyObj<LanguageService>("LanguageService", ["setLanguage"]);

		TestBed.configureTestingModule({
			providers: [SetLanguageUseCase, { provide: LanguageService, useValue: languageServiceSpy }],
		});

		useCase = TestBed.inject(SetLanguageUseCase);
	});

	it("devrait déléguer à LanguageService.setLanguage avec la langue fournie", () => {
		useCase.execute("en");

		expect(languageServiceSpy.setLanguage).toHaveBeenCalledOnceWith("en");
	});
});
