import { TMDB_IMAGE_SMALL } from "../services/tmdbClient";
import { DEFAULT_MOVIE_POSTER } from "./movieModel";

export class People {
    id: number;
    name: string;
    photoPath: string;
    biography?: string;
    birthday?: string;
    placeOfBirth?: string;
    knownForDepartment?: string;
    gender?: number;
    credits?: PeopleMovieCredit[];

    constructor(data: Partial<People>) {
        this.id = data.id ?? 0;
        this.name = data.name ?? '';
        this.photoPath = data.photoPath ?? '';
        this.biography = data.biography;
        this.birthday = data.birthday;
        this.placeOfBirth = data.placeOfBirth;
        this.knownForDepartment = data.knownForDepartment;
        this.gender = data.gender;
        this.credits = data.credits;
    }

    photoUrl(): string {
        // TODO milhamj: change default photo url
        return this.photoPath ? TMDB_IMAGE_SMALL + this.photoPath : DEFAULT_MOVIE_POSTER;
    }

    genderText(): string {
        switch(this.gender) {
            case 1: return "Female";
            case 2: return "Male";
            case 3: return "Non-binary";
            default: return "Unspecified";
        }
    }
}

export class PeopleMovieCredit {
    id: number;
    title: string;
    character?: string;
    posterPath?: string;
    releaseDate?: string;
    episodeCount?: number;
    rating?: number;
    ratingCount?: number;

    constructor(data: Partial<PeopleMovieCredit>) {
        this.id = data.id ?? 0;
        this.title = data.title ?? '';
        this.character = data.character;
        this.posterPath = data.posterPath;
        this.releaseDate = data.releaseDate;
        this.episodeCount = data.episodeCount;
        this.rating = data.rating;
        this.ratingCount = data.ratingCount;
    }

    posterUrl(): string | undefined {
        return this.posterPath ? TMDB_IMAGE_SMALL + this.posterPath : DEFAULT_MOVIE_POSTER;
    }
}