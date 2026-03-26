import { TestBed } from '@angular/core/testing';
import { Component, input, output } from '@angular/core';
import { NgStyle } from '@angular/common';
import { provideTranslateService, TranslateModule } from '@ngx-translate/core';
import { ExerciseCardComponent } from './exercise-card.component';
import { MuscleGroup, Exercise } from '../../core_logic/shared/models';

@Component({ selector: 'app-exercise-expanded', standalone: true, template: '' })
class FakeExerciseExpandedComponent {
  readonly exercise = input.required<Exercise>();
  readonly update = output<Partial<Exercise>>();
  readonly validate = output<void>();
  readonly cancel = output<void>();
  readonly delete = output<void>();
  readonly openChrono = output<void>();
  readonly openStats = output<void>();
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    sessionId: 'session-1',
    name: 'Bench Press',
    muscleGroup: null,
    muscleGroups: [],
    weightKg: 60,
    sets: 3,
    reps: 10,
    breakDurationSeconds: 90,
    status: 'pending',
    ...overrides,
  };
}

async function setup(exercise: Exercise) {
  await TestBed.configureTestingModule({
    imports: [ExerciseCardComponent],
    providers: [provideTranslateService({ defaultLanguage: 'fr' })],
  })
    .overrideComponent(ExerciseCardComponent, {
      set: { imports: [FakeExerciseExpandedComponent, NgStyle, TranslateModule] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ExerciseCardComponent);
  fixture.componentRef.setInput('exercise', exercise);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance };
}

describe('ExerciseCardComponent', () => {
  describe('affichage des tags muscleGroups', () => {
    it('naffiche aucun tag quand muscleGroups est vide', async () => {
      const { fixture } = await setup(makeExercise({ muscleGroup: null, muscleGroups: [] }));

      const tags = fixture.nativeElement.querySelectorAll('.tag');

      expect(tags.length).toBe(0);
    });

    it('affiche un tag quand muscleGroups contient un seul groupe', async () => {
      const { fixture } = await setup(makeExercise({ muscleGroup: null, muscleGroups: [MuscleGroup.Back] }));

      const tags = fixture.nativeElement.querySelectorAll('.tag');

      expect(tags.length).toBe(1);
      expect(tags[0].textContent.trim()).toBe(MuscleGroup.Back);
    });

    it('affiche deux tags quand muscleGroups contient deux groupes', async () => {
      const { fixture } = await setup(makeExercise({ muscleGroup: null, muscleGroups: [MuscleGroup.Chest, MuscleGroup.Triceps] }));

      const tags = fixture.nativeElement.querySelectorAll('.tag');

      expect(tags.length).toBe(2);
      expect(tags[0].textContent.trim()).toBe(MuscleGroup.Chest);
      expect(tags[1].textContent.trim()).toBe(MuscleGroup.Triceps);
    });

    it('applique le bon style de couleur à chaque tag selon son groupe musculaire', async () => {
      const { fixture } = await setup(makeExercise({ muscleGroup: null, muscleGroups: [MuscleGroup.Back, MuscleGroup.Biceps] }));

      const tags = fixture.nativeElement.querySelectorAll('.tag');

      expect(tags[0].style.color).toBe('rgb(52, 152, 219)');
      expect(tags[1].style.color).toBe('rgb(46, 204, 113)');
    });
  });

  describe('tagStyle', () => {
    it('retourne un objet vide quand le muscleGroup est null', async () => {
      const { component } = await setup(makeExercise({ muscleGroup: null }));

      const style = component.tagStyle(null);

      expect(style).toEqual({});
    });

    it('retourne la bonne couleur pour le groupe musculaire Back', async () => {
      const { component } = await setup(makeExercise({ muscleGroup: MuscleGroup.Back }));

      const style = component.tagStyle(MuscleGroup.Back);

      expect(style['color']).toBe('#3498db');
      expect(style['background']).toBe('rgba(52,152,219,0.15)');
      expect(style['border']).toBe('1px solid rgba(52,152,219,0.3)');
    });

    it('retourne la bonne couleur pour le groupe musculaire Chest', async () => {
      const { component } = await setup(makeExercise({ muscleGroup: MuscleGroup.Chest }));

      const style = component.tagStyle(MuscleGroup.Chest);

      expect(style['color']).toBe('#e74c3c');
      expect(style['background']).toBe('rgba(231,76,60,0.15)');
      expect(style['border']).toBe('1px solid rgba(231,76,60,0.3)');
    });

    it('retourne un objet vide pour un muscleGroup inconnu', async () => {
      const { component } = await setup(makeExercise({ muscleGroup: null }));

      const style = component.tagStyle('UnknownGroup' as MuscleGroup);

      expect(style).toEqual({});
    });
  });
});
