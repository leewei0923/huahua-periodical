export interface QiniuImageInfo {
	width: number;
	height: number;
	format: string;
	size: number;
}

const imageInfoCache = new Map<string, Promise<QiniuImageInfo>>();
const imageInfoReferer = `${import.meta.env.SITE_URL ?? 'https://huahua.7miaoyu.com'}/`;

export function getQiniuImageInfo(src: string): Promise<QiniuImageInfo> {
	const cached = imageInfoCache.get(src);
	if (cached) return cached;

	const request = fetch(`${src}?imageInfo`, {
		headers: {
			Referer: imageInfoReferer,
		},
	})
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`七牛 imageInfo 请求失败：${response.status} ${src}`);
			}

			const info = await response.json() as Partial<QiniuImageInfo>;
			if (
				!Number.isInteger(info.width) ||
				!Number.isInteger(info.height) ||
				Number(info.width) <= 0 ||
				Number(info.height) <= 0
			) {
				throw new Error(`七牛 imageInfo 未返回有效尺寸：${src}`);
			}

			return {
				width: Number(info.width),
				height: Number(info.height),
				format: String(info.format ?? ''),
				size: Number(info.size ?? 0),
			};
		})
		.catch((error) => {
			imageInfoCache.delete(src);
			throw error;
		});

	imageInfoCache.set(src, request);
	return request;
}
