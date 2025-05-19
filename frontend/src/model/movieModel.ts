export interface Movie {
    id: number;
    title: string;
    posterUrl: string;
    overview?: string;
    releaseDate?: string;
    genres?: string[];
    cast?: Actor[];
    rating?: number;
    ratingCount?: number;
    runtime?: string;
}

export interface Actor {
    photoUrl: string;
    name: string;
    character: string;  
}