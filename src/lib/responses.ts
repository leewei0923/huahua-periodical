export function jsonResponse(data: unknown): Response {
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
		},
	});
}
