import {Injectable} from '@angular/core';
import {MuscleGroup} from './models';

// Each entry maps one or more muscle groups to their synonyms.
// Multi-group entries allow compound movements to tag several groups at once.
// Terms within a group are sorted loosely from most specific to least specific
// to make it easy to scan and add new synonyms.
const SYNONYMS_BY_GROUP: { groups: MuscleGroup[]; terms: string[] }[] = [
  {
    groups: [MuscleGroup.Chest],
    terms: ['développé couché', 'développé', 'developpe', 'pectoraux', 'poitrine', 'bench', 'pecs', 'dc'],
  },
  {
    groups: [MuscleGroup.Back],
    terms: ['dorsaux', 'tirage', 'rowing', 'tractions', 'pull', 'dos'],
  },
  {
    groups: [MuscleGroup.Back, MuscleGroup.Hamstrings],
    terms: ['soulevé de terre', 'deadlift'],
  },
  {
    groups: [MuscleGroup.Shoulders],
    terms: ['deltoides', 'deltoide', 'militaire', 'epaules', 'epaule', 'ohp'],
  },
  {
    groups: [MuscleGroup.Biceps],
    terms: ['biceps', 'bibi', 'bi'],
  },
	{
		groups: [MuscleGroup.Triceps],
		terms: ['triceps', 'pushdown', 'tritri', 'tri'],
	},
	{
		groups: [MuscleGroup.Triceps, MuscleGroup.Chest],
		terms: [ 'dips'],
	},
  {
    groups: [MuscleGroup.Forearms],
    terms: ['avant-bras', 'avant bras', 'grip'],
  },
  {
    groups: [MuscleGroup.Abs],
    terms: ['abdominaux', 'planche', 'crunch', 'abdos'],
  },
  {
    groups: [MuscleGroup.Quads],
    terms: ['leg extension', 'leg press', 'quadriceps', 'squat', 'quads', 'quadri'],
  },
  {
    groups: [MuscleGroup.Hamstrings],
    terms: ['leg curl', 'ischios', 'ischio'],
  },
  {
    groups: [MuscleGroup.Quads, MuscleGroup.Hamstrings, MuscleGroup.Glutes],
    terms: ['fentes'],
  },
  {
    groups: [MuscleGroup.Glutes],
    terms: ['hip thrust', 'fessiers', 'fessier', 'glutes', 'booty'],
  },
  {
    groups: [MuscleGroup.Calves],
    terms: ['mollets', 'mollet', 'calves', 'calf'],
  },
  {
    groups: [MuscleGroup.Traps],
    terms: ['trapezes', 'trapèzes', 'shrug', 'trap'],
  },
  {
    groups: [MuscleGroup.FullBody],
    terms: ['full body', 'fullbody', 'circuit'],
  },
];

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

type SynonymEntry = { term: string; groups: MuscleGroup[] };

const ALL_SYNONYMS: SynonymEntry[] = SYNONYMS_BY_GROUP
  .flatMap(({ groups, terms }) => terms.map(term => ({ term, groups })))
  .sort((a, b) => b.term.length - a.term.length);

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

@Injectable({ providedIn: 'root' })
export class MuscleGroupDetectorService {
  detect(name: string): { muscleGroups: MuscleGroup[]; cleanedName: string; isCardio: boolean } {
    const normalizedName = normalize(name);

    const isCardio = CARDIO_KEYWORDS.some(kw => matchesWholeWord(normalizedName, normalize(kw)));

    if (isCardio) {
      return {
        muscleGroups: [],
        cleanedName: name,
        isCardio: true,
      };
    }

    let normalizedRemaining = normalizedName;
    let cleanedName = name;
    const groupsFound = new Set<MuscleGroup>();

    for (const { term, groups } of ALL_SYNONYMS) {
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
