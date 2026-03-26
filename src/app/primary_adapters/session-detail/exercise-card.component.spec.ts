import { TestBed } from '@angular/core/testing';
import { ExerciseCardComponent } from './exercise-card.component';
import { MuscleGroup, Exercise } from '../../core_logic/shared/models';

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
  }).compileComponents();

  const fixture = TestBed.createComponent(ExerciseCardComponent);
  fixture.componentRef.setInput('exercise', exercise);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance };
}

describe('ExerciseCardComponent', () => {
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
