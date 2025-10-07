import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import TopBar from '../../components/TopBar';
import HomeSection, { SectionType } from '../../components/HomeSection';
import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';

const HomePage = () => {
  return (
    <View style={styles.container}>
      <TopBar
        title="FavMov"
        icons={[
          { name: 'search', onClick: () => router.navigate(routes.search) }
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