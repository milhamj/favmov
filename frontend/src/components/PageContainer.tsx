import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

const PageContainer = (props: {
  children: React.ReactNode;
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {props.children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    }
});

export default PageContainer;