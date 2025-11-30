import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Platform, TextInput, FlatList, Image, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import PageContainer  from '../components/PageContainer';
import { Movie } from '../model/movieModel';
import { searchMovie } from '../services/movieService';
import { Success } from '../model/apiResponse';
import TopBar from '../components/TopBar';
import MovieCard from '../components/MovieCard';
import SelectableChip from '../components/SelectableChip';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';
import { MovieStore } from '../stores/movieStore';
import FullPageLoader from '../components/FullPageLoader';
import { People } from '../model/peopleModel';
import PeopleCardHorizontal from '../components/PeopleCardHorizontal';
import { searchPeople } from '../services/peopleService';

const CHIP_MOVIE = 'Movie';
const CHIP_TV_SHOW = 'TV Show';
const CHIP_PEOPLE = 'People';

const SelectableChips = [CHIP_MOVIE, CHIP_TV_SHOW, CHIP_PEOPLE];

const SearchPage = () => {
    const [searchQuery, setSearchQuery]  = useState('');
    const [movies, setMovies] = useState([] as Movie[]);
    const [people, setPeople] = useState([] as People[]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilter, setShowFilter] = useState(true);
    const [selectedChip, setSelectedChip] = useState(CHIP_MOVIE);
    const page = useRef(1);
    const inputRef = useRef<TextInput>(null);
    const isFetchingRef = useRef(false);

    const isMovielected = selectedChip === CHIP_MOVIE;
    const isTvShowSelected = selectedChip === CHIP_TV_SHOW;
    const isPeopleSelected = selectedChip === CHIP_PEOPLE;

    // Auto-focus input
    useEffect(() => {
        const focusTimeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        
        return () => clearTimeout(focusTimeout);
    }, []);

    // Fetch movies when searchQuery, selectedFilter, or page changes
    const fetchSearchResult = useCallback(async (newPage: number = 1, reset: boolean = false) => {
        if (isFetchingRef.current || !searchQuery) return;
    
        isFetchingRef.current = true;
        setIsLoading(newPage === 1);
        setIsLoadingMore(newPage > 1);
    
        try {
            if (isMovielected || isTvShowSelected) {
                const result = await searchMovie(searchQuery, newPage, isTvShowSelected);
                if (result instanceof Success) {
                    setMovies((prev) => (newPage === 1 || reset ? result.data.movies : [...prev, ...result.data.movies]));
                    setTotalPages(result.data.totalPages || 1);
                }
            } else if (isPeopleSelected) {
                const result = await searchPeople(searchQuery, newPage);
                if (result instanceof Success) {
                    setPeople((prev) => (newPage === 1 || reset ? result.data.people : [...prev, ...result.data.people]));
                    setTotalPages(result.data.totalPages || 1);
                }
            }
        } catch (error) {
            //TODO milhamj: update error handling and also remove the try-catch
            console.error('Error fetching search result:', error);
        } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
          setShowFilter(true);
          isFetchingRef.current = false;
        }
      }, [searchQuery, selectedChip]
    );

    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            if (searchQuery) {
                page.current = 1; // Reset to first page on new search or filter
                fetchSearchResult(page.current, true);
            }

            // Clear previous result
            if (movies.length > 0) {
                setMovies([]);
            }
            if (people.length > 0) {
                setPeople([]);
            }
        }, 300);

        return () => clearTimeout(debounceFetch);
    }, [searchQuery, selectedChip, fetchSearchResult]);

    const handleOnEndReached = () => {
        if (!isFetchingRef.current && page.current < totalPages && !isLoadingMore) {
            page.current += 1;
            fetchSearchResult(page.current);
        }
    };    

    const renderMovieItem = ({ item, index }: { item: Movie, index: number }) => (
        <View style={{
            width: '48%', 
            marginRight: index % 2 === 0 ? 16 : 0,
            marginBottom: 16, 
            alignContent: 'center'
        }}>
            <MovieCard 
                movie={item}
                onClick={() => { 
                    MovieStore.cacheMovie(item);
                    router.navigate(routes.movie(item.id, item.isTvShow))
                }}
            />
        </View>
    );

    const renderPeopleItem = ({ item, index }: { item: People, index: number }) => (
        <View style={{
            width: '100%',
            marginBottom: 8, 
            alignContent: 'center'
        }}>
            <PeopleCardHorizontal 
                people={item}
                onClick={() => { 
                    router.navigate(routes.people(item.id.toString()))
                }}
            />
        </View>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
        <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="tomato" />
        </View>
        );
    };

    const isEmptyResult = searchQuery.length > 0 && !isLoading && movies.length === 0 && people.length === 0;
    const isEmptyQuery = searchQuery.length === 0;
    const placeholderText = isPeopleSelected 
        ? "Type any name..." 
        : isTvShowSelected 
        ? "Type any TV Show title..." 
        : "Type any Movie title..."

    return (
        <PageContainer>
            <TopBar
                title= 'Search'
                backButton={{
                isShow: true,
                onClick: () => router.goBackSafely()
                }}
            />
            <TextInput 
                ref={inputRef}
                style={styles.searchBox}
                placeholder={placeholderText}
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={(newQuery) => {
                    setSearchQuery(newQuery);
                    setMovies([]);
                    setShowFilter(newQuery ? false : true);
                }}
                autoFocus={Platform.OS === 'web'}
            />
            {
                showFilter ? (
                    <View style={{flexDirection: 'row', marginBottom: 8, marginHorizontal: 16}}>
                        {
                            SelectableChips.map((chip) => (
                                <SelectableChip 
                                    text={chip}
                                    key={chip}
                                    selected={selectedChip === chip}
                                    onSelect={(isSelected) => {
                                        if (isSelected) setSelectedChip(chip)}
                                    } 
                                />
                            ))
                        }
                    </View>
                ) : null
            }
            <View style={styles.scrollContainer}>
                {
                    isLoading ? (
                        <FullPageLoader />
                    ) : isEmptyQuery || isEmptyResult ? (
                        <View style={styles.emptyState}>
                            <Image source={require('../../assets/empty_search.png')} style={styles.emptyImage} />
                            <Text style={styles.emptyText}>
                                {
                                    isEmptyQuery ? placeholderText :
                                    isEmptyResult ? ('No results found.') :
                                    null
                                }
                            </Text>
                        </View>
                    ) : (
                        isPeopleSelected ? (
                            <FlatList
                                data={people}
                                key="people"
                                renderItem={renderPeopleItem}
                                keyExtractor={(item) => `people_${item.id.toString()}`}
                                numColumns={1}
                                onEndReached={handleOnEndReached}
                                onEndReachedThreshold={0.3} // Trigger when 30% from bottom
                                ListFooterComponent={renderFooter}
                            />
                        ) : (
                            <FlatList
                                data={movies}
                                key="movies"
                                renderItem={renderMovieItem}
                                keyExtractor={(item) => `movie_${item.id.toString()}`}
                                numColumns={2}
                                columnWrapperStyle={styles.row}
                                onEndReached={handleOnEndReached}
                                onEndReachedThreshold={0.3} // Trigger when 30% from bottom
                                ListFooterComponent={renderFooter}
                            />
                        )
                    )
                }
            </View>
        </PageContainer>
    );
};

const styles = StyleSheet.create({
  searchBox: {
    minHeight: 40,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  row: {
    justifyContent: 'flex-start',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default SearchPage;