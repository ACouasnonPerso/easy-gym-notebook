import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed, effect } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GetSessionDetailUseCase } from "../../primary_ports/session-detail/get-session-detail.usecase";
import { ValidateExerciseUseCase } from "../../primary_ports/session-detail/validate-exercise.usecase";
import { CancelExerciseUseCase } from "../../primary_ports/session-detail/cancel-exercise.usecase";
import { DeleteExerciseUseCase } from "../../primary_ports/session-detail/delete-exercise.usecase";
import { UpdateExerciseUseCase } from "../../primary_ports/session-detail/update-exercise.usecase";
import { UpdateSessionDateUseCase } from "../../primary_ports/session-detail/update-session-date.usecase";
import { UpdateSessionDurationUseCase } from "../../primary_ports/session-detail/update-session-duration.usecase";
import { EndSessionUseCase } from "../../primary_ports/session-detail/end-session.usecase";
import { GetSessionChronoUseCase } from "../../primary_ports/session-chrono/get-session-chrono.usecase";
import { PauseSessionChronoUseCase } from "../../primary_ports/session-chrono/pause-session-chrono.usecase";
import { SetSessionChronoUseCase } from "../../primary_ports/session-chrono/set-session-chrono.usecase";
import { formatDuration, computeVolume } from "../../core_logic/shared/utils";
import { Exercise } from "../../core_logic/shared/models";
import { HapticService } from "../../core_logic/shared/haptic.service";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";
import { EditDurationPopupComponent } from "./edit-duration-popup.component";
import { EndSessionModalComponent } from "./end-session-modal.component";
import { SessionHeaderComponent } from "./session-header.component";
import { SessionExercisesListComponent } from "./session-exercises-list.component";
import { AddExerciseFormComponent } from "./add-exercise-form.component";
import { SessionDetailUiService } from "./session-detail-ui.service";

@Component({
	selector: "app-session-detail",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SessionHeaderComponent,
		SessionExercisesListComponent,
		EditDurationPopupComponent,
		EndSessionModalComponent,
		AddExerciseFormComponent,
	],
	providers: [WeightDisplayPipe],
	templateUrl: "./session-detail.component.html",
	styleUrl: "./session-detail.component.scss",
})
export class SessionDetailComponent implements OnInit, OnDestroy {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly getSessionDetailUseCase = inject(GetSessionDetailUseCase);
	private readonly validateExerciseUseCase = inject(ValidateExerciseUseCase);
	private readonly cancelExerciseUseCase = inject(CancelExerciseUseCase);
	private readonly deleteExerciseUseCase = inject(DeleteExerciseUseCase);
	private readonly updateExerciseUseCase = inject(UpdateExerciseUseCase);
	private readonly updateSessionDateUseCase = inject(UpdateSessionDateUseCase);
	private readonly updateSessionDurationUseCase = inject(UpdateSessionDurationUseCase);
	readonly endSessionUseCase = inject(EndSessionUseCase);
	protected readonly getSessionChronoUseCase = inject(GetSessionChronoUseCase);
	private readonly pauseSessionChronoUseCase = inject(PauseSessionChronoUseCase);
	private readonly setSessionChronoUseCase = inject(SetSessionChronoUseCase);
	readonly sessionDetailUiService = inject(SessionDetailUiService);
	private readonly haptic = inject(HapticService);
	private readonly weightDisplay = inject(WeightDisplayPipe);

	readonly session = this.getSessionDetailUseCase.session;
	readonly exercises = this.getSessionDetailUseCase.exercises;

	readonly showDurationPicker = signal(false);

	readonly sessionId = signal("");

	constructor() {
		effect(() => {
			const session = this.session();
			const id = this.sessionId();
			if (session?.status === "active" && id) {
				this.pauseSessionChronoUseCase.startForSession(id);
			}
		});
	}

	readonly chronoStatus = computed(() => this.getSessionChronoUseCase.getStatusForSession(this.sessionId())());

	readonly totalWeight = computed(() =>
		this.exercises()
			.filter((e) => e.status === "validated")
			.reduce((sum, e) => sum + computeVolume(e), 0)
	);

	readonly currentElapsedSeconds = computed(() =>
		this.getSessionChronoUseCase.getElapsedForSession(this.sessionId())()
	);

	readonly durationLabel = computed(() => {
		if (this.session()?.status === "active" || this.chronoStatus() === "running")
			return formatDuration(this.currentElapsedSeconds());
		return formatDuration(this.session()?.durationSeconds ?? 0);
	});

	readonly totalWeightFormatted = computed(() => {
		const kg = this.totalWeight();
		if (kg >= 1000) return this.weightDisplay.transform(kg / 1000, "t");
		return this.weightDisplay.transform(kg, "kg");
	});

	ngOnInit(): void {
		const id = this.route.snapshot.params["id"];
		this.sessionId.set(id);
		this.sessionDetailUiService.setCurrentSessionId(id);
		this.getSessionDetailUseCase.execute(id);
	}

	ngOnDestroy(): void {
		// Intentionally empty — session timers continue running in the background
		// regardless of navigation. Do not pause here.
	}

	onDateChange(value: string): void {
		this.updateSessionDateUseCase.execute(new Date(value));
	}

	onExerciseUpdate(exercise: Exercise, changes: Partial<Exercise>): void {
		this.updateExerciseUseCase.execute(exercise.id, changes);
	}

	onExerciseDelete(exerciseId: string): void {
		this.deleteExerciseUseCase.execute(exerciseId);
	}

	onExerciseValidate(exerciseId: string): void {
		this.validateExerciseUseCase.execute(exerciseId);
	}

	onExerciseCancel(exerciseId: string): void {
		this.cancelExerciseUseCase.execute(exerciseId);
	}

	navigateToExerciseChrono(exercise: Exercise): void {
		this.router.navigate(["/chrono/exercise"], { queryParams: { breakDuration: exercise.breakDurationSeconds } });
	}

	navigateToStats(exercise: Exercise): void {
		this.router.navigate(["/stats/", encodeURIComponent(exercise.name)]);
	}

	onEndSession(): void {
		this.endSessionUseCase.execute();
	}

	onEndSessionConfirmed(): void {
		this.endSessionUseCase.confirmEnd();
	}

	goBack(): void {
		this.haptic.vibrate();
		if (this.session()?.status === "active") {
			const elapsed = this.getSessionChronoUseCase.getElapsedForSession(this.sessionId())();
			this.updateSessionDurationUseCase.execute(elapsed);
		}
		this.router.navigate(["/sessions"]);
	}

	onDurationClick(): void {
		this.showDurationPicker.set(true);
	}

	onDurationConfirmed(durationSeconds: number): void {
		if (this.session()?.status === "active") {
			this.setSessionChronoUseCase.executeForSession(this.sessionId(), durationSeconds);
		}
		this.updateSessionDurationUseCase.execute(durationSeconds);
		this.showDurationPicker.set(false);
	}

	onPause(): void {
		this.pauseSessionChronoUseCase.pauseForSession(this.sessionId());
	}

	onResume(): void {
		this.pauseSessionChronoUseCase.resumeForSession(this.sessionId());
	}
}
