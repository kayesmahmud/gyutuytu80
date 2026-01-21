import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/config';
import { apiClient } from '../../lib/api';
import { useImagePicker } from '../../hooks/useImagePicker';
import type { PostAdStackParamList } from '../../navigation/types';

const MAX_IMAGES = 10;

type PostAdRouteProp = RouteProp<PostAdStackParamList, 'PostAd'>;

interface SelectedItem {
  id: number;
  name: string;
  slug: string;
}

export default function PostAdScreen({ navigation }: any) {
  const route = useRoute<PostAdRouteProp>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    isNegotiable: false,
  });
  const [selectedCategory, setSelectedCategory] = useState<SelectedItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedItem | null>(null);

  // Image picker hook
  const {
    images,
    pickImages,
    takePhoto,
    removeImage,
    clearImages,
    loading: imageLoading,
  } = useImagePicker();

  const handleAddPhotos = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImages(remainingSlots);
          }
        }
      );
    } else {
      Alert.alert('Add Photos', 'Choose an option', [
        { text: 'Take Photo', onPress: () => takePhoto() },
        { text: 'Choose from Library', onPress: () => pickImages(remainingSlots) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // Update state when returning from SelectCategory/SelectLocation
  useEffect(() => {
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
    }
    if (route.params?.selectedLocation) {
      setSelectedLocation(route.params.selectedLocation);
    }
  }, [route.params?.selectedCategory, route.params?.selectedLocation]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !selectedCategory || !selectedLocation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('categoryId', selectedCategory.id.toString());
      data.append('locationId', selectedLocation.id.toString());
      data.append('isNegotiable', formData.isNegotiable.toString());

      // Append images to FormData
      images.forEach((image, index) => {
        data.append('images', {
          uri: image.uri,
          type: image.mimeType || 'image/jpeg',
          name: image.fileName || `photo-${index}.jpg`,
        } as any);
      });

      const response = await apiClient.createAd(data);

      if (response.success) {
        Alert.alert('Success', 'Your ad has been posted!', [
          { text: 'OK', onPress: () => navigation.navigate('HomeTab') },
        ]);
        // Reset form
        setFormData({ title: '', description: '', price: '', isNegotiable: false });
        setSelectedCategory(null);
        setSelectedLocation(null);
        clearImages();
      } else {
        Alert.alert('Error', response.error || 'Failed to post ad');
      }
    } catch (error) {
      console.error('Create ad error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Category Selection */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => navigation.navigate('SelectCategory')}
      >
        <Text style={styles.selectLabel}>Category *</Text>
        <View style={styles.selectValue}>
          <Text style={selectedCategory ? styles.selectValueText : styles.selectPlaceholder}>
            {selectedCategory?.name || 'Select a category'}
          </Text>
          <Text style={styles.selectArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ad Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., iPhone 15 Pro Max 256GB"
          placeholderTextColor={COLORS.gray[400]}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          maxLength={100}
        />
        <Text style={styles.charCount}>{formData.title.length}/100</Text>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item in detail..."
          placeholderTextColor={COLORS.gray[400]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={6}
          maxLength={5000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{formData.description.length}/5000</Text>
      </View>

      {/* Price */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price (NPR) *</Text>
        <TextInput
          style={styles.input}
          placeholder="50000"
          placeholderTextColor={COLORS.gray[400]}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="numeric"
        />
      </View>

      {/* Negotiable */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setFormData({ ...formData, isNegotiable: !formData.isNegotiable })}
      >
        <View style={[styles.checkbox, formData.isNegotiable && styles.checkboxChecked]}>
          {formData.isNegotiable && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Price is negotiable</Text>
      </TouchableOpacity>

      {/* Location Selection */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => navigation.navigate('SelectLocation')}
      >
        <Text style={styles.selectLabel}>Location *</Text>
        <View style={styles.selectValue}>
          <Text style={selectedLocation ? styles.selectValueText : styles.selectPlaceholder}>
            {selectedLocation?.name || 'Select location'}
          </Text>
          <Text style={styles.selectArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Photos */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Photos * ({images.length}/{MAX_IMAGES})</Text>

        {/* Image Grid */}
        {images.length > 0 && (
          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={`img-${index}`} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Add Photos Button */}
        {images.length < MAX_IMAGES && (
          <TouchableOpacity
            style={[styles.photoUpload, images.length > 0 && styles.photoUploadSmall]}
            onPress={handleAddPhotos}
            disabled={imageLoading}
          >
            {imageLoading ? (
              <ActivityIndicator color={COLORS.gray[500]} />
            ) : (
              <>
                <Text style={styles.photoUploadIcon}>📷</Text>
                <Text style={styles.photoUploadText}>
                  {images.length === 0 ? 'Add Photos' : 'Add More'}
                </Text>
                <Text style={styles.photoUploadHint}>
                  {images.length === 0 ? 'Up to 10 photos' : `${MAX_IMAGES - images.length} remaining`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitButtonText}>Post Ad</Text>
        )}
      </TouchableOpacity>

      {/* Bottom Padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inputGroup: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  textArea: {
    height: 150,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  selectValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectValueText: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  selectPlaceholder: {
    fontSize: 16,
    color: COLORS.gray[400],
  },
  selectArrow: {
    fontSize: 20,
    color: COLORS.gray[400],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: 2,
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  photoUpload: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  photoUploadSmall: {
    padding: 16,
  },
  photoUploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  photoUploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  photoUploadHint: {
    fontSize: 12,
    color: COLORS.gray[400],
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
