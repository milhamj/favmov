import ProfileScreen from '@/features/auth/ProfileScreen';
import withAuth from '@/features/auth/withAuth';

const ProfilePage = withAuth(() => {
  return <ProfileScreen />;
});

export default ProfilePage;
