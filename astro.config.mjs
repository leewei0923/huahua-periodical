// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL ?? 'https://huahua.7miaoyu.com',
	integrations: [mdx(), sitemap()],
	vite: {
		ssr: {
			external: ['picomatch'],
		},
	},
});
