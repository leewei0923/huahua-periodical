import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			lang: z.enum(['zh', 'en']).default('zh'),
			type: z.enum(['essay', 'note', 'photo', 'link']).default('essay'),
			translationKey: z.string().optional(),
			tags: z.array(z.string()).default([]),
			issue: z.string().optional(),
			draft: z.boolean().default(false),
			featured: z.boolean().default(false),
			featuredOrder: z.number().int().positive().optional(),
			evergreen: z.boolean().default(false),
			evergreenOrder: z.number().int().positive().optional(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

export const collections = { blog };
