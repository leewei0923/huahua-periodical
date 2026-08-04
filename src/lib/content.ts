import config from '../../config.json';

export type ContentType = keyof typeof config.content.types;

export function getContentTypeLabel(type: ContentType, language: 'zh' | 'en' = 'zh'): string {
	const labels = config.content.types[type];
	return language === 'en' ? labels.labelEn : labels.label;
}

/** Estimate reading time from raw article body: ~400 CJK chars/min, ~200 latin words/min. */
export function estimateReadingMinutes(body: string): number {
	const cjkCount = (body.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g) ?? []).length;
	const latinWords = (
		body.replace(/[\u3400-\u4dbf\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []
	).length;
	return Math.max(1, Math.ceil(cjkCount / 400 + latinWords / 200));
}
