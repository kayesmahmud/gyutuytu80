import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack (Modal)
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Register: undefined;
  PhoneLogin: undefined;
  OtpVerification: { phone: string; isLogin?: boolean };
  ForgotPassword: undefined;
  ProfileCompletion: { phone: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  PostAdTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

// Home Stack (inside HomeTab)
export type HomeStackParamList = {
  Home: undefined;
  AdDetail: { slug: string };
  CategoryList: { categorySlug: string; categoryName: string };
  Shop: { shopSlug: string };
};

// Search Stack
export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { query?: string; category?: string; location?: string };
  AdDetail: { slug: string };
};

// Post Ad Stack
export type PostAdStackParamList = {
  PostAd: {
    selectedCategory?: { id: number; name: string; slug: string };
    selectedLocation?: { id: number; name: string; slug: string };
  } | undefined;
  SelectCategory: undefined;
  SelectLocation: undefined;
  AdPreview: { adData: any };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyAds: undefined;
  AdDetail: { slug: string };
  Settings: undefined;
  ChangePassword: undefined;
  PhoneVerification: undefined;
};

// Messages Stack
export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: {
    conversationId?: number;
    recipientId: number;
    recipientName: string;
    adId?: number;
    adTitle?: string;
  };
};

// Root Navigator (combines Auth and Main)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  AuthModal: { screen?: keyof AuthStackParamList };
};

// Screen props helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type SearchScreenProps<T extends keyof SearchStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SearchStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
