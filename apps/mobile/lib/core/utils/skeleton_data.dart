import '../models/ad.dart';
import '../models/message.dart';

/// Provides fake data for Skeletonizer skeleton screens.
/// The actual content doesn't matter — Skeletonizer renders it as shimmer shapes.
class SkeletonData {
  static List<AdWithDetails> fakeAds(int count) {
    final now = DateTime.now();
    return List.generate(
      count,
      (i) => AdWithDetails(
        id: i,
        userId: 0,
        title: 'Loading ad title here',
        description: 'Loading description text for skeleton placeholder',
        price: 99999,
        categoryId: 0,
        locationId: 0,
        slug: 'skeleton-$i',
        status: AdStatus.active,
        images: ['placeholder'],
        viewCount: 0,
        isNegotiable: false,
        createdAt: now,
        updatedAt: now,
        userName: 'Seller Name',
        userVerified: false,
        categoryName: 'Category',
        locationName: 'Location',
      ),
    );
  }

  static List<Conversation> fakeConversations(int count) {
    final now = DateTime.now();
    return List.generate(
      count,
      (i) => Conversation(
        id: i,
        otherUserId: 0,
        otherUserName: 'User Name Here',
        lastMessage: 'Last message preview text here',
        lastMessageAt: now,
        unreadCount: 0,
      ),
    );
  }
}
