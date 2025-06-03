import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-elements';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import Toast from 'react-native-toast-message';
import withAuth from '../components/withAuth';

const ProfilePage = withAuth(() => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Main'>>();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
        const result = await supabase.auth.signOut();
        if (result.error) {
            throw new Error(result.error.message);
        }

        Toast.show({
            type: 'success',
            text1: 'Logout successful',
            position: 'bottom'
        });

        navigation.reset({
            index: 0,
            routes: [
                { 
                    name: 'Main',
                    params: { activeTab: 'Home' }
                }
            ]
        });

    } catch (error) {
        console.error('Logout error:', error);
        Toast.show({
            type: 'error',
            text1: 'Logout Failed',
            text2: 'An error occurred while logging out. Please try again.',
            position: 'bottom'
        });
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <PageContainer>
      <TopBar
        title="Profile"
      />
      <View style={styles.container}>
        <View style={styles.profileBox}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>
                {getInitials(user?.email || 'User')}
              </Text>
            </View>
          </View>

          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Member since {new Date(user?.created_at || '').toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
                })}
          </Text>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PageContainer>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(243, 143, 77, 0.1)',
  },
  profileBox: {
    width: Platform.OS === 'web' ? 400 : '100%',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  memberSince: {
    color: '#666',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfilePage;