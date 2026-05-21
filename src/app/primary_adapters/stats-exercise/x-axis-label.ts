import { GroupBy } from '../../core_logic/stats-exercise/group-by.model';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getXAxisLabel(date: Date, groupBy: GroupBy): string {
	switch (groupBy) {
		case 'session': {
			const dd = date.getDate().toString().padStart(2, '0');
			const mm = (date.getMonth() + 1).toString().padStart(2, '0');
			return `${dd}/${mm}`;
		}
		case 'week': {
			const thursday = new Date(date.valueOf());
			thursday.setDate(thursday.getDate() + 4 - (thursday.getDay() || 7));
			const isoYear = thursday.getFullYear();
			const jan4 = new Date(isoYear, 0, 4);
			const weekNum = Math.round((thursday.getTime() - jan4.getTime()) / 604800000) + 1;
			return 'S' + weekNum;
		}
		case 'month':
			return MONTHS[date.getMonth()];
		case 'year':
			return String(date.getFullYear());
	}
}
