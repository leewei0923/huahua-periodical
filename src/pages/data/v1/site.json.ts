import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../../consts';
import { currentPublicationState } from '../../../lib/publications';
import { jsonResponse } from '../../../lib/responses';

export const GET: APIRoute = ({ site }) => {
	if (!site) throw new Error('请在 astro.config.mjs 中配置 site');
	const current = currentPublicationState();
	return jsonResponse({
		schemaVersion: '1.0',
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		url: site.href,
		generatedAt: new Date().toISOString(),
		timezone: current.timezone,
		current: {
			weekly: current.weekly.id,
			monthly: current.monthly.id,
			yearly: current.yearly.id,
		},
		links: {
			items: new URL('/data/v1/items.json', site).href,
			weeklyIssues: new URL('/data/v1/issues/weekly/index.json', site).href,
			monthlyIssues: new URL('/data/v1/issues/monthly/index.json', site).href,
			yearlyIssues: new URL('/data/v1/issues/yearly/index.json', site).href,
			schema: new URL('/data/v1/schema.json', site).href,
			rss: new URL('/rss.xml', site).href,
			weeklyRss: new URL('/weekly/rss.xml', site).href,
			jsonFeed: new URL('/feed.json', site).href,
		},
	});
};
