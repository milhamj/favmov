import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Button } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Movie } from '../model/movieModel';
import TopBar from '../components/TopBar';
import FullImageViewer from '../components/FullImageViewer';
import { COLORS } from '../styles/colors'; 

const MovieDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { movie } = route.params as { movie: Movie };

  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  return (
    <View style={styles.container}>
      <TopBar
        title= { movie.title }
        backButton={{
          isShow: true,
          onClick: () => navigation.goBack()
        }}
      />
      <ScrollView>
        <FullImageViewer
          visible={isImageViewerVisible}
          imageUrl={selectedImageUrl}
          onClose={() => setImageViewerVisible(false)}
        />
        <TouchableOpacity onPress={() => handleImagePress(movie.posterUrl)}>
          <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
        </TouchableOpacity>
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          {
            movie.rating && 
              <Text style={[styles.rating, {
                  color: movie.rating > 5.0 ? COLORS.rating_green : COLORS.rating_red,
                },
              ]}>
                ⭐ {movie.rating}{' '}
                {movie.ratingCount && (
                  <Text style={styles.ratingCount}>({movie.ratingCount})</Text>
                )}
              </Text>
          }
          <Text style={styles.info}>{movie.runtime} • {movie.releaseDate}</Text>
          { 
              movie.genres && movie.genres.length > 0 && 
                <View style={styles.genres}>
                    {movie.genres?.map((genre, index) => (
                    <Text key={index} style={styles.genre}>{genre}</Text>
                    ))}
                </View>
          }
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.synopsis}>{movie.overview}</Text>
          {
              movie.cast && movie.cast.length > 0 &&
                <View> 
                    <Text style={styles.sectionTitle}>Cast</Text>
                    {movie.cast?.map((actor, index) => (
                        <View key={index} style={styles.castItem}>
                        <Image source={{ uri: actor.photoUrl }} style={styles.actorPhoto} />
                        <View>
                            <Text style={styles.actorName}>{actor.name}</Text>
                            <Text style={styles.characterName}>{actor.character}</Text>
                        </View>
                        </View>
                    ))}
                </View>
          }
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  poster: {
    width: '100%',
    height: 300,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rating: {
    fontSize: 18,
    marginVertical: 4,
    fontWeight: 'bold',
  },
  ratingCount: {
    color: COLORS.text_gray,
    fontWeight: 'normal',
  },
  info: {
    fontSize: 16,
    color: '#666',
  },
  genres: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  genre: {
    backgroundColor: '#eee',
    borderRadius: 4,
    padding: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  synopsis: {
    fontSize: 16,
    color: '#333',
  },
  castItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  actorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  actorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  characterName: {
    fontSize: 14,
    color: '#666',
  },
});

export default MovieDetail;