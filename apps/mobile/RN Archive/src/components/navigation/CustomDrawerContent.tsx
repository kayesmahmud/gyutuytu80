import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/config';

interface CustomDrawerContentProps {
  navigation: any;
}

export default function CustomDrawerContent({ navigation }: CustomDrawerContentProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleNavigation = (screen: string, params?: any) => {
    navigation.closeDrawer();
    navigation.navigate(screen, params);
  };

  const handleLogout = async () => {
    navigation.closeDrawer();
    await logout();
  };

  const openAuthModal = (screen: 'Login' | 'SignUp') => {
    navigation.closeDrawer();
    navigation.navigate('AuthModal', { screen });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Thulu</Text>
          <Text style={styles.logoBazaar}>Bazaar</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.closeDrawer()}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Auth Section - Only show if not authenticated */}
        {!isAuthenticated && (
          <View style={styles.authSection}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => openAuthModal('Login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => openAuthModal('SignUp')}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Info - Only show if authenticated */}
        {isAuthenticated && user && (
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.fullName?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.fullName || 'User'}</Text>
              {user.phone && (
                <Text style={styles.userPhone}>+977 {user.phone}</Text>
              )}
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Navigation Links */}
        <View style={styles.navSection}>
          <DrawerItem
            icon="🏠"
            label="Home"
            onPress={() => handleNavigation('HomeTab')}
          />
          <DrawerItem
            icon="🔍"
            label="Browse Ads"
            onPress={() => handleNavigation('SearchTab')}
          />

          {isAuthenticated && (
            <>
              <DrawerItem
                icon="⭐"
                label="Get Verified"
                onPress={() => handleNavigation('Verification')}
              />
              <DrawerItem
                icon="💬"
                label="Inbox"
                badge={0}
                onPress={() => handleNavigation('MessagesTab')}
              />
              <DrawerItem
                icon="👤"
                label="My Profile"
                onPress={() => handleNavigation('ProfileTab')}
              />
              <DrawerItem
                icon="📊"
                label="Dashboard"
                onPress={() => handleNavigation('Dashboard')}
              />
              {user?.businessName && (
                <DrawerItem
                  icon="🏪"
                  label="My Shop"
                  verified={user.businessVerificationStatus === 'approved'}
                  onPress={() => handleNavigation('MyShop')}
                />
              )}
            </>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Secondary Links */}
        <View style={styles.navSection}>
          <DrawerItem
            icon="❓"
            label="Help Center"
            onPress={() => handleNavigation('Help')}
          />
          <DrawerItem
            icon="⚙️"
            label="Settings"
            onPress={() => handleNavigation('Settings')}
          />
        </View>

        {/* Logout Button - Only show if authenticated */}
        {isAuthenticated && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

interface DrawerItemProps {
  icon: string;
  label: string;
  badge?: number;
  verified?: boolean;
  onPress: () => void;
}

function DrawerItem({ icon, label, badge, verified, onPress }: DrawerItemProps) {
  return (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
      <Text style={styles.drawerItemIcon}>{icon}</Text>
      <Text style={styles.drawerItemLabel}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>⭐ VERIFIED</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoBazaar: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  content: {
    flex: 1,
  },
  authSection: {
    padding: 20,
    gap: 12,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  signupButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.gray[50],
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  navSection: {
    paddingVertical: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  drawerItemIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 16,
    color: COLORS.gray[700],
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error || '#ef4444',
    fontWeight: '500',
  },
});
