import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts, serializePost } from '../../../../lib/publications';
import { jsonResponse } from '../../../../lib/responses';

export const GET: APIRoute = async ({ params, site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');

	const { id } = params;
	if (!id) {
		return jsonResponse(
			{ error: '缺少文章 ID' },
			{ status: 400 }
		);
	}

	const posts = getPublishedPosts(await getCollection('blog'));
	const post = posts.find((p) => p.id === id);

	if (!post) {
		return jsonResponse(
			{ error: '文章不存在或未发布' },
			{ status: 404 }
		);
	}

	return jsonResponse({
		schemaVersion: '1.0',
		generatedAt: new Date().toISOString(),
		item: {
			...serializePost(post, site),
			body: post.body,
		},
	});
};

export const getStaticPaths = async () => {
	const { getCollection } = await import('astro:content');
	const { getPublishedPosts } = await import('../../../../lib/publications');
	const posts = getPublishedPosts(await getCollection('blog'));

	return posts.map((post) => ({
		params: { id: post.id },
	}));
};
