import { COLORS, LAYOUT } from '@/theme/colors';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

const PageContainer = (props: {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  backgroundColor?: string;
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {props.topBar}
      <View style={[styles.body, { backgroundColor: props.backgroundColor }]}>
        <View style={styles.content}>{props.children}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.page },
  body: { flex: 1 },
  content: { width: '100%', maxWidth: LAYOUT.page, alignSelf: 'center', flex: 1 },
});

export default PageContainer;
