import { COLORS, SPACING } from '@/theme/colors';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import PageContainer from '@/components/PageContainer';
import TopBar from '@/components/TopBar';
import AppButton from '@/components/AppButton';
import { router } from '@/navigation/router';

export default function NotFoundPage() {
  return (
    <PageContainer
      topBar={
        <TopBar
          title="FavMov"
          backButton={{ isShow: true, onClick: () => router.goBackSafely() }}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            <Image
              source={require('../../assets/images/not_found_cinema.png')}
              style={styles.image}
              resizeMode="contain"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </View>
          <Text style={styles.code}>404</Text>
          <Text accessibilityRole="header" aria-level={2} style={styles.heading}>
            Page not found
          </Text>
          <Text style={styles.description}>This page doesn&apos;t exist or may have moved.</Text>
          <AppButton label="Go home" style={styles.button} onPress={() => router.replace('/')} />
        </View>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.large },
  content: { width: '100%', maxWidth: 400, alignItems: 'center' },
  illustration: { width: '100%', maxWidth: 320, aspectRatio: 1.5, marginBottom: SPACING.large },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  code: { color: COLORS.accentText, fontSize: 16, fontWeight: '600', marginBottom: SPACING.small },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: SPACING.large,
  },
  button: { minWidth: 120 },
});
