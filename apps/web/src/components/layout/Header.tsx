// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { apiClient } from '@/lib/api';
import { User, LayoutDashboard, Store, LogOut, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface HeaderProps {
  lang: string;
}

export default function Header({ lang }: HeaderProps) {
  const t = useTranslations('nav');
  const { siteName } = useSiteSettings();
  const pathname = usePathname();
  const router = useRouter();

  // Language switcher
  const otherLang = lang === 'en' ? 'ne' : 'en';
  const otherLangLabel = lang === 'en' ? 'नेपाली' : 'English';
  const switchLanguage = () => {
    const newPath = pathname?.replace(`/${lang}`, `/${otherLang}`) || `/${otherLang}`;
    router.push(newPath);
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check both user and staff auth
  const { user, isAuthenticated: isUserAuthenticated, logout: userLogout, refreshUser } = useUserAuth();
  const { staff, isAuthenticated: isStaffAuthenticated, logout: staffLogout } = useStaffAuth();

  // Determine which user is logged in
  const currentUser = staff || user;
  const isAuthenticated = isStaffAuthenticated || isUserAuthenticated;
  const logout = staff ? staffLogout : userLogout;

  const handleSignOut = async () => {
    await logout();
    setProfileDropdownOpen(false);
  };

  // Auto-refresh user session when dropdown/menu is opened (to get latest shop slug, verification status, etc.)
  const handleDropdownToggle = () => {
    const newState = !profileDropdownOpen;
    setProfileDropdownOpen(newState);

    // Refresh user data when opening dropdown (only for regular users, not staff)
    if (newState && isUserAuthenticated && !staff) {
      refreshUser().catch(err => console.error('Failed to refresh user:', err));
    }
  };

  const handleMobileMenuToggle = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);

    // Refresh user data when opening mobile menu (only for regular users, not staff)
    if (newState && isUserAuthenticated && !staff) {
      refreshUser().catch(err => console.error('Failed to refresh user:', err));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!isUserAuthenticated || staff) return;
    try {
      const response = await apiClient.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unread_messages || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isUserAuthenticated, staff]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notification unread count
  const fetchNotificationUnreadCount = useCallback(async () => {
    if (!isUserAuthenticated || staff) return;
    try {
      const response = await apiClient.getUnreadNotificationCount();
      if (response.success && response.data) {
        setNotificationUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notification unread count:', error);
    }
  }, [isUserAuthenticated, staff]);

  useEffect(() => {
    fetchNotificationUnreadCount();
    const interval = setInterval(fetchNotificationUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificationUnreadCount]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Role-based styling
  const getRoleBadgeColor = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'super_admin':
        return 'bg-red-600 text-white';
      case 'editor':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const tRoles = useTranslations('roles');
  const getRoleLabel = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'super_admin':
        return tRoles('superAdmin');
      case 'editor':
        return tRoles('editor');
      default:
        return tRoles('user');
    }
  };

  // Check if user is staff (editor or super_admin)
  const isStaff = currentUser?.role === 'editor' || currentUser?.role === 'super_admin';

  // Check if user is verified (individual or business)
  const isUserVerified = user?.individualVerified ||
    user?.businessVerificationStatus === 'approved' ||
    user?.businessVerificationStatus === 'verified';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Header - 3 column grid for centered logo */}
        <div className="md:hidden grid grid-cols-3 items-center h-14">
          {/* Left - Hamburger Menu */}
          <div className="flex justify-start">
            <button
              className="p-2 text-gray-600 hover:text-rose-500"
              onClick={handleMobileMenuToggle}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Center - Logo */}
          <div className="flex justify-center">
            <Link
              href={`/${lang}`}
              className="no-underline flex items-center hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt={siteName}
                width={84}
                height={40}
                className="h-8 object-contain"
                style={{ width: 'auto' }}
                priority
              />
            </Link>
          </div>

          {/* Right - Language Switcher */}
          <div className="flex justify-end">
            <button
              onClick={switchLanguage}
              className="px-2 py-1 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {otherLangLabel}
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${lang}`}
            className="no-underline flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt={siteName}
              width={84}
              height={40}
              className="h-10 object-contain"
              style={{ width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!isStaff && (
              <>
                <Link
                  href={`/${lang}/ads`}
                  className={`no-underline font-medium text-sm ${pathname?.includes('/ads') && !pathname?.includes('/post-ad') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                    } transition-colors`}
                >
                  {t('searchAds')}
                </Link>

                <Link
                  href={`/${lang}/verification`}
                  className={`no-underline font-medium text-sm ${pathname?.includes('/verification') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                    } transition-colors`}
                >
                  {isUserVerified ? t('verification') : t('getVerified')}
                </Link>

                {isAuthenticated && (
                  <>
                    <Link
                      href={`/${lang}/messages`}
                      className={`relative no-underline font-medium text-sm ${pathname?.includes('/messages') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                        } transition-colors`}
                    >
                      {t('inbox')}
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href={`/${lang}/notifications`}
                      className={`relative no-underline text-sm ${pathname?.includes('/notifications') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                        } transition-colors`}
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {notificationUnreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Language Switcher */}
            <button
              onClick={switchLanguage}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-colors"
            >
              {otherLangLabel}
            </button>

            {!isAuthenticated ? (
              <>
                <Link
                  href={`/${lang}/auth/signin`}
                  className="px-4 py-2 rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-sm"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href={`/${lang}/auth/signup`}
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors text-sm"
                >
                  {t('signUp')}
                </Link>
                <Link
                  href={`/${lang}/post-ad`}
                  className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-105"
                >
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                  {/* Button Content */}
                  <div className="relative flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span>{t('postFreeAd')}</span>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {/* Staff Interface (Editors & Super Admins) */}
                {isStaff ? (
                  <>
                    {/* Role-based dashboard links */}
                    {currentUser?.role === 'super_admin' ? (
                      <Link
                        href={`/${lang}/super-admin/dashboard`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all"
                      >
                        <span>🛡️</span>
                        {t('superAdminPanel')}
                      </Link>
                    ) : (
                      <Link
                        href={`/${lang}/editor/dashboard`}
                        className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all duration-200 text-center"
                      >
                        {t('editorDashboard')}
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {/* Regular User Interface with Avatar Dropdown */}
                    <Link
                      href={`/${lang}/post-ad`}
                      className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-105"
                    >
                      {/* Glow Effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                      {/* Button Content */}
                      <div className="relative flex items-center gap-2">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>{t('postFreeAd')}</span>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                      </div>
                    </Link>

                    {/* Profile Avatar Dropdown */}
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={handleDropdownToggle}
                        className="rounded-full hover:ring-2 hover:ring-rose-500 transition-all cursor-pointer p-0"
                        aria-label="Profile menu"
                        aria-expanded={profileDropdownOpen}
                        aria-haspopup="true"
                      >
                        <UserAvatar
                          src={user?.avatar}
                          name={user?.fullName}
                          size="md"
                          borderColor="none"
                          showBorder={false}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {profileDropdownOpen && (
                        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg min-w-[200px] z-50 overflow-hidden border border-gray-100">
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="font-semibold text-gray-900 text-sm">
                              {user?.fullName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {user?.email}
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <Link
                              href={`/${lang}/profile`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 no-underline transition-colors"
                            >
                              <User className="w-4 h-4 text-gray-500" />
                              {t('myProfile')}
                            </Link>

                            <Link
                              href={`/${lang}/dashboard`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 no-underline transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-500" />
                              {t('dashboard')}
                            </Link>

                            {/* View My Shop - for all users with shop slug */}
                            {user && (user.customShopSlug || user.shopSlug) && (
                              <Link
                                href={`/${lang}/shop/${user.customShopSlug || user.shopSlug}`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={`block w-full px-4 py-2.5 text-left text-sm font-medium no-underline transition-colors ${(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified')
                                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border-l-4 border-purple-500'
                                    : user.individualVerified
                                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 hover:from-blue-100 hover:to-cyan-100 border-l-4 border-blue-500'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Store className="w-4 h-4 flex-shrink-0" />
                                  <span>{t('myShop')}</span>
                                  {(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                                    <Image src="/golden-badge.png" alt="Verified Business" title="Verified Business" width={20} height={20} className="ml-auto flex-shrink-0" />
                                  )}
                                  {user.individualVerified && !(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                                    <Image src="/blue-badge.png" alt="Verified Individual" title="Verified Individual" width={20} height={20} className="ml-auto flex-shrink-0" />
                                  )}
                                </div>
                              </Link>
                            )}
                          </div>

                          {/* Sign Out */}
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              {t('signOut')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Slide-in Drawer */}
      <div className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer Panel */}
        <div className={`absolute top-0 left-0 h-full w-[75vw] max-w-[300px] bg-white shadow-xl transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href={`/${lang}`} onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/logo.png"
                alt={siteName}
                width={84}
                height={40}
                className="h-8 object-contain"
                style={{ width: 'auto' }}
              />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex flex-col p-4 pb-24 gap-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
            {!isStaff && (
              <>
                <Link href={`/${lang}/ads`} onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
                  {t('searchAds')}
                </Link>
                <Link href={`/${lang}/verification`} onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
                  {isUserVerified ? t('verification') : t('getVerified')}
                </Link>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-2" />

            {!isAuthenticated ? (
              <div className="flex flex-col gap-3 mt-2">
                <Link href={`/${lang}/auth/signin`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-center">
                  {t('signIn')}
                </Link>
                <Link href={`/${lang}/auth/signup`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors text-center">
                  {t('signUp')}
                </Link>
              </div>
            ) : (
              <>
                {currentUser?.role === 'super_admin' ? (
                  <Link href={`/${lang}/super-admin/dashboard`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors text-center">
                    🛡️ {t('superAdminPanel')}
                  </Link>
                ) : currentUser?.role === 'editor' ? (
                  <Link href={`/${lang}/editor/dashboard`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all text-center">
                    {t('editorDashboard')}
                  </Link>
                ) : (
                  <>
                    <Link href={`/${lang}/profile`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
                      <User className="w-5 h-5 text-gray-500" />
                      {t('myProfile')}
                    </Link>
                    <Link href={`/${lang}/dashboard`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
                      <LayoutDashboard className="w-5 h-5 text-gray-500" />
                      {t('dashboard')}
                    </Link>
                    <Link href={`/${lang}/notifications`} onClick={() => setMobileMenuOpen(false)} className="relative flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
                      <Bell className="w-5 h-5 text-gray-500" />
                      {t('notifications') || 'Notifications'}
                      {notificationUnreadCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-[20px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                        </span>
                      )}
                    </Link>

                    {/* My Shop - for all users with shop slug */}
                    {user && (user.customShopSlug || user.shopSlug) && (
                      <Link
                        href={`/${lang}/shop/${user.customShopSlug || user.shopSlug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`py-3 px-3 font-medium flex items-center gap-3 rounded-lg transition-colors ${(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified')
                            ? 'text-purple-600 hover:text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500'
                            : user.individualVerified
                              ? 'text-blue-600 hover:text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500'
                              : 'text-gray-700 hover:text-rose-500 hover:bg-gray-50'
                          }`}
                      >
                        <Store className="w-5 h-5 flex-shrink-0" />
                        <span>{t('myShop')}</span>
                        {(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                          <Image src="/golden-badge.png" alt="Verified Business" title="Verified Business" width={20} height={20} className="ml-auto flex-shrink-0" />
                        )}
                        {user.individualVerified && !(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                          <Image src="/blue-badge.png" alt="Verified Individual" title="Verified Individual" width={20} height={20} className="ml-auto flex-shrink-0" />
                        )}
                      </Link>
                    )}
                  </>
                )}

                {/* Only show Sign Out for regular users (not staff) in mobile */}
                {!isStaff && (
                  <>
                    <div className="border-t border-gray-200 my-2" />
                    <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="px-4 py-2.5 rounded-lg font-semibold cursor-pointer bg-transparent text-red-600 border-2 border-red-600 transition-all hover:bg-red-600 hover:text-white w-full">
                      {t('signOut')}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Support & Help Links */}
            <div className="border-t border-gray-200 my-2" />
            <Link href={`/${lang}/help`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('helpCenter')}
            </Link>
            <Link href={`/${lang}/faq`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('faq')}
            </Link>
            <Link href={`/${lang}/support/tickets`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              {t('supportTickets')}
            </Link>
            <Link href={`/${lang}/contact`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-gray-700 hover:text-rose-500 hover:bg-gray-50 py-3 px-3 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
