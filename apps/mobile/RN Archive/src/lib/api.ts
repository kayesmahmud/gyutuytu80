import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User type for auth responses
export interface ApiUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  individualVerified: boolean;
  businessVerificationStatus?: string | null;
  businessName?: string | null;
}

// Auth response types
export interface VerifyOtpResponse {
  token: string;
  user: ApiUser;
}

export interface GetMeResponse extends ApiUser {}

// Category type
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

// Ad types
export interface ApiAd {
  id: number;
  title: string;
  slug: string;
  seoSlug?: string;
  price: number;
  primaryImage?: string | null;
  location?: { name: string } | null;
  category?: { name: string } | null;
  createdAt?: string;
  publishedAt?: string;
}

export interface ApiAdDetail extends ApiAd {
  description: string;
  isNegotiable: boolean;
  user?: {
    fullName: string;
    phone?: string | null;
  };
  attributes?: Record<string, any>;
}

export interface AdsListResponse {
  ads: ApiAd[];
  total?: number;
  page?: number;
  totalPages?: number;
}

// Shop type
export interface ApiShop {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  cover?: string | null;
}

// Messaging types
export interface ApiConversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date | string;
  unreadCount: number;
  adTitle?: string;
  adId?: number;
}

export interface ApiMessage {
  id: number;
  senderId: number;
  recipientId: number;
  adId: number;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints (Phone OTP only - email auth removed)
  async sendOtp(phone: string) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string) {
    return this.request<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async getMe() {
    return this.request<GetMeResponse>('/auth/me');
  }

  // Ads endpoints
  async getAds(params?: {
    category?: string;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<AdsListResponse>(`/ads${queryString}`);
  }

  async getAdBySlug(slug: string) {
    return this.request<ApiAdDetail>(`/ads/${slug}`);
  }

  async createAd(data: FormData) {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/ads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data, // FormData for file uploads
      });

      const result = await response.json();
      return { success: response.ok, data: result };
    } catch (error) {
      return { success: false, error: 'Failed to create ad' };
    }
  }

  async getMyAds() {
    return this.request<ApiAd[]>('/ads/my-ads');
  }

  // Categories
  async getCategories() {
    return this.request<ApiCategory[]>('/categories');
  }

  // Locations
  async getLocations(params?: { type?: string }) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/locations${queryString}`);
  }

  // Profile
  async updateProfile(data: { fullName?: string; phone?: string; locationId?: number }) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Favorites
  async getFavorites() {
    return this.request<ApiAd[]>('/favorites');
  }

  async addFavorite(adId: number) {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    });
  }

  async removeFavorite(adId: number) {
    return this.request(`/favorites/${adId}`, {
      method: 'DELETE',
    });
  }

  // Shop
  async getShopBySlug(slug: string) {
    return this.request<ApiShop>(`/shops/${slug}`);
  }

  // Messaging
  async getConversations() {
    return this.request<ApiConversation[]>('/api/messages/conversations');
  }

  async getMessages(conversationId: number) {
    return this.request<ApiMessage[]>(`/api/messages/${conversationId}`);
  }

  async sendMessage(data: { recipientId: number; adId: number; message: string }) {
    return this.request<ApiMessage>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUnreadCount() {
    return this.request<{ unread_messages: number }>('/api/messages/unread-count');
  }
}

export const apiClient = new ApiClient();
