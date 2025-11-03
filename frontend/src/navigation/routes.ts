export const routes = {
    home: '/',
    collections: '/collections',
    profile: '/profile',
    search: '/search',
    login: '/login',
    
    movie: (id: number, isTvShow?: boolean) => 
      `/movie/${id}${isTvShow ? '?is_tv_show=true' : ''}`,
    
    collection: (id: string) => 
        `/collection/${id}`,
    
    addToCollection: (movieId: number, isTvShow?: boolean) => 
        `/collection/add?movie_id=${movieId}${isTvShow ? '&is_tv_show=true' : ''}`,

    explore: (sectionType: string) => 
        `/explore?section_type=${encodeURIComponent(sectionType)}`,
};