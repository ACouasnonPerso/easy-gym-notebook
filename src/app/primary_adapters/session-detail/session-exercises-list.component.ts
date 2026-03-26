import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { Exercise } from '../../core_logic/shared/models';
import { ExerciseCardComponent } from './exercise-card.component';
import { AddExerciseFormComponent } from './add-exercise-form.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { SessionDetailUiService } from './session-detail-ui.service';

@Component({
  selector: 'app-session-exercises-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExerciseCardComponent, AddExerciseFormComponent, ConfirmDialogComponent],
  templateUrl: './session-exercises-list.component.html',
  styleUrl: './session-exercises-list.component.scss',
})
export class SessionExercisesListComponent {
  readonly exercises = input.required<Exercise[]>();
  readonly sessionId = input.required<string>();

  readonly exerciseValidate = output<string>();
  readonly exerciseCancel = output<string>();
  readonly exerciseUpdate = output<{ exercise: Exercise; changes: Partial<Exercise> }>();
  readonly exerciseDelete = output<string>();
  readonly openChrono = output<Exercise>();
  readonly openStats = output<Exercise>();

  readonly uiService = inject(SessionDetailUiService);

  readonly expandedExerciseId = signal<string | null>(null);
  readonly showAddForm = this.uiService.showAddExerciseForm;
  readonly showDeleteConfirm = signal(false);
  readonly pendingDeleteId = signal<string | null>(null);

  toggleExpand(exerciseId: string): void {
    this.expandedExerciseId.set(
      this.expandedExerciseId() === exerciseId ? null : exerciseId
    );
  }

  onDeleteRequest(exerciseId: string): void {
    this.pendingDeleteId.set(exerciseId);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmed(): void {
    const id = this.pendingDeleteId();
    if (id) this.exerciseDelete.emit(id);
    this.showDeleteConfirm.set(false);
    this.pendingDeleteId.set(null);
  }
}
