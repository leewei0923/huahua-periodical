import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import matter from 'gray-matter';

const TIME_ZONE = 'Asia/Shanghai';
const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'blog');
const SNAPSHOT_ROOT = join(process.cwd(), 'src', 'data', 'issues');
const kinds = ['weekly', 'monthly', 'yearly'];
const aliases = new Map([
	['week', 'weekly'],
	['month', 'monthly'],
	['year', 'yearly'],
]);
const pad = (value) => String(value).padStart(2, '0');

function localParts(date) {
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});
	const values = Object.fromEntries(
		formatter
			.formatToParts(date)
			.filter((part) => part.type !== 'literal')
			.map((part) => [part.type, Number(part.value)]),
	);
	return { year: values.year, month: values.month, day: values.day };
}

function utcDate(parts) {
	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function dateParts(date) {
	return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function addDays(parts, days) {
	const date = utcDate(parts);
	date.setUTCDate(date.getUTCDate() + days);
	return dateParts(date);
}

function isoWeek(parts) {
	const date = utcDate(parts);
	const day = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - day);
	const year = date.getUTCFullYear();
	const start = new Date(Date.UTC(year, 0, 1));
	const week = Math.ceil(((date.getTime() - start.getTime()) / 86_400_000 + 1) / 7);
	return { year, week };
}

function periodId(date, kind) {
	const parts = localParts(date);
	if (kind === 'weekly') {
		const { year, week } = isoWeek(parts);
		return `${year}-W${pad(week)}`;
	}
	if (kind === 'monthly') return `${parts.year}-${pad(parts.month)}`;
	return String(parts.year);
}

function previousPeriodId(kind, now = new Date()) {
	const current = localParts(now);
	if (kind === 'weekly') {
		const day = utcDate(current).getUTCDay() || 7;
		return periodId(utcDate(addDays(current, -day)), kind);
	}
	if (kind === 'monthly') {
		const previous = new Date(Date.UTC(current.year, current.month - 2, 1));
		return `${previous.getUTCFullYear()}-${pad(previous.getUTCMonth() + 1)}`;
	}
	return String(current.year - 1);
}

function periodBounds(kind, id) {
	if (kind === 'weekly') {
		const match = /^(\d{4})-W(\d{2})$/.exec(id);
		if (!match) throw new Error(`无效的周刊编号：${id}`);
		const year = Number(match[1]);
		const week = Number(match[2]);
		const januaryFourth = new Date(Date.UTC(year, 0, 4));
		const day = januaryFourth.getUTCDay() || 7;
		januaryFourth.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7);
		const start = dateParts(januaryFourth);
		const end = addDays(start, 6);
		return {
			start: `${start.year}-${pad(start.month)}-${pad(start.day)}`,
			end: `${end.year}-${pad(end.month)}-${pad(end.day)}`,
			title: `${year} 年第 ${week} 周`,
		};
	}
	if (kind === 'monthly') {
		const [yearText, monthText] = id.split('-');
		const year = Number(yearText);
		const month = Number(monthText);
		if (!year || month < 1 || month > 12) throw new Error(`无效的月刊编号：${id}`);
		const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
		return {
			start: `${year}-${pad(month)}-01`,
			end: `${year}-${pad(month)}-${pad(lastDay)}`,
			title: `${year} 年 ${month} 月`,
		};
	}
	if (!/^\d{4}$/.test(id)) throw new Error(`无效的年刊编号：${id}`);
	return { start: `${id}-01-01`, end: `${id}-12-31`, title: `${id} 年刊` };
}

async function listContentFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listContentFiles(path)));
		else if (['.md', '.mdx'].includes(extname(entry.name))) files.push(path);
	}
	return files;
}

async function loadPosts() {
	const files = await listContentFiles(CONTENT_ROOT);
	const posts = [];
	for (const path of files) {
		const source = await readFile(path, 'utf8');
		const { data } = matter(source);
		if (data.draft === true || !data.pubDate) continue;
		const pubDate = data.pubDate instanceof Date ? data.pubDate : new Date(data.pubDate);
		if (Number.isNaN(pubDate.valueOf())) throw new Error(`${path} 的 pubDate 无法解析`);
		const id = relative(CONTENT_ROOT, path).split(sep).join('/').replace(/\.(md|mdx)$/i, '');
		posts.push({ id, data, pubDate });
	}
	return posts.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function closeIssue(kind, requestedId, force) {
	const id = requestedId ?? previousPeriodId(kind);
	const bounds = periodBounds(kind, id);
	const posts = (await loadPosts()).filter((post) => periodId(post.pubDate, kind) === id);
	if (posts.length === 0) {
		console.log(`${kind}/${id} 没有内容，不生成空刊。`);
		return false;
	}

	const directory = join(SNAPSHOT_ROOT, kind);
	const target = join(directory, `${id}.json`);
	if (!force && (await exists(target))) {
		console.log(`${kind}/${id} 已经定稿；如需覆盖，请增加 --force。`);
		return false;
	}

	const featuredIds = posts
		.filter((post) => post.data.featured)
		.sort(
			(a, b) =>
				(a.data.featuredOrder ?? 999) - (b.data.featuredOrder ?? 999) ||
				b.pubDate.valueOf() - a.pubDate.valueOf(),
		)
		.slice(0, kind === 'weekly' ? 3 : kind === 'monthly' ? 6 : 10)
		.map((post) => post.id);

	const snapshot = {
		schemaVersion: '1.0',
		id,
		kind,
		title: bounds.title,
		timezone: TIME_ZONE,
		start: bounds.start,
		end: bounds.end,
		closedAt: new Date().toISOString(),
		summary: `本期共收录 ${posts.length} 篇内容。你可以在这个文件中补充编辑摘要。`,
		itemIds: posts.map((post) => post.id),
		featuredIds,
	};

	await mkdir(directory, { recursive: true });
	await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
	console.log(`已生成 ${relative(process.cwd(), target)}，共 ${posts.length} 篇。`);
	return true;
}

const args = process.argv.slice(2).filter((argument) => argument !== '--');
const rawKind = args[0] ?? 'all';
const selectedKind = aliases.get(rawKind) ?? rawKind;
const requestedId = args.find((argument) => argument.startsWith('--id='))?.slice(5);
const force = args.includes('--force');

if (selectedKind !== 'all' && !kinds.includes(selectedKind)) {
	console.error('用法：pnpm publication:close -- weekly|monthly|yearly|all [--id=2026-W30] [--force]');
	process.exitCode = 1;
} else {
	const targets = selectedKind === 'all' ? kinds : [selectedKind];
	for (const kind of targets) await closeIssue(kind, requestedId, force);
}
