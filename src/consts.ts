import config from '../config.json';

export const SITE_TITLE = config.site.title;
export const SITE_DESCRIPTION = config.site.description;
export const PUBLICATION_TIME_ZONE = config.publication.timeZone;
export const SUBMISSION_EMAIL =
	import.meta.env.PUBLIC_SUBMISSION_EMAIL?.trim() || config.submission.email;
