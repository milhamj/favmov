import RetryButton from '../components/RetryButton';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Platform, TextInput, FlatList, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import PageContainer  from '../components/PageContainer';
import { Movie } from '../model/movieModel';
import { searchMovie } from '../services/movieService';
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
import { usePagedFetch } from '../hooks/usePagedFetch';

const CHIP_MOVIE = 'Movie';
const CHIP_TV_SHOW = 'TV Show';
const CHIP_PEOPLE = 'People';

const SelectableChips = [CHIP_MOVIE, CHIP_TV_SHOW, CHIP_PEOPLE];

const SearchPage = () => {
    const [searchQuery, setSearchQuery]  = useState('');
    const [movies, setMovies] = useState([] as Movie[]);
    const [people, setPeople] = useState([] as People[]);
    const { page, failedPage, isLoading, isLoadingMore, load, cancel, reset, canLoadMore } = usePagedFetch(false);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilter, setShowFilter] = useState(true);
    const [selectedChip, setSelectedChip] = useState(CHIP_MOVIE);
    const inputRef = useRef<TextInput>(null);

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
    const fetchSearchResult = useCallback(async (newPage: number = 1) => {
        if (!searchQuery) return;
        const settled = () => setShowFilter(true);
        if (isPeopleSelected) {
            await load(newPage, () => searchPeople(searchQuery, newPage), data => {
                setPeople((prev) => (newPage === 1 ? data.people : [...prev, ...data.people]));
                setTotalPages(data.people.length === 0 ? newPage : data.totalPages || 1);
            }, settled);
        } else if (isMovielected || isTvShowSelected) {
            await load(newPage, () => searchMovie(searchQuery, newPage, isTvShowSelected), data => {
                setMovies((prev) => (newPage === 1 ? data.movies : [...prev, ...data.movies]));
                setTotalPages(data.movies.length === 0 ? newPage : data.totalPages || 1);
            }, settled);
        }
      }, [searchQuery, selectedChip, load]
    );

    const invalidate = (query: string) => {
        reset(Boolean(query));
        setMovies([]);
        setPeople([]);
    };
    useEffect(() => {
        const debounceFetch = setTimeout(() => {
            if (searchQuery) void fetchSearchResult(1);
        }, 300);
        return () => { clearTimeout(debounceFetch); cancel(); };
    }, [searchQuery, selectedChip, fetchSearchResult, cancel]);
    const handleOnEndReached = () => {
        if (canLoadMore() && page.current < totalPages) {
            void fetchSearchResult(page.current + 1);
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
        if (failedPage !== null) return <RetryButton onPress={() => void fetchSearchResult(failedPage)}/>;
        if (!isLoadingMore) return null;
        return (
        <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="tomato" />
        </View>
        );
    };

    const isEmptyResult = searchQuery.length > 0 && failedPage === null && !isLoading && movies.length === 0 && people.length === 0;
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
                    if (newQuery === searchQuery) return;
                    invalidate(newQuery);
                    setSearchQuery(newQuery);
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
                                        if (isSelected) { invalidate(searchQuery); setSelectedChip(chip); }}
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
                    ) : failedPage === 1 ? (
                        <View><Text>Unable to load results</Text>{renderFooter()}</View>
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