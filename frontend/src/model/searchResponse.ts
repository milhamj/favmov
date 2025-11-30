import { Movie } from "./movieModel";
import { People } from "./peopleModel";

export class SearchMovieResponse {
    movies: Movie[];
    totalPages: number;

    constructor(movies: Movie[], totalPages: number) {
        this.movies = movies;
        this.totalPages = totalPages;
    }
}

export class SearchPeopleResponse {
    people: People[];
    totalPages: number;

    constructor(people: People[], totalPages: number) {
        this.people = people;
        this.totalPages = totalPages;
    }
}