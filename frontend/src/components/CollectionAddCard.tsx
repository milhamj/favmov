import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions, View, ActivityIndicator } from 'react-native';
import Checkbox from 'expo-checkbox';
import { Collection } from '../model/collectionModel';

interface CollectionAddCardProps {
    collection: Collection;
}

const CollectionAddCard = ({ collection }: CollectionAddCardProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleAddToCollection = async (value: boolean) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSaved(!isSaved);
        }, 2000);
    }

    return (
        <View>
            <View style={styles.selectionContainer}>
                <Text style={styles.collectionName}>{collection.name}</Text>
                <View style={styles.checkboxContainer}>
                    {
                        isLoading ? (
                            <ActivityIndicator style={styles.checkbox} color="tomato"/>
                        ) : (
                            <Checkbox style={styles.checkbox} value={isSaved} onValueChange={handleAddToCollection} color='tomato'/>
                        )
                    }
                </View>
            </View>
            <View style={styles.separator}/>
        </View>
    )
}

const styles = StyleSheet.create({
    selectionContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    collectionName: {
        width: '90%',
        fontSize: 16,
        fontWeight: '700'
    },
    checkboxContainer: {
        flex: 1,
        width: '10%',
        alignItems: 'flex-end'
    },
    checkbox: {
        width: 18,
        height: 18
    },
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginEnd: 8,
        marginTop: 8,
        marginBottom: 16
    }
})

export default CollectionAddCard;