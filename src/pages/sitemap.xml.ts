import { getCollection } from 'astro:content';
import { getPeriodEntries } from '../lib/publications';
import { getPublishedPosts } from '../lib/publications';

const CHANGEFREQ: Record<string, string> = {
	'/': 'weekly',
	'/blog/': 'weekly',
	'/weekly/': 'weekly',
	'/monthly/': 'monthly',
	'/yearly/': 'yearly',
	'/picks/': 'weekly',
	'/about/': 'monthly',
	'/submit/': 'monthly',
};

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function urlEntry(site: URL, path: string, lastmod?: Date | string, priority = '0.7', changefreq?: string): string {
	const loc = new URL(path, site).href;
	const modified = lastmod instanceof Date ? lastmod.toISOString() : lastmod;
	return [
		'  <url>',
		`    <loc>${xmlEscape(loc)}</loc>`,
		modified ? `    <lastmod>${xmlEscape(modified)}</lastmod>` : '',
		changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
		`    <priority>${priority}</priority>`,
		'  </url>',
	].filter(Boolean).join('\n');
}

export async function GET({ site }: { site: URL }) {
	const posts = getPublishedPosts(await getCollection('blog'));
	const latestPostDate = posts[0]?.data.updatedDate ?? posts[0]?.data.pubDate ?? new Date();
	const urls: string[] = [];

	for (const [path, changefreq] of Object.entries(CHANGEFREQ)) {
		const priority = path === '/' ? '1.0' : path === '/blog/' ? '0.9' : '0.7';
		urls.push(urlEntry(site, path, latestPostDate, priority, changefreq));
	}

	for (const post of posts) {
		urls.push(urlEntry(site, `/blog/${post.id}/`, post.data.updatedDate ?? post.data.pubDate, '0.8', 'monthly'));
	}

	for (const kind of ['weekly', 'monthly', 'yearly'] as const) {
		for (const period of getPeriodEntries(posts, kind)) {
			urls.push(urlEntry(site, `/${kind}/${period.id}/`, period.end, '0.6', kind === 'weekly' ? 'weekly' : 'monthly'));
		}
	}

	return new Response(
		[
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			...urls,
			'</urlset>',
		].join('\n'),
		{
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
			},
		},
	);
}
