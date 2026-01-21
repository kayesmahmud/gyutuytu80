import React from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import AdCard from './AdCard';

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

interface AdsListProps {
  ads: Ad[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  numColumns?: number;
}

export default function AdsList({
  ads,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  ListHeaderComponent,
  ListEmptyComponent,
  numColumns = 2,
}: AdsListProps) {
  if (isLoading && ads.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#f43f5e" />
        <Text className="text-gray-500 mt-4">Loading ads...</Text>
      </View>
    );
  }

  const DefaultEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">📭</Text>
      <Text className="text-gray-500 text-lg font-medium">No ads found</Text>
      <Text className="text-gray-400 text-sm mt-1">Try adjusting your filters</Text>
    </View>
  );

  return (
    <FlashList
      data={ads}
      renderItem={({ item }) => (
        <View className="flex-1 p-1">
          <AdCard ad={item} />
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      numColumns={numColumns}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#f43f5e']}
            tintColor="#f43f5e"
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent || DefaultEmptyComponent}
      contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
