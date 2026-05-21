import { DetectorContext, HighlightMetric } from "../highlight-metric.model";
import { computeVolume } from "../../shared/utils";

export const MILESTONE_STEP_KG = 50_000; // 50 tonnes

/**
 * Detects when the user crosses a new 50-tonne total volume milestone.
 * Uses a repository to persist the last acknowledged threshold so it only fires once.
 */
export function volumeMilestoneDetector(
	ctx: DetectorContext,
	getLastMilestoneKg: () => number,
	setLastMilestoneKg: (kg: number) => void
): HighlightMetric | null {
	const { exercises, debugLog } = ctx;

	const totalVolumeKg = exercises
		.filter((e) => e.status === "validated")
		.reduce((sum, e) => sum + computeVolume(e), 0);

	if (totalVolumeKg === 0) {
		debugLog?.(`[volume-milestone] ❌ NULL — volume total = 0`);
		return null;
	}

	// Which milestone threshold has been crossed?
	const currentMilestone = Math.floor(totalVolumeKg / MILESTONE_STEP_KG) * MILESTONE_STEP_KG;
	const nextMilestone = currentMilestone + MILESTONE_STEP_KG;
	debugLog?.(`[volume-milestone] Volume total: ${Math.round(totalVolumeKg / 1000 * 10) / 10}t — palier actuel: ${currentMilestone / 1000}t — prochain: ${nextMilestone / 1000}t`);

	if (currentMilestone === 0) {
		debugLog?.(`[volume-milestone] ❌ NULL — premier palier (${MILESTONE_STEP_KG / 1000}t) pas encore atteint (${(totalVolumeKg / 1000).toFixed(1)}t / ${MILESTONE_STEP_KG / 1000}t)`);
		return null;
	}

	const lastAcknowledged = getLastMilestoneKg();
	debugLog?.(`[volume-milestone] Dernier palier acquitté : ${lastAcknowledged / 1000}t`);

	if (currentMilestone <= lastAcknowledged) {
		debugLog?.(`[volume-milestone] ❌ NULL — palier ${currentMilestone / 1000}t déjà acquitté (modifie localStorage "highlight-milestone-kg" pour réinitialiser)`);
		return null;
	}

	// New milestone crossed — acknowledge it
	setLastMilestoneKg(currentMilestone);

	debugLog?.(`[volume-milestone] ✅ DÉCLENCHÉ — nouveau palier ${currentMilestone / 1000}t franchi !`);
	return {
		id: "volume-milestone",
		category: "perf",
		impactScore: currentMilestone / 1000, // tonneage as score
		payload: {
			milestoneKg: currentMilestone,
			milestoneTonnes: currentMilestone / 1000,
			totalVolumeKg,
		},
	};
}
