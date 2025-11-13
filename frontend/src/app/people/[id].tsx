import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import { useLocalSearchParams } from 'expo-router';
import { parseIntParam, parseStrParam } from '../../utils/util';
import { People } from '../../model/peopleModel';
import FullPageLoader from '../../components/FullPageLoader';
import ExpandableText from '../../components/ExpandableText';
import Toast from 'react-native-toast-message';
import { fetchPeopleDetails } from '../../services/peopleService';
import { Success } from '../../model/apiResponse';

const PeopleDetailPage = () => {
    const params = useLocalSearchParams();
    const peopleId = decodeURIComponent(parseStrParam(params.id));

    const [people, setPeople] = useState<People | null>(null);

    const fetchData = async () => {
        const result = await fetchPeopleDetails(peopleId);
        if (result instanceof Success) {
            setPeople(result.data);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom'
            });
        }
    };

    useEffect(() => {
        fetchData();
    }, [peopleId]);

    const handleCreditPress = (creditId: number, isTvShow?: boolean) => {
        router.navigate(routes.movie(creditId, isTvShow));
    }

    return (
        <PageContainer>
            <TopBar
                title= { people ? people.name : 'People' }
                backButton={{
                    isShow: true,
                    onClick: () => router.goBackSafely()
                }}
            />
            {
                people ? (
                    <ScrollView style={styles.cotainer}>
                        <View style={styles.peopleHeaderContainer}>
                            <Image source={{ uri: people?.photoUrl() }} style={[styles.poster]} />
                            <View style={styles.peopleInfoContainer} >
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
                                    <Text style={styles.peopleInfoValue}>{people.genderText() ?? 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.peopleBioTitle}>Biography</Text>
                            <ExpandableText 
                                text={people.biography ?? 'No biography available.'}
                                viewStyle={{ marginBottom: 16 }}
                                textStyle={styles.peopleBioValue}
                                maxLines={4}
                            />
                        </View>
                        <View>
                            <Text style={styles.peopleBioTitle}>Credits</Text>
                            {
                                people.actingCredits && people.actingCredits.length > 0 ? (
                                    people.actingCredits?.map(credit => (
                                        <TouchableOpacity 
                                        style={{marginBottom: 16,}}
                                        key={`${credit.id}_${credit.character}`}
                                        onPress={() => handleCreditPress(credit.id, credit.isTvShow)}>
                                            <Text>{`${credit.releaseDate}: ${credit.title} |  ${credit.character}`}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.peopleBioValue}>No credits available.</Text>
                                )
                            }
                        </View>
                    </ScrollView>
                ) : (
                    <FullPageLoader/>
                )
            }
        </PageContainer>
    )
}

const styles = StyleSheet.create({
    cotainer: {
        paddingHorizontal: 16,
    },
    peopleHeaderContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingVertical: 16,
    },
    peopleInfoContainer: {
        flex: 1,
        flexDirection: 'column',
        marginLeft: 16,
    },
    peopleInfoName: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 8 
    },
    peopleInfoItem: {
        flexDirection: 'row', 
        marginBottom: 8
    },
    peopleInfoTitle: {
        fontWeight: '600',
        fontSize: 16,
    },
    peopleInfoValue: {
        fontSize: 16,
    },
    peopleBioTitle: {
         fontSize: 20, 
         fontWeight: '600', 
         marginBottom: 8 
    },
    peopleBioValue: {
        fontSize: 16,
        fontWeight: '300'
    },
    poster: {
        height: 150,
        aspectRatio: 2 / 3,
        borderRadius: 8,
    },
})

export default PeopleDetailPage;