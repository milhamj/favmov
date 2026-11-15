import AppButton from '@/components/AppButton';
import PageContainer from '@/components/PageContainer';
import TopBar from '@/components/TopBar';
import { signOut } from '@/features/auth/authService';
import { useAuth } from '@/features/auth/useAuth';
import { unsavedNotes } from '@/features/collections/unsavedNotesStore';
import { router } from '@/navigation/router';
import { LAYOUT, COLORS, SPACING } from '@/theme/colors';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

const ProfileScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await signOut();
      unsavedNotes.clear();
      queryClient.removeQueries({ queryKey: ['collections'] });
      Toast.show({
        type: 'success',
        text1: 'Logout successful',
        position: 'bottom',
      });
      router.replace('/');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'An error occurred while logging out. Please try again.',
        position: 'bottom',
      });
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <PageContainer backgroundColor={COLORS.warmSurface} topBar={<TopBar title="Profile" />}>
      <View style={styles.container}>
        <View style={styles.profileBox}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{getInitials(user?.email || 'User')}</Text>
            </View>
          </View>

          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Member since{' '}
            {new Date(user?.created_at || '').toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <AppButton
            label="Logout"
            style={styles.logoutButton}
            onPress={handleLogout}
            destructive
          />
        </View>
      </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileBox: {
    maxWidth: LAYOUT.form,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: COLORS.page,
    borderRadius: 10,
    padding: 20,
    shadowColor: COLORS.shadow,
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
    backgroundColor: COLORS.avatar,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.onAccent,
    fontSize: 36,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: SPACING.small,
  },
  memberSince: {
    color: COLORS.secondaryText,
    marginBottom: SPACING.large,
  },
  logoutButton: { width: '100%' },
});

export default ProfileScreen;
