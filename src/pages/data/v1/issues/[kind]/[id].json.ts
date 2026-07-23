import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import type { PeriodKind } from '../../../../../lib/periods';
import { getPeriodEntries, serializeIssue } from '../../../../../lib/publications';
import { jsonResponse } from '../../../../../lib/responses';

const kinds: PeriodKind[] = ['weekly', 'monthly', 'yearly'];

export const getStaticPaths = (async () => {
	const posts = await getCollection('blog');
	return kinds.flatMap((kind) =>
		getPeriodEntries(posts, kind).map((period) => ({ params: { kind, id: period.id } })),
	);
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');
	const kind = params.kind as PeriodKind;
	const id = params.id;
	if (!id || !kinds.includes(kind)) return new Response('Not found', { status: 404 });
	return jsonResponse(serializeIssue(await getCollection('blog'), kind, id, site));
};
