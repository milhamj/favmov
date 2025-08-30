import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import TopBar from '../components/TopBar';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/navigationTypes';
import HomeSection, { SectionType } from '../components/HomeSection';

const HomePage = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'MainPage'>>();

  return (
    <View style={styles.container}>
      <TopBar
        title="FavMov"
        icons={[
          { name: 'search', onClick: () => navigation.navigate('SearchPage') }
        ]}
      />
      <ScrollView>
        <HomeSection section={SectionType.TrendingMovies} />
        <HomeSection section={SectionType.TrendingShows} />
        <HomeSection section={SectionType.PopularMovies} />
        <HomeSection section={SectionType.YourFavorites} />
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default HomePage;