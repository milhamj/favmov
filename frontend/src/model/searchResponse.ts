import { Movie } from "./movieModel";

export class SearchResponse {
    movies: Movie[];
    totalPages: number;

    constructor(movies: Movie[], totalPages: number) {
        this.movies = movies;
        this.totalPages = totalPages;
    }
}