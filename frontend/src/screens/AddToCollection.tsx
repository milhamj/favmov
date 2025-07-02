import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Modal, ActivityIndicator, Pressable, Image, TextInput, TouchableOpacity, View, Platform, Text } from 'react-native';
import PageContainer from '../components/PageContainer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import { Movie } from '../model/movieModel';
import { getUserCollections } from '../services/collectionService';
import { Collection as CollectionModel } from '../model/collectionModel';
import Toast from 'react-native-toast-message';

const AddToCollection = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'AddToCollection'>>();
    const route = useRoute();
    const movieParams = (route.params as { movie: Movie }).movie;
    const shortTitle = movieParams.title.length > 20 ? movieParams.title.substring(0,20) + "..." : movieParams.title;

    const [collections, setCollections] = useState<CollectionModel[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const handleClose = () => {
        setIsModalVisible(false);
        navigation.goBack();
    }

    const handleCreateCollection = () => {
        navigation.navigate('Main', { activeTab: 'Collection'})
    }

    const fetchCollections = async () => {
        setIsLoading(true);
        const result = await getUserCollections();
        if ('data' in result) {
          setCollections(result.data);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result.message,
            position: 'bottom'
          });
        }
        setIsLoading(false);
    };
      
    useEffect(() => {
        fetchCollections();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleClose}
            >
                <Pressable 
                    style={styles.overlay}
                    onPress={handleClose}
                >
                    <Pressable 
                    style={styles.bottomSheet}
                    onPress={(e) => {
                        // Prevent closing when pressing on the bottom sheet itself
                        e.stopPropagation();
                    }}
                    >
                    <View style={styles.header}>
                        <Text style={styles.title}>Add {shortTitle} to Collection</Text>
                    </View>
                    
                    <View style={styles.content}>
                        {
                            isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator style={styles.loadingItem} size="large" color="tomato" />
                                </View>
                            ) : collections.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Image 
                                        source={require('../../assets/empty_search.png')} 
                                        style={styles.emptyImage} 
                                    />
                                    <Text style={styles.emptyText}>
                                        You don't have any collections yet.
                                    </Text>
                                    <TouchableOpacity 
                                        style={styles.createButton}
                                        onPress={handleCreateCollection}
                                    >
                                        <Text style={styles.createButtonText}>Create Collection</Text>
                                    </TouchableOpacity>
                                </View>

                            ) : null
                        }
                    </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0, 0, 0, 0)'
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingItem: {
      height: 100
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
      opacity: 0.8,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginBottom: 8,
    },
    createButton: {
      backgroundColor: 'tomato',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
      marginTop: 16,
    },
    createButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
})

export default AddToCollection;