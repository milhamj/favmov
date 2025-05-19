import { TMDB_IMAGE_BIG, TMDB_IMAGE_SMALL } from '../utils/apiUtil';

export class Movie {
    id: number;
    title: string;
    posterPath: string;
    overview?: string;
    releaseDate?: string;
    genres?: string[];
    cast?: Actor[];
    rating?: number;
    ratingCount?: number;
    runtime?: string;
    isTvShow?: boolean;

    constructor(id: number, title: string, posterPath: string) {
        this.id = id;
        this.title = title;
        this.posterPath = posterPath;
    }

    bigPosterUrl(): string {
        return TMDB_IMAGE_BIG + this.posterPath;
    }

    smallPosterUrl(): string {
        return TMDB_IMAGE_SMALL + this.posterPath;
    }
}

export interface Actor {
    photoUrl: string;
    name: string;
    character: string;  
}