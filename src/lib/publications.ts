import type { CollectionEntry } from 'astro:content';
import { PUBLICATION_TIME_ZONE } from '../consts';
import {
	getCurrentPeriod,
	getPeriodId,
	getPeriodInfo,
	type PeriodInfo,
	type PeriodKind,
} from './periods';

export type BlogPost = CollectionEntry<'blog'>;

export interface IssueSnapshot {
	schemaVersion: '1.0';
	id: string;
	kind: PeriodKind;
	title: string;
	timezone: string;
	start: string;
	end: string;
	closedAt: string;
	summary: string;
	itemIds: string[];
	featuredIds: string[];
}

export interface PeriodEntry extends PeriodInfo {
	count: number;
	featuredIds: string[];
	closed: boolean;
}

const snapshotModules = import.meta.glob<{ default: IssueSnapshot }>('../data/issues/**/*.json', {
	eager: true,
});

const snapshots = Object.values(snapshotModules).map((module) => module.default);

function getPostPeriodId(post: BlogPost, kind: PeriodKind): string {
	if (kind === 'weekly' && post.data.issueOverride) return post.data.issueOverride;
	return getPeriodId(post.data.pubDate, kind);
}

export function getPublishedPosts(posts: BlogPost[], now = new Date()): BlogPost[] {
	return posts
		.filter((post) => post.data.status === 'published' && post.data.pubDate.valueOf() <= now.valueOf())
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getSnapshot(kind: PeriodKind, id: string): IssueSnapshot | undefined {
	return snapshots.find((snapshot) => snapshot.kind === kind && snapshot.id === id);
}

export function getIssuePosts(posts: BlogPost[], kind: PeriodKind, id: string): BlogPost[] {
	const published = getPublishedPosts(posts);
	const snapshot = getSnapshot(kind, id);
	if (snapshot) {
		const order = new Map(snapshot.itemIds.map((itemId, index) => [itemId, index]));
		return published
			.filter((post) => order.has(post.id))
			.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
	}
	return published.filter((post) => getPostPeriodId(post, kind) === id);
}

export function getFeaturedPosts(
	posts: BlogPost[],
	options: { limit?: number; exclude?: string[]; snapshot?: IssueSnapshot } = {},
): BlogPost[] {
	const { limit = 3, exclude = [], snapshot } = options;
	const excluded = new Set(exclude);
	const featuredOrder = snapshot?.featuredIds
		? new Map(snapshot.featuredIds.map((id, index) => [id, index]))
		: undefined;

	return posts
		.filter((post) => !excluded.has(post.id) && (featuredOrder?.has(post.id) || post.data.featured))
		.sort((a, b) => {
			if (featuredOrder) return (featuredOrder.get(a.id) ?? 999) - (featuredOrder.get(b.id) ?? 999);
			return (
				(a.data.featuredOrder ?? 999) - (b.data.featuredOrder ?? 999) ||
				b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
			);
		})
		.slice(0, limit);
}

export function getEvergreenPosts(posts: BlogPost[]): BlogPost[] {
	return getPublishedPosts(posts)
		.filter((post) => post.data.evergreen)
		.sort(
			(a, b) =>
				(a.data.evergreenOrder ?? 999) - (b.data.evergreenOrder ?? 999) ||
				b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
		);
}

export function getPeriodEntries(posts: BlogPost[], kind: PeriodKind): PeriodEntry[] {
	const published = getPublishedPosts(posts);
	const ids = new Set(published.map((post) => getPostPeriodId(post, kind)));
	const currentId = getCurrentPeriod(kind).id;
	ids.add(currentId);
	for (const snapshot of snapshots) {
		if (snapshot.kind === kind) ids.add(snapshot.id);
	}

	return [...ids]
		.sort((a, b) => b.localeCompare(a))
		.map((id) => {
			const issuePosts = getIssuePosts(published, kind, id);
			const snapshot = getSnapshot(kind, id);
			return {
				...getPeriodInfo(kind, id),
				count: issuePosts.length,
				featuredIds: snapshot?.featuredIds ?? getFeaturedPosts(issuePosts).map((post) => post.id),
				closed: Boolean(snapshot),
			};
		})
		.filter((period) => period.count > 0 || period.id === currentId);
}

export function getCurrentIssuePosts(posts: BlogPost[], kind: PeriodKind, now = new Date()): BlogPost[] {
	const period = getCurrentPeriod(kind, now);
	return getPublishedPosts(posts, now).filter((post) => getPostPeriodId(post, kind) === period.id);
}

export function serializePost(post: BlogPost, site: URL) {
	const image = post.data.heroImage?.src ? new URL(post.data.heroImage.src, site).href : null;
	return {
		id: post.id,
		url: new URL(`/blog/${post.id}/`, site).href,
		title: post.data.title,
		description: post.data.description,
		publishedAt: post.data.pubDate.toISOString(),
		updatedAt: post.data.updatedDate?.toISOString() ?? null,
		// Keep the v1 wire format stable while frontmatter uses clearer field names.
		lang: post.data.language.startsWith('en') ? 'en' : 'zh',
		type: post.data.contentType,
		tags: post.data.topics,
		image,
		featured: post.data.featured,
		featuredOrder: post.data.featuredOrder ?? null,
		evergreen: post.data.evergreen,
		evergreenOrder: post.data.evergreenOrder ?? null,
		periods: {
			week: getPeriodId(post.data.pubDate, 'weekly'),
			month: getPeriodId(post.data.pubDate, 'monthly'),
			year: getPeriodId(post.data.pubDate, 'yearly'),
		},
	};
}

export function serializeIssue(posts: BlogPost[], kind: PeriodKind, id: string, site: URL) {
	const period = getPeriodInfo(kind, id);
	const snapshot = getSnapshot(kind, id);
	const issuePosts = getIssuePosts(posts, kind, id);
	const featured = getFeaturedPosts(issuePosts, { snapshot });
	return {
		schemaVersion: '1.0',
		id,
		kind,
		title: snapshot?.title ?? period.title,
		timezone: PUBLICATION_TIME_ZONE,
		period: { start: period.start, end: period.end },
		closed: Boolean(snapshot),
		closedAt: snapshot?.closedAt ?? null,
		summary: snapshot?.summary ?? `本期共收录 ${issuePosts.length} 篇内容。`,
		url: new URL(`/${kind}/${id}/`, site).href,
		featuredIds: featured.map((post) => post.id),
		itemCount: issuePosts.length,
		items: issuePosts.map((post) => serializePost(post, site)),
	};
}

export function currentPublicationState(now = new Date()) {
	return {
		timezone: PUBLICATION_TIME_ZONE,
		weekly: getCurrentPeriod('weekly', now),
		monthly: getCurrentPeriod('monthly', now),
		yearly: getCurrentPeriod('yearly', now),
	};
}
