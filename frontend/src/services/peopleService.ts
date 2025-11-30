import { People, PeopleMovieCredit } from '../model/peopleModel';
import { Success, Error } from '../model/apiResponse';
import tmdbApiClient from './tmdbClient';
import { SearchPeopleResponse } from '../model/searchResponse';

const mTmdbApiClient = tmdbApiClient();

const transformPeopleData = (data: any): People => {
    const actingCredits = [] as PeopleMovieCredit[];
    data.movie_credits?.cast?.forEach((credit: any) => {
        actingCredits.push(new PeopleMovieCredit({
            id: credit.id,
            title: credit.title,
            character: credit.character,
            posterPath: credit.poster_path,
            releaseDate: credit.release_date,
            rating: credit.vote_average,
            ratingCount: credit.vote_count,
            isTvShow: false,
        }));
    })
    data.tv_credits?.cast?.forEach((credit: any) => {
        actingCredits.push(new PeopleMovieCredit({
            id: credit.id,
            title: credit.name,
            character: credit.character,
            posterPath: credit.poster_path,
            releaseDate: credit.first_air_date,
            rating: credit.vote_average,
            ratingCount: credit.vote_count,
            isTvShow: true,
        }));
    })
    actingCredits.sort(sortByReleaseDate);

    const crewCredits = [] as PeopleMovieCredit[];
    data.movie_credits?.crew?.forEach((credit: any) => {
        crewCredits.push(new PeopleMovieCredit({
            id: credit.id,
            title: credit.title,
            character: credit.job,
            posterPath: credit.poster_path,
            releaseDate: credit.release_date,
            rating: credit.vote_average,
            ratingCount: credit.vote_count,
            isTvShow: false,
        }));
    })
    data.tv_credits?.crew?.forEach((credit: any) => {
        crewCredits.push(new PeopleMovieCredit({
            id: credit.id,
            title: credit.name,
            character: credit.job,
            posterPath: credit.poster_path,
            releaseDate: credit.first_air_date,
            rating: credit.vote_average,
            ratingCount: credit.vote_count,
            isTvShow: true,
        }));
    })
    crewCredits.sort(sortByReleaseDate);

    const people = new People({
        id: data.id,
        name: data.name,
        photoPath: data.profile_path,
        biography: data.biography,
        birthday: data.birthday,
        placeOfBirth: data.place_of_birth,
        knownForDepartment: data.known_for_department,
        gender: data.gender,
        actingCredits: actingCredits,
        crewCredits: crewCredits,

    })

    return people;
}

const sortByReleaseDate = (a: PeopleMovieCredit, b: PeopleMovieCredit): number => {
    const MAX_DATE = 8640000000000000;
    const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(MAX_DATE);
    const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(MAX_DATE);
    return dateB.getTime() - dateA.getTime();
}

export const fetchPeopleDetails = async (peopleId: string): Promise<Success<People> | Error> => {
    try {
        const params = {
            append_to_response: 'movie_credits,tv_credits'
        }
        const response = await mTmdbApiClient.get(`person/${peopleId}`, { params });
        const people = transformPeopleData(response.data);
        return new Success<People>(people);
    } catch (error: any) {
        console.error('Error fetching people data:', error);
        return new Error('Failed to fetch people details.', error.response?.status);
    }
};


export const searchPeople = async (query: string, page: number, includeAdult?: boolean): Promise<Success<SearchPeopleResponse> | Error> => {
    try {
        const params = {
            query,
            page,
            append_to_response: 'movie_credits,tv_credits'
        }
        const response = await mTmdbApiClient.get(`search/person`, { params });
        const people = response.data.results.map((data: any) => transformPeopleData(data));
        return new Success<SearchPeopleResponse>(new SearchPeopleResponse(people, response.data.total_pages));
    } catch (error: any) {
        console.error('Error searching people:', error);
        return new Error('Failed to search people.', error.response?.status);
    }
  };