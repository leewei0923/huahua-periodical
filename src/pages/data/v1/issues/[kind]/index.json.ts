import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { kindLabel, type PeriodKind } from '../../../../../lib/periods';
import { getPeriodEntries } from '../../../../../lib/publications';
import { jsonResponse } from '../../../../../lib/responses';

const kinds: PeriodKind[] = ['weekly', 'monthly', 'yearly'];

export const getStaticPaths = (() => kinds.map((kind) => ({ params: { kind } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');
	const kind = params.kind as PeriodKind;
	if (!kinds.includes(kind)) return new Response('Not found', { status: 404 });
	const periods = getPeriodEntries(await getCollection('blog'), kind);
	const label = kindLabel(kind);
	return jsonResponse({
		schemaVersion: '1.0',
		kind,
		title: `${label.zh}归档`,
		issueCount: periods.length,
		issues: periods.map((period) => ({
			id: period.id,
			title: period.title,
			start: period.start,
			end: period.end,
			itemCount: period.count,
			featuredIds: period.featuredIds,
			closed: period.closed,
			url: new URL(`/${kind}/${period.id}/`, site).href,
			jsonUrl: new URL(`/data/v1/issues/${kind}/${period.id}.json`, site).href,
		})),
	});
};
