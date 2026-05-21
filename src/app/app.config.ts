import { ApplicationConfig, InjectionToken } from "@angular/core";
import { provideRouter, withHashLocation } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { appRoutes } from "./app.routes";
import { SESSION_REPOSITORY } from "./secondary_ports/session/session.repository.interface";
import { SessionRepository } from "./secondary_ports/session/session.repository";
import { SessionMapper } from "./secondary_adapters/session/session.mapper";
import { EXERCISE_REPOSITORY } from "./secondary_ports/exercise/exercise.repository.interface";
import { ExerciseRepository } from "./secondary_ports/exercise/exercise.repository";
import { ExerciseMapper } from "./secondary_adapters/exercise/exercise.mapper";
import { REVIEW_REPOSITORY } from "./secondary_ports/review/review.repository.interface";
import { ReviewRepository } from "./secondary_ports/review/review.repository";
import { ImportService } from "./core_logic/import/import.service";
import { ImportMapper } from "./secondary_adapters/import/import.mapper";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { environment } from "../environments/environment";
import { ANALYTICS_REPOSITORY } from "./secondary_ports/analytics/analytics.repository.interface";
import { FirestoreAnalyticsRepository } from "./secondary_adapters/analytics/firestore-analytics.repository";
import { EXERCISE_PHOTO_REPOSITORY } from "./secondary_ports/exercise-photo/exercise-photo.repository.interface";
import { ExercisePhotoRepository } from "./secondary_ports/exercise-photo/exercise-photo.repository";
import { ExercisePhotoService } from "./core_logic/exercise-photo/exercise-photo.service";
import { MILESTONE_REPOSITORY } from "./secondary_ports/highlight-stats/milestone-repository.interface";
import { LocalStorageMilestoneRepository } from "./secondary_adapters/highlight-stats/local-storage-milestone.repository";
import { RECENT_HIGHLIGHTS_REPOSITORY } from "./secondary_ports/highlight-stats/recent-highlights-repository.interface";
import { LocalStorageRecentHighlightsRepository } from "./secondary_adapters/highlight-stats/local-storage-recent-highlights.repository";

export const FIRESTORE = new InjectionToken<Firestore>("Firestore");

const firebaseApp = initializeApp(environment.firebase);

const storedLang = localStorage.getItem("lang");
const browserLang = navigator.language?.startsWith("en") ? "en" : navigator.language?.startsWith("es") ? "es" : "fr";
const initialLang = storedLang === "en" || storedLang === "fr" || storedLang === "es" ? storedLang : browserLang;

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(appRoutes, withHashLocation()),
		provideHttpClient(),
		provideTranslateService({
			loader: provideTranslateHttpLoader({
				prefix: "./assets/i18n/",
				suffix: ".json",
			}),
			fallbackLang: "fr",
			lang: initialLang,
		}),
		{ provide: FIRESTORE, useValue: getFirestore(firebaseApp, "default") },
		{ provide: ANALYTICS_REPOSITORY, useClass: FirestoreAnalyticsRepository },
		SessionMapper,
		{ provide: SESSION_REPOSITORY, useClass: SessionRepository },
		ExerciseMapper,
		{ provide: EXERCISE_REPOSITORY, useClass: ExerciseRepository },
		{ provide: REVIEW_REPOSITORY, useClass: ReviewRepository },
		ImportMapper,
		ImportService,
		ExercisePhotoService,
		{ provide: EXERCISE_PHOTO_REPOSITORY, useClass: ExercisePhotoRepository },
		{ provide: MILESTONE_REPOSITORY, useClass: LocalStorageMilestoneRepository },
		{ provide: RECENT_HIGHLIGHTS_REPOSITORY, useClass: LocalStorageRecentHighlightsRepository },
	],
};
