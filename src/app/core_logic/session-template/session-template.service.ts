import { Injectable } from "@angular/core";
import { Exercise, MuscleGroup, Session } from "../shared/models";

export interface SessionTemplateExercise {
	name: string;
	sets: number;
	isCardio: boolean;
}

export interface SessionTemplate {
	sourceSessionId: string;
	lastDate: Date;
	occurrences: number;
	exercises: SessionTemplateExercise[];
}

export interface SessionType {
	key: string;
	muscleGroups: MuscleGroup[];
	isCardio: boolean;
	occurrences: number;
	lastDate: Date;
	templates: SessionTemplate[];
}

const MUSCLE_GROUP_ORDER = Object.values(MuscleGroup);
const CARDIO_KEY = "cardio";
const OTHER_KEY = "other";

@Injectable({ providedIn: "root" })
export class SessionTemplateService {
	buildSessionTypes(sessions: Session[], excludedSessionId: string | null = null): SessionType[] {
		const types = new Map<string, SessionType>();
		const templatesBySignature = new Map<string, SessionTemplate>();

		const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		for (const session of sortedSessions) {
			if (session.id === excludedSessionId) continue;
			const exercises = session.exercises.filter((e) => e.status === "validated");
			if (exercises.length === 0) continue;

			const muscleGroups = this.muscleGroupsOf(exercises);
			const isCardio = muscleGroups.length === 0 && exercises.some((e) => e.isCardio);
			const typeKey = muscleGroups.length > 0 ? muscleGroups.join("+") : isCardio ? CARDIO_KEY : OTHER_KEY;
			const sessionDate = new Date(session.date);

			let type = types.get(typeKey);
			if (!type) {
				type = { key: typeKey, muscleGroups, isCardio, occurrences: 0, lastDate: sessionDate, templates: [] };
				types.set(typeKey, type);
			}
			type.occurrences++;

			const signature = `${typeKey}::${this.signatureOf(exercises)}`;
			const existing = templatesBySignature.get(signature);
			if (existing) {
				existing.occurrences++;
				continue;
			}
			const template: SessionTemplate = {
				sourceSessionId: session.id,
				lastDate: sessionDate,
				occurrences: 1,
				exercises: exercises.map((e) => ({
					name: e.name,
					sets: e.isPyramid && e.pyramidSets.length > 0 ? e.pyramidSets.length : e.sets,
					isCardio: e.isCardio,
				})),
			};
			templatesBySignature.set(signature, template);
			type.templates.push(template);
		}

		const byFrequencyThenRecency = <T extends { occurrences: number; lastDate: Date }>(a: T, b: T): number =>
			b.occurrences - a.occurrences || b.lastDate.getTime() - a.lastDate.getTime();

		const result = [...types.values()];
		for (const type of result) type.templates.sort(byFrequencyThenRecency);
		return result.sort(byFrequencyThenRecency);
	}

	private muscleGroupsOf(exercises: Exercise[]): MuscleGroup[] {
		const groups = new Set<MuscleGroup>();
		for (const exercise of exercises) {
			if (!exercise.isCardio && exercise.muscleGroup) groups.add(exercise.muscleGroup);
		}
		return MUSCLE_GROUP_ORDER.filter((group) => groups.has(group));
	}

	private signatureOf(exercises: Exercise[]): string {
		return exercises
			.map((e) => this.normalize(e.name))
			.sort()
			.join("|");
	}

	private normalize(text: string): string {
		return text
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.toLowerCase()
			.trim()
			.replace(/\s+/g, " ");
	}
}
