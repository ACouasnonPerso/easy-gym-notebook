import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { SESSION_REPOSITORY } from './secondary_ports/session/session.repository.interface';
import { SessionRepository } from './secondary_ports/session/session.repository';
import { SessionMapper } from './secondary_adapters/session/session.mapper';
import { EXERCISE_REPOSITORY } from './secondary_ports/exercise/exercise.repository.interface';
import { ExerciseRepository } from './secondary_ports/exercise/exercise.repository';
import { ExerciseMapper } from './secondary_adapters/exercise/exercise.mapper';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

const storedLang = localStorage.getItem('lang');
const browserLang = navigator.language?.startsWith('en') ? 'en' : navigator.language?.startsWith('es') ? 'es' : 'fr';
const initialLang = storedLang === 'en' || storedLang === 'fr' || storedLang === 'es' ? storedLang : browserLang;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withHashLocation()),
    provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'fr',
      lang: initialLang,
    }),
    SessionMapper,
    { provide: SESSION_REPOSITORY, useClass: SessionRepository },
    ExerciseMapper,
    { provide: EXERCISE_REPOSITORY, useClass: ExerciseRepository },
  ],
};
