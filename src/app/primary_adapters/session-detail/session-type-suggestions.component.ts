import { Component, ChangeDetectionStrategy, OnInit, computed, inject, input, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { MuscleGroup } from "../../core_logic/shared/models";
import { SessionTemplate, SessionType } from "../../core_logic/session-template/session-template.service";
import { muscleGroupChipStyle } from "../../core_logic/shared/muscle-group-colors";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { LanguageService } from "../../core_logic/language/language.service";
import { GetSessionTypesUseCase } from "../../primary_ports/session-detail/get-session-types.usecase";
import { ApplySessionTemplateUseCase } from "../../primary_ports/session-detail/apply-session-template.usecase";

@Component({
	selector: "app-session-type-suggestions",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./session-type-suggestions.component.html",
	styleUrl: "./session-type-suggestions.component.scss",
})
export class SessionTypeSuggestionsComponent implements OnInit {
	private readonly getSessionTypesUseCase = inject(GetSessionTypesUseCase);
	private readonly applySessionTemplateUseCase = inject(ApplySessionTemplateUseCase);
	private readonly translate = inject(TranslateService);
	private readonly languageService = inject(LanguageService);
	private readonly haptic = inject(HapticService);

	readonly sessionId = input.required<string>();

	readonly sessionTypes = this.getSessionTypesUseCase.sessionTypes;
	readonly selectedTypeKey = signal<string | null>(null);
	readonly applying = signal(false);

	readonly selectedType = computed(() => this.sessionTypes().find((t) => t.key === this.selectedTypeKey()) ?? null);

	ngOnInit(): void {
		this.selectedTypeKey.set(null);
		this.getSessionTypesUseCase.execute(this.sessionId());
	}

	typeLabel(type: SessionType): string {
		this.languageService.activeLang();
		if (type.muscleGroups.length > 0)
			return type.muscleGroups.map((m) => this.translate.instant(`muscleGroups.${m}`)).join(" / ");
		return this.translate.instant(type.isCardio ? "common.cardio" : "sessionTemplates.other");
	}

	typeStyle(type: SessionType): Record<string, string> {
		return type.muscleGroups.length > 0 ? muscleGroupChipStyle(type.muscleGroups[0] as MuscleGroup) : {};
	}

	dateLabel(template: SessionTemplate): string {
		return new DatePipe(this.languageService.activeLang()).transform(template.lastDate, "d MMM yyyy") ?? "";
	}

	selectType(type: SessionType): void {
		this.haptic.vibrate();
		this.selectedTypeKey.set(type.key);
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
