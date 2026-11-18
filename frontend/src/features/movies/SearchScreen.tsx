import EmptyState from '@/components/EmptyState';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import NextPageFooter, { loadNextPage } from '@/components/NextPageFooter';
import RetryButton from '@/components/RetryButton';
import SelectableChip from '@/components/SelectableChip';
import TopBar from '@/components/TopBar';
import { Movie } from '@/features/movies/movieModel';
import { useSearchMovies } from '@/features/movies/movieQueries';
import { People } from '@/features/people/peopleModel';
import { useSearchPeople } from '@/features/people/peopleQueries';
import { useGridLayout } from '@/hooks/useGridLayout';
import { appendUnique } from '@/lib/util';
import { router } from '@/navigation/router';
import { COLORS, LAYOUT, SPACING } from '@/theme/colors';
import { FIELD_STYLES } from '@/theme/fields';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, TextInput, View } from 'react-native';
import { renderSearchMovieResult, renderSearchPersonResult } from './SearchResultRows';

const CHIP_MOVIE = 'Movie';
const CHIP_TV_SHOW = 'TV Show';
const CHIP_PEOPLE = 'People';

const SelectableChips = [CHIP_MOVIE, CHIP_TV_SHOW, CHIP_PEOPLE];

const SearchScreen = () => {
  const queryClient = useQueryClient();
  const { numColumns, itemWidth, onContentSizeChange } = useGridLayout(150);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState(CHIP_MOVIE);
  const inputRef = useRef<TextInput>(null);

  const isTvShowSelected = selectedChip === CHIP_TV_SHOW;
  const isPeopleSelected = selectedChip === CHIP_PEOPLE;

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, []);

  const term = searchQuery.trim();
  const [settledSearch, setSettledSearch] = useState({ query: '', chip: CHIP_MOVIE });
  useEffect(() => {
    const timer = setTimeout(() => setSettledSearch({ query: term, chip: selectedChip }), 300);
    return () => clearTimeout(timer);
  }, [term, selectedChip]);
  const typing = settledSearch.query !== term || settledSearch.chip !== selectedChip;
  const movieQuery = useSearchMovies(term, isTvShowSelected, !typing && !isPeopleSelected);
  const peopleQuery = useSearchPeople(term, !typing && isPeopleSelected);
  const query = isPeopleSelected ? peopleQuery : movieQuery;
  const movies =
    movieQuery.data?.pages.reduce((all, page) => appendUnique(all, page.movies), [] as Movie[]) ??
    [];
  const people =
    peopleQuery.data?.pages.reduce((all, page) => appendUnique(all, page.people), [] as People[]) ??
    [];
  const isLoading = Boolean(term) && (typing || query.isLoading);
  const showFilter = !term || (!typing && !query.isLoading);
  const isEmptyResult =
    term.length > 0 &&
    !query.isError &&
    !isLoading &&
    (isPeopleSelected ? people.length === 0 : movies.length === 0);
  const isEmptyQuery = term.length === 0;
  const placeholderText = isPeopleSelected
    ? 'Type any name...'
    : isTvShowSelected
      ? 'Type any TV Show title...'
      : 'Type any Movie title...';

  return (
    <PageContainer
      topBar={
        <TopBar
          title="Search"
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      <View>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Search"
          style={[FIELD_STYLES.input, FIELD_STYLES.surface, styles.searchBox]}
          placeholder={placeholderText}
          placeholderTextColor={COLORS.secondaryText}
          value={searchQuery}
          onChangeText={(newQuery) => {
            if (newQuery === searchQuery) return;
            setSearchQuery(newQuery);
          }}
          autoFocus={Platform.OS === 'web'}
        />
      </View>
      {showFilter ? (
        <View
          style={{
            flexDirection: 'row',
            marginBottom: SPACING.small,
            marginHorizontal: SPACING.medium,
          }}
        >
          {SelectableChips.map((chip) => (
            <SelectableChip
              text={chip}
              key={chip}
              selected={selectedChip === chip}
              onSelect={(isSelected) => {
                if (isSelected) {
                  setSelectedChip(chip);
                }
              }}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.scrollContainer}>
        {isLoading ? (
          <FullPageLoader />
        ) : query.isError && !query.data ? (
          <RetryButton message="Unable to load results" onPress={() => void query.refetch()} />
        ) : isEmptyQuery || isEmptyResult ? (
          <EmptyState
            title={isEmptyQuery ? placeholderText : 'No results found.'}
            illustration={require('../../../assets/images/empty_search.png')}
          />
        ) : isPeopleSelected ? (
          <FlatList
            data={people}
            key="people"
            style={styles.reading}
            renderItem={({ item }) => renderSearchPersonResult({ item })}
            keyExtractor={(item) => `people_${item.id.toString()}`}
            numColumns={1}
            onEndReached={() => loadNextPage(query)}
            onEndReachedThreshold={0.3}
            ListFooterComponent={<NextPageFooter query={query} />}
          />
        ) : (
          <FlatList
            onContentSizeChange={onContentSizeChange}
            extraData={itemWidth}
            data={movies}
            key={numColumns}
            renderItem={({ item }) => renderSearchMovieResult({ item, itemWidth, queryClient })}
            keyExtractor={(item) => `movie_${item.id.toString()}`}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            onEndReached={() => loadNextPage(query)}
            onEndReachedThreshold={0.3}
            ListFooterComponent={<NextPageFooter query={query} />}
          />
        )}
      </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  reading: { width: '100%', maxWidth: LAYOUT.reading, alignSelf: 'flex-start' },
  searchBox: {
    marginTop: SPACING.medium,
    marginHorizontal: SPACING.medium,
    marginVertical: SPACING.small,
  },
  row: {
    justifyContent: 'flex-start',
    gap: SPACING.medium,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
});

export default SearchScreen;
