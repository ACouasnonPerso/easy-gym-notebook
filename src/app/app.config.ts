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
	],
};
