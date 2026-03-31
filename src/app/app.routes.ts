import { Routes } from "@angular/router";

export const appRoutes: Routes = [
	{ path: "", redirectTo: "/sessions", pathMatch: "full" },
	{
		path: "sessions",
		loadComponent: () =>
			import("./primary_adapters/session-list/session-list.component").then((m) => m.SessionListComponent),
	},
	{
		path: "sessions/:id",
		loadComponent: () =>
			import("./primary_adapters/session-detail/session-detail.component").then((m) => m.SessionDetailComponent),
	},
	{
		path: "chrono/exercise",
		loadComponent: () =>
			import("./primary_adapters/exercise-chrono/exercise-chrono.component").then((m) => m.ExerciseChronoComponent),
	},
	{
		path: "stats",
		loadComponent: () =>
			import("./primary_adapters/stats-global/stats-global.component").then((m) => m.StatsGlobalComponent),
	},
	{
		path: "stats/:exerciseName",
		loadComponent: () =>
			import("./primary_adapters/stats-exercise/stats-exercise.component").then((m) => m.StatsExerciseComponent),
	},
];
