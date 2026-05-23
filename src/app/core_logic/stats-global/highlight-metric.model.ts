import { Session, Exercise } from "../shared/models";

export type HighlightCategory = "perf" | "regularity";

/**
 * Raw output from a detector before view mapping.
 */
export interface HighlightMetric {
	/** Unique id for the detector (e.g. 'weight-pr', 'consecutive-weeks') */
	id: string;
	category: HighlightCategory;
	/** Raw score before favorite bonus is applied. Higher = more noteworthy. */
	impactScore: number;
	/**
	 * Name of the exercise this metric relates to (for deduplication).
	 * Regularity metrics leave this undefined.
	 */
	exerciseName?: string;
	/** Arbitrary payload passed to the i18n template for display. */
	payload: Record<string, unknown>;
}

/**
 * View-ready highlight passed to the dumb card component.
 */
export interface HighlightViewModel {
	id: string;
	category: HighlightCategory;
	/** i18n key for the label line (e.g. 'statsGlobal.highlights.weightPr') */
	labelKey: string;
	/** Formatted main value string (e.g. '100 kg') */
	value: string;
	/** Sub-value / gain line (e.g. '+5 kg') — optional */
	subValue?: string;
	/** i18n key for the time context appended to subValue (e.g. 'statsGlobal.highlights.context.inWeeks') — optional */
	subContext?: string;
	/** Interpolation params for subContext translation (e.g. { count: 3 } for inWeeks, { year: '25' } for vsMonthYear) */
	subContextParams?: Record<string, string | number>;
	/** Root-level i18n key for the month name param (e.g. 'months.3') — resolved separately so language changes re-translate it */
	subContextMonthKey?: string;
	/** Exercise name shown below the label — optional */
	exerciseName?: string;
	/** Icon name or emoji character */
	icon: string;
}

/**
 * Context object passed to every detector.
 */
export interface DetectorContext {
	sessions: Session[];
	exercises: Exercise[];
	today: Date;
	/** Returns the favorite bonus multiplier (0–0.30) for a given exercise name. */
	favoriteBonus(exerciseName: string): number;
	/**
	 * Optional debug logger. When provided, detectors log their internal
	 * decision steps. Activate via HighlightDebugService.enable().
	 */
	debugLog?: (msg: string) => void;
}

/** Type alias for a detector function. */
export type Detector = (ctx: DetectorContext) => HighlightMetric[];
