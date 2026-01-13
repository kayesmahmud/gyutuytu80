'use client';

import { UserAvatar } from '@/components/ui/UserAvatar';

interface ProfileHeaderProps {
  displayName: string;
  email: string | null;
  avatar: string | null;
  accountType: string | null;
  isVerified: boolean;
  isVerifiedBusiness: boolean;
  createdAt: string | null;
}

export function ProfileHeader({
  displayName,
  email,
  avatar,
  accountType,
  isVerified,
  isVerifiedBusiness,
  createdAt,
}: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
      <div className="h-20 sm:h-32 bg-gradient-to-r from-primary to-pink-500"></div>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-8 sm:-mt-12">
          <UserAvatar
            src={avatar}
            name={displayName}
            size="2xl"
            borderColor={isVerifiedBusiness ? 'gold' : isVerified ? 'blue' : 'default'}
          />
          <div className="flex-1 sm:pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</h1>
              {isVerified && (
                <img
                  src={isVerifiedBusiness ? '/golden-badge.png' : '/blue-badge.png'}
                  alt={isVerifiedBusiness ? 'Verified Business' : 'Verified Individual'}
                  className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
                />
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-500">{email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                accountType === 'business'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {accountType === 'business' ? 'Business' : 'Individual'} Account
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500">
                Member since {new Date(createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
