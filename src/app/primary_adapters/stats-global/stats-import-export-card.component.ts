import {
	Component,
	ChangeDetectionStrategy,
	inject,
	signal,
	computed,
	viewChild,
	ElementRef,
	output,
} from "@angular/core";
import { Router } from "@angular/router";
import { ImportDataUseCase } from "../../primary_ports/stats-global/import-data.usecase";
import { DeleteAllDataUseCase } from "../../primary_ports/stats-global/delete-all-data.usecase";
import { GetSessionsUseCase } from "../../primary_ports/session-list/get-sessions.usecase";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ImportConfirmModalComponent } from "./import-confirm-modal.component";
import { DeleteAllModalComponent } from "../shared/delete-all-modal.component";
import { ToastComponent, ToastType } from "../shared/toast.component";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

@Component({
	selector: "app-stats-import-export-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ImportConfirmModalComponent, DeleteAllModalComponent, ToastComponent, TranslateModule],
	templateUrl: "./stats-import-export-card.component.html",
	styleUrl: "./stats-import-export-card.component.scss",
})
export class StatsImportExportCardComponent {
	readonly importDataUseCase = inject(ImportDataUseCase);
	private readonly deleteAllDataUseCase = inject(DeleteAllDataUseCase);
	private readonly getSessionsUseCase = inject(GetSessionsUseCase);
	private readonly sessionRepo = inject(SESSION_REPOSITORY);
	private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);
	private readonly translate = inject(TranslateService);
	private readonly router = inject(Router);

	readonly fileInput = viewChild<ElementRef<HTMLInputElement>>("fileInput");

	readonly sessions = this.getSessionsUseCase.sessions;
	readonly hasSessions = computed(() => this.sessions().length > 0);

	readonly showImportModal = signal<boolean>(false);
	readonly importSessionCount = signal<number>(0);
	readonly importExerciseCount = signal<number>(0);

	readonly showDeleteAllModal = signal<boolean>(false);

	readonly toastVisible = signal<boolean>(false);
	readonly toastMessage = signal<string>("");
	readonly toastType = signal<ToastType>("success");

	readonly importConfirmed = output<void>();

	async exportData(): Promise<void> {
		const [sessions, exercises] = await Promise.all([this.sessionRepo.getAll(), this.exerciseRepo.getAll()]);
		const json = JSON.stringify({ sessions, exercises }, null, 2);
		const filename = `easy-gym-backup-${new Date().toISOString().slice(0, 10)}.json`;

		if (Capacitor.isNativePlatform()) {
			await Filesystem.writeFile({
				path: filename,
				data: json,
				directory: Directory.Cache,
				encoding: Encoding.UTF8,
			});
			const { uri } = await Filesystem.getUri({
				path: filename,
				directory: Directory.Cache,
			});
			await Share.share({
				title: filename,
				url: uri,
				dialogTitle: "Export Easy Gym",
			});
		} else {
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	triggerFileInput(): void {
		this.fileInput()?.nativeElement.click();
	}

	async onFileSelected(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async () => {
			const rawString = reader.result as string;
			const previewCounts = this.extractCountsFromJson(rawString);
			await this.importDataUseCase.validate(rawString);

			if (this.importDataUseCase.importError()) {
				this.showToast(this.resolveImportError(this.importDataUseCase.importError()!), "error");
			} else {
				this.importSessionCount.set(previewCounts.sessions);
				this.importExerciseCount.set(previewCounts.exercises);
				this.showImportModal.set(true);
			}
			input.value = "";
		};
		reader.readAsText(file);
	}

	async onImportConfirmed(): Promise<void> {
		this.showImportModal.set(false);
		await this.importDataUseCase.persist();
		this.importConfirmed.emit();
		this.showToast(this.translate.instant("import.successMessage"), "success");
	}

	onImportCancelled(): void {
		this.showImportModal.set(false);
	}

	onDeleteAllClicked(): void {
		this.showDeleteAllModal.set(true);
	}

	async onDeleteAllConfirmed(): Promise<void> {
		this.showDeleteAllModal.set(false);
		try {
			await this.deleteAllDataUseCase.execute();
			await this.router.navigate(["/sessions"]);
			this.showToast(this.translate.instant("deleteAllData.successMessage"), "success");
		} catch {
			this.showToast(this.translate.instant("deleteAllData.errorMessage"), "error");
		}
	}

	onDeleteAllCancelled(): void {
		this.showDeleteAllModal.set(false);
	}

	onToastDismissed(): void {
		this.toastVisible.set(false);
	}

	private extractCountsFromJson(raw: string): { sessions: number; exercises: number } {
		try {
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			const sessions = Array.isArray(parsed["sessions"]) ? (parsed["sessions"] as unknown[]).length : 0;
			const exercises = Array.isArray(parsed["exercises"]) ? (parsed["exercises"] as unknown[]).length : 0;
			return { sessions, exercises };
		} catch {
			return { sessions: 0, exercises: 0 };
		}
	}

	private showToast(message: string, type: ToastType): void {
		this.toastVisible.set(false);
		setTimeout(() => {
			this.toastMessage.set(message);
			this.toastType.set(type);
			this.toastVisible.set(true);
		}, 10);
	}

	private resolveImportError(error: string): string {
		const key =
			{
				invalid_json: "import.errorInvalidJson",
				missing_sessions_array: "import.errorMissingSessions",
				missing_exercises_array: "import.errorMissingExercises",
				invalid_session_entry: "import.errorInvalidSession",
				invalid_exercise_entry: "import.errorInvalidExercise",
			}[error] ?? "import.errorUnknown";
		return this.translate.instant(key);
	}
}
