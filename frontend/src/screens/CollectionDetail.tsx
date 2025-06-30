import React, { useEffect, useState } from 'react';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import withAuth from '../components/withAuth';
import { Success } from '../model/apiResponse';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Movie } from '../model/movieModel';
import { RootStackParamList } from '../navigation/navigationTypes';
import { searchMovie } from '../services/movieService';
import { getCollectionDetail } from '../services/collectionService';
import { Collection } from '../model/collectionModel';
import Toast from 'react-native-toast-message';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

const CollectionDetail = withAuth(() => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'CollectionDetail'>>();
    const route = useRoute();
    const collectionId = (route.params as { collectionId: string }).collectionId;
    const [collection, setCollection] = useState(null as Collection | null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmpty, setIsEmpty] = useState(false);

    useEffect(() => {
        const fetchCollectionDetail = async () => {
            setIsLoading(true);
            setIsEmpty(false);
            const result = await getCollectionDetail(collectionId);
            if (result instanceof Success) {
                setCollection(result.data);
                if (!result.data.movies) {
                    setIsEmpty(true);
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message,
                    position: 'bottom',
                });
            }
            setIsLoading(false);
        }

        fetchCollectionDetail();
    }, [collectionId]);

    return (
        <PageContainer>
            <TopBar
                title={ collection?.name ? collection?.name : 'Collection' }
                backButton={ {
                    isShow: true,
                    onClick: () => navigation.goBack()
                } }
            />
            <View style={styles.container}>
                { isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="tomato" />
                    </View>
                ) : (
                    <Text>Collection Name: {collection?.name}</Text>
                )}
            </View>
            <Toast/>
        </PageContainer>
    )
});

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
})

export default CollectionDetail;
