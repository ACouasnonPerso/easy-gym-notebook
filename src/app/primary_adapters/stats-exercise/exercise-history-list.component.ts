import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExerciseOccurrence, CardioOccurrence } from '../../core_logic/shared/models';

@Component({
  selector: 'app-exercise-history-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './exercise-history-list.component.html',
  styleUrl: './exercise-history-list.component.scss',
})
export class ExerciseHistoryListComponent {
  readonly isCardio = input.required<boolean>();
  readonly occurrences = input.required<ExerciseOccurrence[]>();
  readonly cardioOccurrences = input.required<CardioOccurrence[]>();

  private readonly translate = inject(TranslateService);

  formatDate(d: Date): string {
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
