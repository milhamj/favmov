import { Movie } from "../model/movieModel";

const movieCache = new Map<string, Movie>();

const getFinalId = (id: string, isTvShow: boolean = false) => {
    return isTvShow ? `${id}_tv` : id;
}

export const MovieStore = {
    cacheMovie(movie: Movie) {
        const id = getFinalId(movie.id.toString(), movie.isTvShow);
        movieCache.set(id, movie);
    },
    getCachedMovie(
        id: number, 
        isTvShow: boolean = false, 
        clearCache: boolean = true
    ): Movie | undefined {
        let idStr = getFinalId(id.toString(), isTvShow);
        const movie = movieCache.get(idStr);
        if (clearCache && movie) {
            movieCache.delete(idStr);
        }
        return movie;
    }
}