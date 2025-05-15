import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const Setting = () => {
  const handleLogout = () => {
    // Implement logout functionality
  };

  return (
    <View style={styles.container}>
      <Text style={styles.userDetail}>User Avatar</Text>
      <Text style={styles.userDetail}>User Login Info</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetail: {
    fontSize: 18,
    marginVertical: 8,
  },
});

export default Setting;