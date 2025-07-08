import { TMDB_IMAGE_BIG, TMDB_IMAGE_SMALL } from '../services/tmdbClient';
import { Collection } from './collectionModel';

const DEFAULT_MOVIE_POSTER = "https://gdlqv951tx.ufs.sh/f/C0k8wbELmJeDMbBjukx0ikxGAuhtN0IpoKq6Y8bXU5ERDZla";

export class Movie {
    id: number;
    title: string;
    posterPath: string;
    backdropPath?: string;
    overview?: string;
    releaseDate?: string;
    genres?: string[];
    cast?: Actor[];
    crew?: Crew[];
    rating?: number;
    ratingCount?: number;
    runtime?: string;
    isTvShow?: boolean;
    collectionNotes?: string;
    collectionAddTime?: number;
    collections?: Collection[];

    constructor(data: Partial<Movie>) {
        this.id = data.id ?? 0;
        this.title = data.title ?? '';
        this.posterPath = data.posterPath ?? '';
        this.backdropPath = data.backdropPath;
        this.overview = data.overview;
        this.releaseDate = data.releaseDate;
        this.genres = data.genres;
        this.cast = data.cast;
        this.crew = data.crew;
        this.rating = data.rating;
        this.ratingCount = data.ratingCount;
        this.runtime = data.runtime;
        this.isTvShow = data.isTvShow;
        this.collectionNotes = data.collectionNotes;
        this.collectionAddTime = data.collectionAddTime;
        this.collections = data.collections;
    }

    bigBackdropUrl(): string | null {
        return this.backdropPath ? TMDB_IMAGE_BIG + this.backdropPath : null;
    }

    smallBackdropUrl(): string | null{
        return this.backdropPath ? TMDB_IMAGE_SMALL + this.backdropPath : null;
    }

    bigPosterUrl(): string {
        return this.posterPath ? TMDB_IMAGE_BIG + this.posterPath : DEFAULT_MOVIE_POSTER;
    }

    smallPosterUrl(): string {
        return this.posterPath ? TMDB_IMAGE_SMALL + this.posterPath : DEFAULT_MOVIE_POSTER;
    }

    director(): Crew | undefined {
        return this.crew?.find(member => member.job === 'Director');
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