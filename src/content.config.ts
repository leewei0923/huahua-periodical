import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import config from '../config.json';

const contentType = z.enum(['essay', 'note', 'photo', 'link', 'audio']);
const language = z.enum(['zh-CN', 'zh-TW', 'en-US']);
const contentStatus = z.enum(['draft', 'published', 'archived']);

z.record(
	contentType,
	z.object({
		label: z.string().min(1),
		labelEn: z.string().min(1),
	}),
).parse(config.content.types);

const defaults = {
	contentType: contentType.parse(config.content.defaults.contentType),
	language: language.parse(config.content.defaults.language),
	status: contentStatus.parse(config.content.defaults.status),
	author: z.string().min(1).parse(config.content.defaults.author),
	topics: z.array(z.string().min(1)).parse(config.content.defaults.topics),
};

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: () =>
		z.object({
			title: z.string().min(1),
			description: z.string().min(1),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			language: language.default(defaults.language),
			contentType: contentType.default(defaults.contentType),
			status: contentStatus.default(defaults.status),
			author: z.string().min(1).default(defaults.author),
			topics: z.array(z.string().min(1)).default(defaults.topics),
			translationKey: z.string().optional(),
			issueOverride: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
			featured: z.boolean().default(false),
			featuredOrder: z.number().int().positive().optional(),
			evergreen: z.boolean().default(false),
			evergreenOrder: z.number().int().positive().optional(),
			heroImage: z.object({
				src: z.string().url(),
				width: z.number().int().positive().optional(),
				height: z.number().int().positive().optional(),
				alt: z.string(),
			}).refine(
				(image) => (image.width === undefined) === (image.height === undefined),
				{ message: 'heroImage 的 width 和 height 必须同时填写，或同时省略。' },
			).optional(),
			audio: z.object({
				src: z.string(),
				subtitle: z.string().optional(),
			}).optional(),
		}),
});

export const collections = { blog };
