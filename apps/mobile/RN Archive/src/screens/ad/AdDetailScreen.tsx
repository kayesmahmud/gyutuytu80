import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, API_BASE_URL } from '../../constants/config';
import { apiClient } from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to get full image URL
function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
}

interface AdDetail {
  id: number;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  images?: string[];
  thumbnail?: string;
  location?: { name: string } | null;
  category?: { name: string; icon?: string } | null;
  user?: {
    fullName: string;
    phone?: string | null;
  } | null;
  attributes?: Record<string, any>;
  createdAt?: string | null;
}

export default function AdDetailScreen({ route }: any) {
  const { slug } = route.params;
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadAd();
  }, [slug]);

  const loadAd = async () => {
    try {
      const response = await apiClient.getAdBySlug(slug);
      if (response.success && response.data) {
        setAd(response.data);
      }
    } catch (error) {
      console.error('Failed to load ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (ad?.user?.phone) {
      Linking.openURL(`tel:${ad.user.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (ad?.user?.phone) {
      const message = `Hi, I'm interested in your ad: ${ad.title}`;
      Linking.openURL(`whatsapp://send?phone=977${ad.user.phone}&text=${encodeURIComponent(message)}`);
    }
  };

  const toggleFavorite = async () => {
    if (!ad) return;
    try {
      if (isFavorite) {
        await apiClient.removeFavorite(ad.id);
      } else {
        await apiClient.addFavorite(ad.id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ad not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {ad.images && ad.images.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={ad.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(index);
                }}
                keyExtractor={(item, index) => `image-${index}`}
                renderItem={({ item }) => {
                  const imageUrl = getImageUrl(item);
                  return (
                    <View style={styles.imageSlide}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.image}
                          contentFit="cover"
                          transition={200}
                          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.imagePlaceholderText}>📷</Text>
                        </View>
                      )}
                    </View>
                  );
                }}
              />
              {/* Image Counter */}
              {ad.images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {ad.images.length}
                  </Text>
                </View>
              )}
              {/* Dot Indicators */}
              {ad.images.length > 1 && (
                <View style={styles.dotContainer}>
                  {ad.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentImageIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                {ad.category?.icon || '📷'} No Images
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Ad Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.price}>
            Rs. {ad.price.toLocaleString()}
            {ad.isNegotiable && <Text style={styles.negotiable}> (Negotiable)</Text>}
          </Text>
          <Text style={styles.title}>{ad.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📍 {ad.location?.name || 'Nepal'}</Text>
            <Text style={styles.metaText}>📁 {ad.category?.name}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{ad.description}</Text>
        </View>

        {/* Attributes */}
        {ad.attributes && Object.keys(ad.attributes).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            {Object.entries(ad.attributes).map(([key, value]) => (
              <View key={key} style={styles.attributeRow}>
                <Text style={styles.attributeKey}>{key}</Text>
                <Text style={styles.attributeValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Seller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>👤</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{ad.user?.fullName || 'Seller'}</Text>
              <Text style={styles.sellerMember}>Member since 2024</Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Text style={styles.callButtonText}>📞 Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
          <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.gray[500],
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePlaceholder: {
    height: 300,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 24,
    color: COLORS.gray[500],
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 20,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  infoContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  negotiable: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray[500],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 22,
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  attributeKey: {
    fontSize: 14,
    color: COLORS.gray[500],
    textTransform: 'capitalize',
  },
  attributeValue: {
    fontSize: 14,
    color: COLORS.gray[900],
    fontWeight: '500',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 24,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  sellerMember: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
