import RetryButton from '../components/RetryButton';
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
    const sectionType = parseStrParam(params.section_type);

    const [title, setTitle] = useState(''); // query params are unknown when prerendering
    const [movies, setMovies] = useState([] as Movie[]);
    const [isLoading, setIsLoading] = useState(true); // the prerender should show a loader, not "No results"
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const page = useRef(0);
    const generation = useRef(0);
    const ended = useRef(false);
    const [failedPage, setFailedPage] = useState<number | null>(null);
    const isFetchingRef = useRef(false);

    const fetchExploreData = async (newPage: number = 1) => {
        if (isFetchingRef.current || !sectionType) return;
    
        const requestGeneration = generation.current;
        isFetchingRef.current = true;
        setFailedPage(null);
        setIsLoading(newPage === 1);
        setIsLoadingMore(newPage > 1);
    
        try {
            const result =
                sectionType === SectionType.TrendingMovies ? await fetchTrendingMovies(newPage) :
                sectionType === SectionType.TrendingShows ? await fetchTrendingShows(newPage) :
                sectionType === SectionType.PopularMovies ? await fetchPopularMovies(newPage) :
                null
            if (requestGeneration !== generation.current) return;
            if (result instanceof Success) {
                page.current = newPage;
                ended.current = result.data.length === 0;
                setMovies((prev) => (newPage === 1 ? result.data : [...prev, ...result.data]));
            } else if (result !== null) setFailedPage(newPage);
        } catch (error) {
            //TODO milhamj: update error handling and also remove the try-catch
            console.error('Error fetching movies:', error);
            if (requestGeneration === generation.current) setFailedPage(newPage);
        } finally {
          if (requestGeneration !== generation.current) return;
          setIsLoading(false);
          setIsLoadingMore(false);
          isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        generation.current += 1;
        page.current = 0;
        ended.current = false;
        isFetchingRef.current = false;
        setFailedPage(null);
        setMovies([]);
        setTitle(sectionType);
        if (!sectionType) setIsLoading(false);
        void fetchExploreData();
        return () => { generation.current += 1; };
    },[sectionType])

    const handleOnEndReached = () => {
        if (failedPage === null && !ended.current && page.current > 0 && !isFetchingRef.current && page.current < MAX_PAGE) {
            void fetchExploreData(page.current + 1);
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
        if (failedPage !== null) return <RetryButton onPress={() => void fetchExploreData(failedPage)}/>;
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
                title={title}
                backButton={{
                    isShow: true,
                    onClick: () => router.goBackSafely()
                }}
            />
            <View style={styles.scrollContainer}>
                {
                    isLoading ? (
                        <FullPageLoader />
                    ) : failedPage === 1 ? (
                        <View><Text>Unable to load results</Text>{renderFooter()}</View>
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