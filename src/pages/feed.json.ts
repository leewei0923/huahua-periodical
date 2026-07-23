import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPublishedPosts, serializePost } from '../lib/publications';
import { jsonResponse } from '../lib/responses';

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');
	const posts = getPublishedPosts(await getCollection('blog'));
	return jsonResponse({
		version: 'https://jsonfeed.org/version/1.1',
		title: SITE_TITLE,
		home_page_url: site.href,
		feed_url: new URL('/feed.json', site).href,
		description: SITE_DESCRIPTION,
		language: 'zh-CN',
		items: posts.map((post) => {
			const item = serializePost(post, site);
			return {
				id: item.id,
				url: item.url,
				title: item.title,
				summary: item.description,
				image: item.image,
				date_published: item.publishedAt,
				date_modified: item.updatedAt ?? undefined,
				tags: item.tags,
				language: item.lang,
			};
		}),
	});
};
