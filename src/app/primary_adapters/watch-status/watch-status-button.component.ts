import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { WatchStatusUseCase } from "../../primary_ports/watch/watch-status.usecase";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { LanguageService } from "../../core_logic/language/language.service";

/** Watch icon of the session list: shows the connection state, opens the status sheet. */
@Component({
	selector: "app-watch-status-button",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./watch-status-button.component.html",
	styleUrl: "./watch-status-button.component.scss",
})
export class WatchStatusButtonComponent implements OnInit {
	private readonly watchStatusUseCase = inject(WatchStatusUseCase);
	private readonly haptic = inject(HapticService);
	private readonly languageService = inject(LanguageService);

	readonly available = this.watchStatusUseCase.isAvailable();
	readonly level = this.watchStatusUseCase.level;
	readonly status = this.watchStatusUseCase.status;
	readonly errors = this.watchStatusUseCase.errors;
	readonly showSheet = signal(false);

	readonly checks = computed(() => {
		const status = this.status();
		return [
			{ key: "watchStatus.paired", ok: status?.paired === true },
			{ key: "watchStatus.appInstalled", ok: status?.appInstalled === true },
			{ key: "watchStatus.reachable", ok: status?.reachable === true },
		];
	});

	ngOnInit(): void {
		void this.watchStatusUseCase.refresh();
	}

	open(): void {
		this.haptic.vibrate();
		this.showSheet.set(true);
		void this.watchStatusUseCase.refresh();
	}

	close(): void {
		this.showSheet.set(false);
	}

	clearErrors(): void {
		this.haptic.vibrate();
		void this.watchStatusUseCase.clearErrors();
	}

	dateLabel(iso: string | null | undefined): string | null {
		if (!iso) return null;
		return new DatePipe(this.languageService.activeLang()).transform(iso, "d MMM, HH:mm:ss");
	}
}
