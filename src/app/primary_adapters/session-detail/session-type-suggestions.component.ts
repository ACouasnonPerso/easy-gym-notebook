import { Component, ChangeDetectionStrategy, computed, effect, inject, input, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { SessionTemplate, SessionType } from "../../core_logic/session-template/session-template.service";
import { muscleGroupChipStyle } from "../../core_logic/shared/muscle-group-colors";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { LanguageService } from "../../core_logic/language/language.service";
import { GetSessionTypesUseCase } from "../../primary_ports/session-detail/get-session-types.usecase";
import { ApplySessionTemplateUseCase } from "../../primary_ports/session-detail/apply-session-template.usecase";

/** Session types shown before "Show more" (most done first). */
export const VISIBLE_TYPES_LIMIT = 10;
/** Past sessions shown for a type before "Show more" (most done first). */
export const VISIBLE_TEMPLATES_LIMIT = 3;

@Component({
	selector: "app-session-type-suggestions",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./session-type-suggestions.component.html",
	styleUrl: "./session-type-suggestions.component.scss",
})
export class SessionTypeSuggestionsComponent {
	private readonly getSessionTypesUseCase = inject(GetSessionTypesUseCase);
	private readonly applySessionTemplateUseCase = inject(ApplySessionTemplateUseCase);
	private readonly translate = inject(TranslateService);
	private readonly languageService = inject(LanguageService);
	private readonly haptic = inject(HapticService);

	readonly sessionId = input.required<string>();

	readonly sessionTypes = signal<SessionType[]>([]);
	readonly selectedTypeKey = signal<string | null>(null);
	readonly applying = signal(false);
	readonly showAllTypes = signal(false);
	readonly showAllTemplates = signal(false);

	readonly selectedType = computed(() => this.sessionTypes().find((t) => t.key === this.selectedTypeKey()) ?? null);

	readonly visibleTypes = computed(() => {
		const types = this.sessionTypes();
		return this.showAllTypes() ? types : types.slice(0, VISIBLE_TYPES_LIMIT);
	});
	readonly hiddenTypesCount = computed(() => this.sessionTypes().length - this.visibleTypes().length);

	readonly visibleTemplates = computed(() => {
		const templates = this.selectedType()?.templates ?? [];
		return this.showAllTemplates() ? templates : templates.slice(0, VISIBLE_TEMPLATES_LIMIT);
	});
	readonly hiddenTemplatesCount = computed(
		() => (this.selectedType()?.templates.length ?? 0) - this.visibleTemplates().length
	);

	constructor() {
		effect((onCleanup) => {
			const sessionId = this.sessionId();
			let stale = false;
			onCleanup(() => (stale = true));
			this.sessionTypes.set([]);
			this.selectedTypeKey.set(null);
			this.showAllTypes.set(false);
			this.showAllTemplates.set(false);
			this.getSessionTypesUseCase.execute(sessionId).then((types) => {
				if (!stale) this.sessionTypes.set(types);
			});
		});
	}

	typeLabel(type: SessionType): string {
		this.languageService.activeLang(); // re-render the labels when the language changes
		if (type.muscleGroups.length > 0)
			return type.muscleGroups.map((m) => this.translate.instant(`muscleGroups.${m}`)).join(" / ");
		return this.translate.instant(type.isCardio ? "common.cardio" : "sessionTemplates.other");
	}

	typeStyle(type: SessionType): Record<string, string> {
		return type.muscleGroups.length > 0 ? muscleGroupChipStyle(type.muscleGroups[0]) : {};
	}

	dateLabel(template: SessionTemplate): string {
		return new DatePipe(this.languageService.activeLang()).transform(template.lastDate, "d MMM yyyy") ?? "";
	}

	selectType(type: SessionType): void {
		this.haptic.vibrate();
		this.showAllTemplates.set(false);
		this.selectedTypeKey.set(type.key);
	}

	showMoreTypes(): void {
		this.haptic.vibrate();
		this.showAllTypes.set(true);
	}

	showMoreTemplates(): void {
		this.haptic.vibrate();
		this.showAllTemplates.set(true);
	}

	backToTypes(): void {
		this.haptic.vibrate();
		this.selectedTypeKey.set(null);
	}

	async applyTemplate(template: SessionTemplate): Promise<void> {
		if (this.applying()) return;
		this.haptic.vibrate();
		this.applying.set(true);
		try {
			await this.applySessionTemplateUseCase.execute(this.sessionId(), template.sourceSessionId);
		} finally {
			this.applying.set(false);
		}
	}
}
