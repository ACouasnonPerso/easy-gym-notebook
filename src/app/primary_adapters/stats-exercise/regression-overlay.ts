import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";

export interface RegressionOverlay {
	visible: boolean;
	x1?: number;
	y1?: number;
	x2?: number;
	y2?: number;
	labelX?: number;
	labelY?: number;
	labelText?: string;
}

export function computeRegressionOverlay(
	chartPoints: Array<{ x: number; y: number }>,
	service: LinearRegressionService,
	domainValues?: number[],
	groupBy?: GroupBy
): RegressionOverlay {
	const minPoints = (!groupBy || groupBy === 'session') ? 4 : 2;
	if (chartPoints.length < minPoints) return { visible: false };
	const indexedPoints = chartPoints.map((p, i) => ({ x: i, y: p.y }));
	const result = service.compute(indexedPoints);

	if (result === null) {
		return { visible: false };
	}

	const x1 = chartPoints[0].x;
	const x2 = chartPoints[chartPoints.length - 1].x;

	const y1 = Math.max(20, Math.min(110, result.startY));
	const y2 = Math.max(20, Math.min(110, result.endY));

	const labelX = x2 + 20;
	const labelY = Math.max(22, Math.min(108, y2));

	let percent = result.percent;
	if (domainValues !== undefined) {
		const domainPoints = domainValues.map((v, i) => ({ x: i, y: v }));
		const domainResult = service.compute(domainPoints);
		percent = domainResult !== null ? domainResult.percent : null;
	}

	let labelText = "";
	if (percent !== null && Math.abs(percent) >= 5) {
		labelText = percent > 0 ? `+${percent}%` : `${percent}%`;
	}

	return { visible: true, x1, y1, x2, y2, labelX, labelY, labelText };
}
