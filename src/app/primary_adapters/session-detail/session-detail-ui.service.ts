import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class SessionDetailUiService {
	readonly showAddExerciseForm = signal(false);
	readonly currentSessionId = signal<string | null>(null);
	readonly expandedExerciseId = signal<string | null>(null);

	setCurrentSessionId(id: string): void {
		this.currentSessionId.set(id);
	}

	setExpandedExerciseId(id: string | null): void {
		this.expandedExerciseId.set(id);
	}

	toggleExpandedExercise(id: string): void {
		this.expandedExerciseId.set(this.expandedExerciseId() === id ? null : id);
	}

	openAddExerciseForm(): void {
		this.showAddExerciseForm.set(true);
	}

	closeAddExerciseForm(): void {
		this.showAddExerciseForm.set(false);
	}
}
