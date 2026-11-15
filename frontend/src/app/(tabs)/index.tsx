import PageContainer from '@/components/PageContainer';
import React from 'react';
import { ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import TopBar from '@/components/TopBar';
import HomeSection, { SectionType } from '@/features/movies/HomeSection';
import { router } from '@/navigation/router';
import { routes } from '@/navigation/routes';

const HomePage = () => {
  return (
    <PageContainer
      topBar={
        <TopBar
          title="FavMov"
          icons={[
            { name: 'search', label: 'Search', onClick: () => router.navigate(routes.search) },
          ]}
        />
      }
    >
      <ScrollView>
        <HomeSection section={SectionType.TrendingMovies} />
        <HomeSection section={SectionType.TrendingShows} />
        <HomeSection section={SectionType.PopularMovies} />
        <HomeSection section={SectionType.YourFavorites} />
      </ScrollView>
      <Toast />
    </PageContainer>
  );
};

export default HomePage;
