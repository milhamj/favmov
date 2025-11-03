import { useEffect, useRef, useState } from "react";
import { Movie } from "../model/movieModel";
import { ActivityIndicator, View, StyleSheet, FlatList, Image, Text } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';
import { parseStrParam } from "../utils/util";
import { Success } from "../model/apiResponse";
import { SectionType } from "../components/HomeSection";
import { fetchPopularMovies, fetchTrendingMovies, fetchTrendingShows } from "../services/movieService";
import PageContainer from "../components/PageContainer";
import TopBar from "../components/TopBar";
import FullPageLoader from "../components/FullPageLoader";
import MovieCard from "../components/MovieCard";
import { MovieStore } from "../stores/movieStore";

const MAX_PAGE = 500;

const ExplorePage = () => {
    const params = useLocalSearchParams();
    const sectionType = decodeURIComponent(parseStrParam(params.section_type));

    const [movies, setMovies] = useState([] as Movie[]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const page = useRef(1);
    const isFetchingRef = useRef(false);

    const fetchExploreData = async (newPage: number = 1) => {
        if (isFetchingRef.current || !sectionType) return;
    
        isFetchingRef.current = true;
        setIsLoading(newPage === 1);
        setIsLoadingMore(newPage > 1);
    
        try {
            const result =
                sectionType === SectionType.TrendingMovies ? await fetchTrendingMovies(newPage) :
                sectionType === SectionType.TrendingShows ? await fetchTrendingShows(newPage) :
                sectionType === SectionType.PopularMovies ? await fetchPopularMovies(newPage) :
                null
            if (result instanceof Success) {
                setMovies((prev) => (newPage === 1 ? result.data : [...prev, ...result.data]));
            }
        } catch (error) {
            //TODO milhamj: update error handling and also remove the try-catch
            console.error('Error fetching movies:', error);
        } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
          isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        fetchExploreData();
    },[sectionType])

    const handleOnEndReached = () => {
        if (!isFetchingRef.current && page.current < MAX_PAGE && !isLoadingMore) {
            page.current += 1;
            fetchExploreData(page.current);
        }
    };    

    const renderMovieItem = ({ item, index }: { item: Movie, index: number }) => (
        <View style={{
            width: '48%', 
            marginTop: index === 0 || index === 1 ? 16 : 0,
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

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
        <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="tomato" />
        </View>
        );
    };

    const isEmptyResult = movies.length === 0 && !isLoading;

    return (
        <PageContainer>
            <TopBar
                title={sectionType}
                backButton={{
                    isShow: true,
                    onClick: () => router.goBackSafely()
                }}
            />
            <View style={styles.scrollContainer}>
                {
                    isLoading ? (
                        <FullPageLoader />
                    ) : isEmptyResult ? (
                        <View style={styles.emptyState}>
                            <Image source={require('../../assets/empty_search.png')} style={styles.emptyImage} />
                            <Text style={styles.emptyText}>
                                No results found.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={movies}
                            renderItem={renderMovieItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            onEndReached={handleOnEndReached}
                            onEndReachedThreshold={0.3} // Trigger when 30% from bottom
                            ListFooterComponent={renderFooter}
                        />
                    )
                }
            </View>
        </PageContainer>
    )
}

const styles = StyleSheet.create({
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
    row: {
      justifyContent: 'flex-start',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default ExplorePage;