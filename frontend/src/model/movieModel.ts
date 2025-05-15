export interface Movie {
    id: number;
    title: string;
    posterUrl: string;
    overview?: string;
    releaseDate?: string;
    genres?: string[];
}