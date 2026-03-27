import {Injectable, inject} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MuscleGroup} from './models';

const MUSCLE_GROUP_KEYS: { key: string; groups: MuscleGroup[] }[] = [
	{ key: 'chest',          groups: [MuscleGroup.Chest] },
	{ key: 'back',           groups: [MuscleGroup.Back] },
	{ key: 'backHamstrings', groups: [MuscleGroup.Back, MuscleGroup.Hamstrings] },
	{ key: 'shoulders',      groups: [MuscleGroup.Shoulders] },
	{ key: 'biceps',         groups: [MuscleGroup.Biceps] },
	{ key: 'triceps',        groups: [MuscleGroup.Triceps] },
	{ key: 'tricepsChest',   groups: [MuscleGroup.Triceps, MuscleGroup.Chest] },
	{ key: 'glutesQuads',    groups: [MuscleGroup.Glutes, MuscleGroup.Quads] },
	{ key: 'forearms',       groups: [MuscleGroup.Forearms] },
	{ key: 'abs',            groups: [MuscleGroup.Abs] },
	{ key: 'quads',          groups: [MuscleGroup.Quads] },
	{ key: 'hamstrings',     groups: [MuscleGroup.Hamstrings] },
	{ key: 'glutes',         groups: [MuscleGroup.Glutes] },
	{ key: 'calves',         groups: [MuscleGroup.Calves] },
	{ key: 'traps',          groups: [MuscleGroup.Traps] },
	{ key: 'adductors',      groups: [MuscleGroup.Adductors] },
	{ key: 'abductors',      groups: [MuscleGroup.Abductors] },
];

function normalize(text: string): string {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

type SynonymEntry = { term: string; groups: MuscleGroup[] };

const CARDIO_KEYWORDS: string[] = [
	'cardio',
	'course', 'run', 'running',
	'vélo', 'velo', 'cycling', 'bike',
	'natation', 'swim', 'swimming',
	'marche', 'walk', 'walking',
	'elliptique', 'elliptical',
	'rameur', 'rowing',
];

function matchesWholeWord(text: string, keyword: string): boolean {
	const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text);
}

@Injectable({providedIn: 'root'})
export class MuscleGroupDetectorService {
	private readonly translate = inject(TranslateService);
	private synonymsCache: SynonymEntry[] | null = null;

	constructor() {
		this.translate.onLangChange.subscribe(() => {
			this.synonymsCache = null;
		});
	}

	private getSynonyms(): SynonymEntry[] {
		if (this.synonymsCache) return this.synonymsCache;

		const seen = new Set<string>();

		const fromCurrentLang = MUSCLE_GROUP_KEYS.flatMap(({key, groups}) => {
			const csv = this.translate.instant(`muscleDetector.${key}`) as string;
			return csv.split(',').map(term => term.trim()).filter(term => {
				const normalized = normalize(term);
				if (seen.has(normalized)) return false;
				seen.add(normalized);
				return true;
			}).map(term => ({term, groups}));
		});

		const fromEnglish = MUSCLE_GROUP_KEYS.flatMap(({key, groups}) => {
			const csv = this.translate.instant(`englishMuscleDetector.${key}`) as string;
			return csv.split(',').map(term => term.trim()).filter(term => {
				const normalized = normalize(term);
				if (seen.has(normalized)) return false;
				seen.add(normalized);
				return true;
			}).map(term => ({term, groups}));
		});

		this.synonymsCache = [...fromCurrentLang, ...fromEnglish]
			.sort((a, b) => b.term.length - a.term.length);

		return this.synonymsCache;
	}

	detect(name: string): { muscleGroups: MuscleGroup[]; cleanedName: string; isCardio: boolean } {
		const normalizedName = normalize(name);

		const isCardio = CARDIO_KEYWORDS.some(kw => matchesWholeWord(normalizedName, normalize(kw)));

		if (isCardio)
			return { muscleGroups: [], cleanedName: name, isCardio: true };

		let normalizedRemaining = normalizedName;
		let cleanedName = name;
		const groupsFound = new Set<MuscleGroup>();

		for (const {term, groups} of this.getSynonyms()) {
			const normalizedTerm = normalize(term);
			if (!normalizedRemaining.includes(normalizedTerm)) continue;

			groups.forEach(g => groupsFound.add(g));
			normalizedRemaining = normalizedRemaining.replace(normalizedTerm, ' ');
			cleanedName = cleanedName.replace(new RegExp(term, 'gi'), '');
		}

		return {
			muscleGroups: [...groupsFound],
			cleanedName: cleanedName.replace(/\s+/g, ' ').trim() || name,
			isCardio: false,
		};
	}
}
