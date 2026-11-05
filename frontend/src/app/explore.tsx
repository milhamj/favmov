import RetryButton from '../components/RetryButton';
import { useEffect, useState } from "react";
import { Movie } from "../model/movieModel";
import { ActivityIndicator, View, StyleSheet, FlatList, Image, Text } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';
import { parseStrParam } from "../utils/util";
import { SectionType } from "../components/HomeSection";
import { fetchPopularMovies, fetchTrendingMovies, fetchTrendingShows } from "../services/movieService";
import PageContainer from "../components/PageContainer";
import TopBar from "../components/TopBar";
import FullPageLoader from "../components/FullPageLoader";
import MovieCard from "../components/MovieCard";
import { MovieStore } from "../stores/movieStore";
import { usePagedFetch } from "../hooks/usePagedFetch";

const ExplorePage = () => {
    const params = useLocalSearchParams();
    const sectionType = parseStrParam(params.section_type);

    const [title, setTitle] = useState(''); // query params are unknown when prerendering
    const [movies, setMovies] = useState([] as Movie[]);
    // Start loading: the prerender should show a loader, not "No results"
    const { page, failedPage, isLoading, isLoadingMore, load, reset, canLoadMore } = usePagedFetch(true);

    const fetchExploreData = async (newPage: number = 1) => {
        if (!sectionType) return;
        await load(newPage, async () =>
            sectionType === SectionType.TrendingMovies ? fetchTrendingMovies(newPage) :
            sectionType === SectionType.TrendingShows ? fetchTrendingShows(newPage) :
            sectionType === SectionType.PopularMovies ? fetchPopularMovies(newPage) :
            null,
        data => {
            setMovies((prev) => (newPage === 1 ? data : [...prev, ...data]));
            return data.length > 0;
        });
    };

    useEffect(() => {
        reset(Boolean(sectionType));
        setMovies([]);
        setTitle(sectionType);
        void fetchExploreData();
    },[sectionType])

    const handleOnEndReached = () => {
        if (canLoadMore()) void fetchExploreData(page.current + 1);
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
                        <RetryButton message="Unable to load results" onPress={() => void fetchExploreData(1)}/>
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