import EmptyState from '../components/EmptyState';
import { SPACING } from '../styles/colors';
import { useGridLayout } from '../hooks/useGridLayout';
import RetryButton from '../components/RetryButton';
import { useEffect, useState } from "react";
import { Movie } from "../model/movieModel";
import { ActivityIndicator, View, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from 'expo-router';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';
import { appendUnique, parseStrParam } from "../utils/util";
import { SectionType } from "../components/HomeSection";
import { fetchPopularMovies, fetchTrendingMovies, fetchTrendingShows } from "../services/movieService";
import PageContainer from "../components/PageContainer";
import TopBar from "../components/TopBar";
import FullPageLoader from "../components/FullPageLoader";
import MovieCard from "../components/MovieCard";
import { MovieStore } from "../stores/movieStore";
import { usePagedFetch } from "../hooks/usePagedFetch";

const ExplorePage = () => {
    const { itemWidth, onContentSizeChange } = useGridLayout();
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
            setMovies((prev) => appendUnique(newPage === 1 ? [] : prev, data));
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
            width: itemWidth,
            marginTop: index === 0 || index === 1 ? 16 : 0,
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
                        <EmptyState title="No results found." illustration={require('../../assets/empty_search.png')} />
                    ) : (
                        <FlatList
                            onContentSizeChange={onContentSizeChange}
                            extraData={itemWidth}
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
    row: {
      justifyContent: 'flex-start',
      gap: SPACING.medium,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default ExplorePage;
