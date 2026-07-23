import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts, serializePost } from '../../../lib/publications';
import { jsonResponse } from '../../../lib/responses';

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');
	const posts = getPublishedPosts(await getCollection('blog'));
	return jsonResponse({
		schemaVersion: '1.0',
		generatedAt: new Date().toISOString(),
		itemCount: posts.length,
		items: posts.map((post) => serializePost(post, site)),
	});
};
