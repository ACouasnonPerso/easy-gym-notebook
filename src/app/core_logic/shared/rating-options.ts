export interface RatingOption {
	value: number;
	label: string;
}

export const RATING_OPTIONS: RatingOption[] = [
	{ value: 20, label: "rating.20" },
	{ value: 19, label: "rating.19" },
	{ value: 18, label: "rating.18" },
	{ value: 17, label: "rating.17" },
	{ value: 16, label: "rating.16" },
	{ value: 15, label: "rating.15" },
	{ value: 14, label: "rating.14" },
	{ value: 13, label: "rating.13" },
	{ value: 12, label: "rating.12" },
	{ value: 11, label: "rating.10_11" },
	{ value: 9, label: "rating.7_9" },
	{ value: 6, label: "rating.1_6" },
];

export function ratingDisplayValue(option: RatingOption): string {
	if (option.label === "rating.10_11") return "10-11";
	if (option.label === "rating.7_9") return "7-9";
	if (option.label === "rating.1_6") return "1-6";
	return String(option.value);
}

export function isValidRating(value: number): boolean {
	return RATING_OPTIONS.some((option) => option.value === value);
}
