import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import RetryButton from '@/components/RetryButton';
import TopBar from '@/components/TopBar';
import PeopleMovieCreditView from '@/features/people/PeopleMovieCreditView';
import { usePeopleDetails } from '@/features/people/peopleQueries';
import { ApiError } from '@/lib/apiError';
import { useHydrated } from '@/lib/useHydrated';
import { parseTmdbId } from '@/lib/util';
import { router } from '@/navigation/router';
import { LAYOUT, COLORS, SPACING } from '@/theme/colors';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import PersonBiography from './PersonBiography';

const PERSON_NOT_FOUND = 'Person not found';

const PersonScreen = ({ params }: { params: ReturnType<typeof useLocalSearchParams> }) => {
  const peopleId = parseTmdbId(params.id);
  const hydrated = useHydrated();

  const query = usePeopleDetails(peopleId === null ? '' : String(peopleId));
  const people = query.data;
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  const error = notFound ? PERSON_NOT_FOUND : query.error?.message || 'Unable to load person';
  const [isActingHidden, setIsActingHidden] = useState<boolean>(false);
  const [isCrewHidden, setIsCrewHidden] = useState<boolean>(false);

  const actingCreditExist = people?.actingCredits && people.actingCredits.length > 0;
  const crewCreditExist = people?.crewCredits && people.crewCredits.length > 0;

  return (
    <PageContainer
      topBar={
        <TopBar
          title={people ? people.name : 'People'}
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      {/* The prerendered page has no real id, so wait for hydration before calling it invalid */}
      {peopleId === null && hydrated ? (
        <RetryButton message="Invalid person URL" />
      ) : people ? (
        <ScrollView style={styles.cotainer}>
          <PersonBiography people={people} />
          <View>
            <View style={styles.peopleCreditContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text accessibilityRole="header" aria-level={2} style={styles.peopleCreditTitle}>
                  Acting Credits
                </Text>
                <Text style={styles.peopleCreditNumber}>
                  ({people.actingCredits ? people.actingCredits.length : 0})
                </Text>
              </View>
              {actingCreditExist ? (
                <Pressable
                  hitSlop={16}
                  accessibilityRole="button"
                  aria-expanded={!isActingHidden}
                  onPress={() => setIsActingHidden(!isActingHidden)}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <Text style={{ color: COLORS.accentText }}>
                    {isActingHidden ? 'Show' : 'Hide'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {actingCreditExist ? (
              !isActingHidden ? (
                people.actingCredits?.map((credit, index) => (
                  <PeopleMovieCreditView
                    key={`${credit.isTvShow ? 'tv' : 'movie'}-${credit.id}-${index}`}
                    credit={credit}
                  />
                ))
              ) : null
            ) : (
              <Text style={[styles.peopleBioValue, { marginBottom: SPACING.medium }]}>
                No acting credits available.
              </Text>
            )}
          </View>
          <View>
            <View style={styles.peopleCreditContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text accessibilityRole="header" aria-level={2} style={styles.peopleCreditTitle}>
                  Crew Credits
                </Text>
                <Text style={styles.peopleCreditNumber}>
                  ({people.crewCredits ? people.crewCredits.length : 0})
                </Text>
              </View>
              {crewCreditExist ? (
                <Pressable
                  hitSlop={16}
                  accessibilityRole="button"
                  aria-expanded={!isCrewHidden}
                  onPress={() => setIsCrewHidden(!isCrewHidden)}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <Text style={{ color: COLORS.accentText }}>{isCrewHidden ? 'Show' : 'Hide'}</Text>
                </Pressable>
              ) : null}
            </View>
            {crewCreditExist ? (
              !isCrewHidden ? (
                people.crewCredits?.map((credit, index) => (
                  <PeopleMovieCreditView
                    key={`${credit.isTvShow ? 'tv' : 'movie'}-${credit.id}-${index}`}
                    credit={credit}
                  />
                ))
              ) : null
            ) : (
              <Text style={[styles.peopleBioValue, { marginBottom: SPACING.medium }]}>
                No crew credits available.
              </Text>
            )}
          </View>
        </ScrollView>
      ) : query.isError ? (
        <RetryButton message={error} onPress={notFound ? undefined : () => void query.refetch()} />
      ) : (
        <FullPageLoader />
      )}
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  cotainer: {
    maxWidth: LAYOUT.reading,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: SPACING.medium,
  },
  peopleCreditContainer: {
    marginBottom: SPACING.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peopleCreditTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  peopleCreditNumber: {
    marginLeft: SPACING.small,
    color: COLORS.secondaryText,
  },
  peopleBioValue: {
    fontSize: 16,
    fontWeight: '300',
  },
});

export default PersonScreen;
