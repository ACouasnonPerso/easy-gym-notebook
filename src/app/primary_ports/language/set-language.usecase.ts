import { Injectable, inject } from "@angular/core";
import { LanguageService, ActiveLang } from "../../core_logic/language/language.service";

@Injectable({ providedIn: "root" })
export class SetLanguageUseCase {
	private readonly languageService = inject(LanguageService);

	execute(lang: ActiveLang): void {
		this.languageService.setLanguage(lang);
	}
}
