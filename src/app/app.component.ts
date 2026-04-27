import { Component, ChangeDetectionStrategy, HostListener, inject, computed } from "@angular/core";
import { RouterOutlet, Router, NavigationEnd } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map, startWith } from "rxjs/operators";
import { BottomNavComponent } from "./primary_adapters/shared/bottom-nav.component";
import { SessionBottomNavComponent } from "./primary_adapters/shared/session-bottom-nav.component";
import { TranslateService } from "@ngx-translate/core";
import { ActiveLang } from "./core_logic/language/language.service";
import { SessionChronoService } from "./core_logic/chrono/session-chrono.service";
import { SessionService } from "./core_logic/session/session.service";
import { ExercisePhotoService } from "./core_logic/exercise-photo/exercise-photo.service";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, BottomNavComponent, SessionBottomNavComponent],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	private readonly router = inject(Router);
	private readonly translate = inject(TranslateService);
	private readonly sessionService = inject(SessionService);
	private readonly sessionChronoService = inject(SessionChronoService);
	private readonly exercisePhotoService = inject(ExercisePhotoService);

	constructor() {
		this.exercisePhotoService.loadAll();
		this.translate.addLangs([
			"fr",
			"en",
			"pt",
			"de",
			"it",
			"es",
			"ko",
			"ru",
			"ja",
			"nl",
			"ar",
			"hi",
			"pl",
			"sv",
			"vi",
			"th",
		]);
		this.translate.setDefaultLang("fr");
		const savedLang = localStorage.getItem("lang") as ActiveLang | null;
		const browserLang = this.translate.getBrowserLang();
		const lang: ActiveLang =
			savedLang ??
			(browserLang === "en"
				? "en"
				: browserLang === "pt"
					? "pt"
					: browserLang === "de"
						? "de"
						: browserLang === "it"
							? "it"
							: browserLang === "es"
								? "es"
								: browserLang === "ko"
									? "ko"
									: browserLang === "ru"
										? "ru"
										: browserLang === "ja"
											? "ja"
											: browserLang === "nl"
												? "nl"
												: browserLang === "ar"
													? "ar"
													: browserLang === "hi"
														? "hi"
														: browserLang === "pl"
															? "pl"
															: browserLang === "sv"
																? "sv"
																: browserLang === "vi"
																	? "vi"
																	: browserLang === "th"
																		? "th"
																		: "fr");
		this.translate.use(lang);
	}

	private readonly currentUrl = toSignal(
		this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map((event) => (event as NavigationEnd).urlAfterRedirects),
			startWith(this.router.url)
		),
		{ initialValue: this.router.url }
	);

	readonly isSessionRoute = computed(() => {
		const url = this.currentUrl();
		return url.startsWith("/sessions/") || url.startsWith("/chrono/");
	});

	@HostListener("window:beforeunload")
	onBeforeUnload(): void {
		this.saveCurrentSessionDuration();
	}

	@HostListener("document:visibilitychange")
	onVisibilityChange(): void {
		if (document.hidden) {
			this.saveCurrentSessionDuration();
		}
	}

	private saveCurrentSessionDuration(): void {
		const session = this.sessionService.currentSession();
		if (!session || session.status !== "active") return;
		const elapsed = this.sessionChronoService.getElapsedForSession(session.id);
		if (elapsed <= 0) return;
		this.sessionService.updateCurrentSession({ durationSeconds: elapsed });
	}
}
