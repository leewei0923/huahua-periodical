import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';
import { getPeriodId } from '../../lib/periods';
import { getPeriodEntries } from '../../lib/publications';

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');
	const posts = await getCollection('blog');
	const periods = getPeriodEntries(posts, 'weekly').filter((period) => period.count > 0);
	return rss({
		title: `${SITE_TITLE} · 周刊`,
		description: `${SITE_DESCRIPTION} 每周自动装订。`,
		site,
		items: periods.map((period) => ({
			title: period.title,
			description: `收录 ${period.count} 篇内容，刊期 ${period.start} 至 ${period.end}。`,
			link: `/weekly/${period.id}/`,
			pubDate:
				posts
					.filter((post) => post.data.pubDate && post.data.pubDate <= new Date())
					.filter((post) => getPeriodId(post.data.pubDate, 'weekly') === period.id)
					.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())[0]?.data.pubDate ??
				new Date(`${period.end}T23:59:59+08:00`),
			customData: `<guid>${period.id}</guid>`,
		})),
	});
};
