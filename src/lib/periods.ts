import { PUBLICATION_TIME_ZONE } from '../consts';

export type PeriodKind = 'weekly' | 'monthly' | 'yearly';

export interface PeriodInfo {
	kind: PeriodKind;
	id: string;
	title: string;
	shortTitle: string;
	start: string;
	end: string;
	year: number;
	number: number;
}

interface DateParts {
	year: number;
	month: number;
	day: number;
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: PUBLICATION_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

const pad = (value: number) => String(value).padStart(2, '0');

function dateParts(date: Date): DateParts {
	const parts = Object.fromEntries(
		dateFormatter
			.formatToParts(date)
			.filter((part) => part.type !== 'literal')
			.map((part) => [part.type, Number(part.value)]),
	);
	return { year: parts.year, month: parts.month, day: parts.day };
}

function toDate(parts: DateParts): Date {
	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function fromDate(date: Date): DateParts {
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	};
}

function addDays(parts: DateParts, days: number): DateParts {
	const date = toDate(parts);
	date.setUTCDate(date.getUTCDate() + days);
	return fromDate(date);
}

function toDateString(parts: DateParts): string {
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function isoWeek(parts: DateParts): { year: number; week: number } {
	const date = toDate(parts);
	const day = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - day);
	const year = date.getUTCFullYear();
	const yearStart = new Date(Date.UTC(year, 0, 1));
	const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
	return { year, week };
}

function mondayOfIsoWeek(year: number, week: number): DateParts {
	const januaryFourth = new Date(Date.UTC(year, 0, 4));
	const day = januaryFourth.getUTCDay() || 7;
	januaryFourth.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7);
	return fromDate(januaryFourth);
}

export function getPeriodId(date: Date, kind: PeriodKind): string {
	const parts = dateParts(date);
	if (kind === 'weekly') {
		const { year, week } = isoWeek(parts);
		return `${year}-W${pad(week)}`;
	}
	if (kind === 'monthly') return `${parts.year}-${pad(parts.month)}`;
	return String(parts.year);
}

export function getPeriodInfo(kind: PeriodKind, id: string): PeriodInfo {
	if (kind === 'weekly') {
		const match = /^(\d{4})-W(\d{2})$/.exec(id);
		if (!match) throw new Error(`无效的周刊编号：${id}`);
		const year = Number(match[1]);
		const week = Number(match[2]);
		const start = mondayOfIsoWeek(year, week);
		const end = addDays(start, 6);
		const verified = isoWeek(start);
		if (verified.year !== year || verified.week !== week) throw new Error(`无效的周刊编号：${id}`);
		return {
			kind,
			id,
			title: `${year} 年第 ${week} 周`,
			shortTitle: `第 ${week} 周`,
			start: toDateString(start),
			end: toDateString(end),
			year,
			number: week,
		};
	}

	if (kind === 'monthly') {
		const match = /^(\d{4})-(\d{2})$/.exec(id);
		if (!match) throw new Error(`无效的月刊编号：${id}`);
		const year = Number(match[1]);
		const month = Number(match[2]);
		if (month < 1 || month > 12) throw new Error(`无效的月刊编号：${id}`);
		const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
		return {
			kind,
			id,
			title: `${year} 年 ${month} 月`,
			shortTitle: `${month} 月`,
			start: `${year}-${pad(month)}-01`,
			end: `${year}-${pad(month)}-${pad(lastDay)}`,
			year,
			number: month,
		};
	}

	if (!/^\d{4}$/.test(id)) throw new Error(`无效的年刊编号：${id}`);
	const year = Number(id);
	return {
		kind,
		id,
		title: `${year} 年刊`,
		shortTitle: `${year}`,
		start: `${year}-01-01`,
		end: `${year}-12-31`,
		year,
		number: year,
	};
}

export function getCurrentPeriod(kind: PeriodKind, now = new Date()): PeriodInfo {
	return getPeriodInfo(kind, getPeriodId(now, kind));
}

export function formatPeriodRange(period: PeriodInfo): string {
	if (period.kind === 'yearly') return `${period.year}.01.01—${period.year}.12.31`;
	const start = period.start.slice(5).replace('-', '.');
	const end = period.end.slice(5).replace('-', '.');
	return `${start}—${end}`;
}

export function kindLabel(kind: PeriodKind): { zh: string; en: string } {
	if (kind === 'weekly') return { zh: '周刊', en: 'Weekly' };
	if (kind === 'monthly') return { zh: '月刊', en: 'Monthly' };
	return { zh: '年刊', en: 'Yearly' };
}
