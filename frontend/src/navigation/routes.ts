export const routes = {
    profile: '/profile',
    image: (url: string, preview?: string) =>
        `/image?url=${encodeURIComponent(url)}${preview && preview !== url ? `&preview=${encodeURIComponent(preview)}` : ''}`,
    search: '/search',
    loginWithReturnTo: (path: string) => `/login?return_to=${encodeURIComponent(safeReturnTo(path))}`,
    
    movie: (id: number, isTvShow?: boolean) => 
      `/movie/${id}${isTvShow ? '?is_tv_show=true' : ''}`,
    
    collection: (id: string) => 
        `/collection/${id}`,
    
    addToCollection: (movieId: number, isTvShow?: boolean) => 
        `/collection/add?movie_id=${movieId}${isTvShow ? '&is_tv_show=true' : ''}`,

    explore: (sectionType: string) => 
        `/explore?section_type=${encodeURIComponent(sectionType)}`,

    people: (id: string) => 
        `/people/${encodeURIComponent(id)}`,
};

export function safeImageUrl(value: unknown): string | null {
    return typeof value === 'string' && /^https:\/\/(?:image\.tmdb\.org|gdlqv951tx\.ufs\.sh)\//.test(value) ? value : null;
}

export function safeReturnTo(value: unknown): string {
    if (typeof value !== 'string' || /[\\\s#]/.test(value)) return '/';
    const path = value.split('?')[0];
    return /^(?:\/|\/(?:collection|profile)|\/movie\/\d+|\/collection\/[A-Za-z0-9_-]+)$/.test(path) ? value : '/';
}

export function routeWithParams(pathname: string, params: Record<string, string | string[]>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        // shortcut: assumes the only dynamic segment is `id`, pass the route's real params if a protected route adds another.
        if (key === 'id' || value === undefined) continue;
        for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
    }
    const suffix = query.toString();
    return pathname + (suffix ? '?' + suffix : '');
}
