import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { appRoutes } from './app.routes';
import { SESSION_REPOSITORY } from './secondary_ports/session/session.repository.interface';
import { SessionRepository } from './secondary_ports/session/session.repository';
import { SessionMapper } from './secondary_adapters/session/session.mapper';
import { EXERCISE_REPOSITORY } from './secondary_ports/exercise/exercise.repository.interface';
import { ExerciseRepository } from './secondary_ports/exercise/exercise.repository';
import { ExerciseMapper } from './secondary_adapters/exercise/exercise.mapper';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withHashLocation()),
    SessionMapper,
    { provide: SESSION_REPOSITORY, useClass: SessionRepository },
    ExerciseMapper,
    { provide: EXERCISE_REPOSITORY, useClass: ExerciseRepository },
  ],
};
