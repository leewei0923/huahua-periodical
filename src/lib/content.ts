import config from '../../config.json';

export type ContentType = keyof typeof config.content.types;

export function getContentTypeLabel(type: ContentType, language: 'zh' | 'en' = 'zh'): string {
	const labels = config.content.types[type];
	return language === 'en' ? labels.labelEn : labels.label;
}
