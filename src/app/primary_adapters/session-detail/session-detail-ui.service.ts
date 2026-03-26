import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionDetailUiService {
  readonly showAddExerciseForm = signal(false);
  readonly currentSessionId = signal<string | null>(null);

  setCurrentSessionId(id: string): void {
    this.currentSessionId.set(id);
  }

  openAddExerciseForm(): void {
    this.showAddExerciseForm.set(true);
  }

  closeAddExerciseForm(): void {
    this.showAddExerciseForm.set(false);
  }
}
