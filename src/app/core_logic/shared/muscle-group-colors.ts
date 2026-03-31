import { MuscleGroup } from "./models";

export interface MuscleGroupColor {
	color: string;
	bg: string;
	border: string;
}

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, MuscleGroupColor> = {
	[MuscleGroup.Chest]: { color: "#e74c3c", bg: "rgba(231,76,60,0.15)", border: "rgba(231,76,60,0.3)" },
	[MuscleGroup.Back]: { color: "#3498db", bg: "rgba(52,152,219,0.15)", border: "rgba(52,152,219,0.3)" },
	[MuscleGroup.Shoulders]: { color: "#9b59b6", bg: "rgba(155,89,182,0.15)", border: "rgba(155,89,182,0.3)" },
	[MuscleGroup.Biceps]: { color: "#2ecc71", bg: "rgba(46,204,113,0.15)", border: "rgba(46,204,113,0.3)" },
	[MuscleGroup.Triceps]: { color: "#1abc9c", bg: "rgba(26,188,156,0.15)", border: "rgba(26,188,156,0.3)" },
	[MuscleGroup.Forearms]: { color: "#a3cb38", bg: "rgba(163,203,56,0.15)", border: "rgba(163,203,56,0.3)" },
	[MuscleGroup.Abs]: { color: "var(--orange)", bg: "var(--orange-dim)", border: "rgba(245,166,35,0.3)" },
	[MuscleGroup.Quads]: { color: "#00bcd4", bg: "rgba(0,188,212,0.15)", border: "rgba(0,188,212,0.3)" },
	[MuscleGroup.Hamstrings]: { color: "#5c6bc0", bg: "rgba(92,107,192,0.15)", border: "rgba(92,107,192,0.3)" },
	[MuscleGroup.Glutes]: { color: "#e91e8c", bg: "rgba(233,30,140,0.15)", border: "rgba(233,30,140,0.3)" },
	[MuscleGroup.Calves]: { color: "#f1c40f", bg: "rgba(241,196,15,0.15)", border: "rgba(241,196,15,0.3)" },
	[MuscleGroup.Traps]: { color: "#ff9800", bg: "rgba(255,152,0,0.15)", border: "rgba(255,152,0,0.3)" },
	[MuscleGroup.Adductors]: { color: "#ec407a", bg: "rgba(236,64,122,0.15)", border: "rgba(236,64,122,0.3)" },
	[MuscleGroup.Abductors]: { color: "#ab47bc", bg: "rgba(171,71,188,0.15)", border: "rgba(171,71,188,0.3)" },
	[MuscleGroup.LowerBack]: { color: "#795548", bg: "rgba(121,85,72,0.15)", border: "rgba(121,85,72,0.3)" },
};

export function muscleGroupChipStyle(muscle: MuscleGroup): Record<string, string> {
	const entry = MUSCLE_GROUP_COLORS[muscle];
	if (!entry) return {};
	return { color: entry.color, background: entry.bg, border: `1px solid ${entry.border}` };
}
