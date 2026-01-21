import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { API_BASE_URL } from '../../constants/config';

interface Ad {
  id: number;
  title: string;
  price: number;
  primaryImage?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  createdAt?: string | Date;
  publishedAt?: string | Date;
  sellerName: string;
  isFeatured?: boolean;
  isUrgent?: boolean;
  isSticky?: boolean;
  condition?: string | null;
  seoSlug?: string;
  slug?: string;
  accountType?: string;
  businessVerificationStatus?: string;
  individualVerified?: boolean;
}

interface AdCardProps {
  ad: Ad;
}

// Helper to get full image URL
function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Remove /uploads prefix if present since API_BASE_URL already handles it
  const cleanPath = imagePath.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
}

export default function AdCard({ ad }: AdCardProps) {
  const navigation = useNavigation<any>();
  const imageUrl = getImageUrl(ad.primaryImage);

  const handlePress = () => {
    navigation.navigate('AdDetail', {
      slug: ad.seoSlug || ad.slug || `ad-${ad.id}`,
      adId: ad.id
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-xl overflow-hidden shadow-sm active:scale-[0.98]"
    >
      {/* Image Container */}
      <View className="relative w-full h-32 bg-gray-100">
        {/* Feature Badges */}
        {ad.isFeatured && (
          <View className="absolute top-1.5 left-1.5 bg-amber-500 rounded px-2 py-0.5 z-10">
            <Text className="text-white text-[10px] font-semibold">⭐</Text>
          </View>
        )}
        {ad.isUrgent && (
          <View className="absolute top-1.5 right-1.5 bg-red-500 rounded px-2 py-0.5 z-10">
            <Text className="text-white text-[10px] font-semibold">🔥</Text>
          </View>
        )}
        {ad.isSticky && !ad.isFeatured && !ad.isUrgent && (
          <View className="absolute top-1.5 left-1.5 bg-blue-500 rounded px-2 py-0.5 z-10">
            <Text className="text-white text-[10px] font-semibold">📌</Text>
          </View>
        )}

        {/* Condition Badge */}
        {ad.condition && (
          <View
            className={`absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 z-10 ${
              ad.condition === 'new'
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
          >
            <Text className="text-white text-[10px] font-semibold">
              {ad.condition === 'new' ? 'NEW' : 'USED'}
            </Text>
          </View>
        )}

        {/* Image */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            <Text className="text-4xl text-gray-600">
              {ad.categoryIcon || '📦'}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-2">
        {/* Title */}
        <Text
          className="text-xs font-semibold text-gray-900 mb-1"
          numberOfLines={1}
        >
          {ad.title}
        </Text>

        {/* Category */}
        {ad.categoryName && (
          <View className="flex-row items-center gap-1 mb-1">
            <Text className="text-[10px]">{ad.categoryIcon || '📁'}</Text>
            <Text className="text-[11px] text-gray-500" numberOfLines={1}>
              {ad.categoryName}
            </Text>
          </View>
        )}

        {/* Price */}
        <Text className="text-sm font-bold text-green-600 mb-1">
          {formatPrice(ad.price)}
        </Text>

        {/* Seller Info */}
        <View className="flex-row items-center gap-1 mb-0.5">
          <Text
            className="text-[10px] font-medium text-gray-700"
            numberOfLines={1}
            style={{ maxWidth: 90 }}
          >
            {ad.sellerName}
          </Text>
          {ad.accountType === 'business' &&
           (ad.businessVerificationStatus === 'verified' || ad.businessVerificationStatus === 'approved') && (
            <Text className="text-[10px]">✓</Text>
          )}
          {ad.accountType === 'individual' && ad.individualVerified && (
            <Text className="text-[10px] text-blue-500">✓</Text>
          )}
        </View>

        {/* Timestamp */}
        {(ad.publishedAt || ad.createdAt) && (
          <View className="flex-row items-center gap-0.5">
            <Text className="text-[10px]">🕐</Text>
            <Text className="text-[10px] text-gray-400" numberOfLines={1}>
              {formatDateTime(ad.publishedAt || ad.createdAt!)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
