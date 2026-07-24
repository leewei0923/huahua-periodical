import type { APIRoute } from 'astro';
import { jsonResponse } from '../../../lib/responses';

export const GET: APIRoute = () =>
	jsonResponse({
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$id: '/data/v1/schema.json',
		title: '花花有期开放数据',
		type: 'object',
		description: 'items.json 中单条内容的数据结构。',
		required: ['id', 'url', 'title', 'description', 'publishedAt', 'lang', 'type', 'tags', 'periods'],
		properties: {
			id: { type: 'string' },
			url: { type: 'string', format: 'uri' },
			title: { type: 'string' },
			description: { type: 'string' },
			publishedAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: ['string', 'null'], format: 'date-time' },
			lang: { enum: ['zh', 'en'] },
			type: { enum: ['essay', 'note', 'photo', 'link'] },
			tags: { type: 'array', items: { type: 'string' } },
			image: { type: ['string', 'null'], format: 'uri' },
			featured: { type: 'boolean' },
			featuredOrder: { type: ['integer', 'null'], minimum: 1 },
			evergreen: { type: 'boolean' },
			evergreenOrder: { type: ['integer', 'null'], minimum: 1 },
			periods: {
				type: 'object',
				required: ['week', 'month', 'year'],
				properties: {
					week: { type: 'string', pattern: '^\\d{4}-W\\d{2}$' },
					month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
					year: { type: 'string', pattern: '^\\d{4}$' },
				},
			},
		},
	});
