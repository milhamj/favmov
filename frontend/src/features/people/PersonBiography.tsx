import { SPACING, RADIUS } from '@/theme/colors';
import ExpandableText from '@/components/ExpandableText';
import ImageViewer from '@/components/ImageViewer';
import { genderText, personBigPhotoUrl, personPhotoUrl } from '@/features/people/peopleModel';
import { usePeopleDetails } from '@/features/people/peopleQueries';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PersonBiography({
  people,
}: {
  people: NonNullable<ReturnType<typeof usePeopleDetails>['data']>;
}) {
  return (
    <>
      <View style={styles.peopleHeaderContainer}>
        <ImageViewer
          accessibilityLabel={`View full photo of ${people.name}`}
          style={styles.poster}
          imageStyle={styles.posterImage}
          smallImageUrl={personPhotoUrl(people)}
          fullImageUrl={personBigPhotoUrl(people)}
        />
        <View style={styles.peopleInfoContainer}>
          <Text style={styles.peopleInfoName}>{people.name}</Text>
          <View style={styles.peopleInfoItem}>
            <Text style={styles.peopleInfoTitle}>Known For: </Text>
            <Text style={styles.peopleInfoValue}>{people.knownForDepartment ?? 'N/A'}</Text>
          </View>
          <View style={styles.peopleInfoItem}>
            <Text style={styles.peopleInfoTitle}>Birthday: </Text>
            <Text style={styles.peopleInfoValue}>{people.birthday ?? 'N/A'}</Text>
          </View>
          <View style={styles.peopleInfoItem}>
            <Text style={styles.peopleInfoTitle}>Place of Birth: </Text>
            <Text style={styles.peopleInfoValue}>{people.placeOfBirth ?? 'N/A'}</Text>
          </View>
          <View style={styles.peopleInfoItem}>
            <Text style={styles.peopleInfoTitle}>Gender: </Text>
            <Text style={styles.peopleInfoValue}>{genderText(people) ?? 'N/A'}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text accessibilityRole="header" aria-level={2} style={styles.peopleBioTitle}>
          Biography
        </Text>
        <ExpandableText
          text={people.biography ? people.biography : 'No biography available.'}
          viewStyle={{ marginBottom: SPACING.medium }}
          textStyle={styles.peopleBioValue}
          maxLines={4}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  peopleHeaderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: SPACING.medium,
  },
  peopleInfoContainer: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: SPACING.medium,
  },
  peopleInfoName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.small,
  },
  peopleInfoItem: {
    flexDirection: 'row',
    marginBottom: SPACING.small,
  },
  peopleInfoTitle: {
    minWidth: 115,
    fontWeight: '600',
    fontSize: 16,
  },
  peopleInfoValue: {
    fontSize: 16,
  },
  peopleBioTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.small,
  },
  peopleBioValue: {
    fontSize: 16,
    fontWeight: '300',
  },
  posterImage: { borderRadius: RADIUS.control },
  poster: {
    height: 150,
    aspectRatio: 2 / 3,
  },
});
