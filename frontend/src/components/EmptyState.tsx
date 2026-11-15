import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/theme/colors';

type EmptyStateProps = {
  title: string;
  headingLevel?: 1 | 2;
  description?: string;
  illustration?: ImageSourcePropType;
  children?: React.ReactNode;
};

export default function EmptyState({
  title,
  headingLevel = 2,
  description,
  illustration,
  children,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {illustration && <Image source={illustration} style={styles.image} accessible={false} />}
      <Text accessibilityRole="header" aria-level={headingLevel} style={styles.title}>
        {title}
      </Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: LAYOUT.reading,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
  },
  image: { width: 120, height: 120, marginBottom: SPACING.large },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: SPACING.large,
  },
});
