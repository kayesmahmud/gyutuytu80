import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { COLORS } from '../../constants/config';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showDrawerButton?: boolean;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
}

export default function AppHeader({
  title,
  showLogo = true,
  showDrawerButton = true,
  showBackButton = false,
  rightComponent,
  onBackPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleDrawerPress = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* Left Side */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
          {showDrawerButton && !showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleDrawerPress}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Logo or Title */}
        <View style={styles.centerSection}>
          {showLogo ? (
            <View style={styles.logoContainer}>
              <Text style={styles.logoThulu}>Thulu</Text>
              <Text style={styles.logoBazaar}>Bazaar</Text>
            </View>
          ) : title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right Side */}
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: COLORS.gray[700],
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.gray[700],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoThulu: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoBazaar: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
});
