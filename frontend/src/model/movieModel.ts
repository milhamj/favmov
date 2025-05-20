import { TMDB_IMAGE_BIG, TMDB_IMAGE_SMALL } from '../utils/apiUtil';

export class Movie {
    id: number;
    title: string;
    posterPath: string;
    overview?: string;
    releaseDate?: string;
    genres?: string[];
    cast?: Actor[];
    crew?: Crew[];
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

export class Actor {
    id: number;
    name: string;
    photoUrl: string;
    character: string;  

    constructor(id: number, name: string, photoPath: string, character: string) {
        this.id = id;
        this.name = name;
        this.photoUrl = TMDB_IMAGE_SMALL + photoPath;
        this.character = character;
    }
}

export class Crew {
    id: number;
    name: string;
    photoUrl: string;
    job: string;  

    constructor(id: number, name: string, photoPath: string, job: string) {
        this.id = id;
        this.name = name;
        this.photoUrl = TMDB_IMAGE_SMALL + photoPath;
        this.job = job;
    }
}