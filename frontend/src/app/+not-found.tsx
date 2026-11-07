import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import { router } from '../navigation/router';

export default function NotFoundPage() {
  return (
    <PageContainer>
      <TopBar title="FavMov" backButton={{ isShow: true, onClick: () => router.goBackSafely() }} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            <Image
              source={require('../../assets/not_found_cinema.png')}
              style={styles.image}
              resizeMode="contain"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </View>
          <Text style={styles.code}>404</Text>
          <Text accessibilityRole="header" style={styles.heading}>Page not found</Text>
          <Text style={styles.description}>This page doesn't exist or may have moved.</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonLabel}>Go home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 400, alignItems: 'center' },
  illustration: { width: '100%', maxWidth: 320, aspectRatio: 1.5, marginBottom: 24 },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  code: { color: 'tomato', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  description: { fontSize: 16, lineHeight: 24, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: { minWidth: 120, minHeight: 44, paddingHorizontal: 24, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'tomato', borderRadius: 6 },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
