import { Component, ChangeDetectionStrategy, input, output, inject, signal } from "@angular/core";
import { LanguageService, ActiveLang } from "../../core_logic/language/language.service";

@Component({
	selector: "app-language-selector",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./language-selector.component.html",
	styleUrl: "./language-selector.component.scss",
})
export class LanguageSelectorComponent {
	readonly langs = input<ActiveLang[]>(["fr", "en"]);
	readonly langChange = output<ActiveLang>();

	readonly languageService = inject(LanguageService);
	readonly showDropdown = signal(false);

	selectLang(lang: ActiveLang): void {
		this.langChange.emit(lang);
		this.showDropdown.set(false);
	}
}
