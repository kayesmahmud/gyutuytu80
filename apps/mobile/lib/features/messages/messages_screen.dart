import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';

import '../../core/api/api_config.dart';
import '../../core/api/message_client.dart';
import '../../core/models/message.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/widgets/main_app_bar.dart';
import '../../core/widgets/main_drawer.dart';
import '../../core/widgets/login_required_widget.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/skeleton_data.dart';
import '../../core/widgets/staggered_fade_in.dart';
import '../../core/widgets/floating_widget.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  @override
  void initState() {
    super.initState();
    // Refresh conversations when entering the screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated) {
        context.read<ChatProvider>().loadConversations();
        context.read<ChatProvider>().loadAnnouncements();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final chatProvider = context.watch<ChatProvider>();

    if (!authProvider.isLoggedIn) {
      return Scaffold(
        appBar: const MainAppBar(),
        drawer: const MainDrawer(),
        body: LoginRequiredWidget(
          icon: LucideIcons.messageCircle,
          title: 'messages.loginToView'.tr(),
          subtitle: 'messages.loginSubtitle'.tr(),
        ),
      );
    }

    if (chatProvider.isLoading && chatProvider.conversations.isEmpty) {
      final fakeConversations = SkeletonData.fakeConversations(5);
      return Scaffold(
        appBar: const MainAppBar(),
        drawer: const MainDrawer(),
        body: Skeletonizer(
          enabled: true,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: 5,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) => _buildConversationItem(
              context,
              fakeConversations[index],
              false,
            ),
          ),
        ),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: MainAppBar(
          bottom: TabBar(
            labelColor: const Color(0xFF2563EB),
            unselectedLabelColor: Colors.grey[600],
            indicatorColor: const Color(0xFF2563EB),
            indicatorWeight: 3,
            labelStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
            tabs: [
              Tab(text: 'messages.chats'.tr()),
              Consumer<ChatProvider>(
                builder: (context, chatProvider, _) {
                  final unread = chatProvider.unreadAnnouncementsCount;
                  return Tab(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('messages.announcements'.tr()),
                        if (unread > 0) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDC143C),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$unread',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
        drawer: const MainDrawer(),
        floatingActionButton: FloatingActionButton(
          backgroundColor: const Color(0xFFDC143C),
          onPressed: () => _showNewConversationSheet(context),
          child: const Icon(LucideIcons.pencil, color: Colors.white),
        ),
        body: TabBarView(
          children: [_buildChatsTab(), _buildAnnouncementsTab()],
        ),
      ),
    );
  }

  // ==========================================
  // CHATS TAB
  // ==========================================

  Widget _buildChatsTab() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        if (chatProvider.isLoading && chatProvider.conversations.isEmpty) {
          final fakeConversations = SkeletonData.fakeConversations(5);
          return Skeletonizer(
            enabled: true,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: 5,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) => _buildConversationItem(
                context,
                fakeConversations[index],
                false,
              ),
            ),
          );
        }

        if (chatProvider.error != null && chatProvider.conversations.isEmpty) {
          return _buildErrorState(chatProvider);
        }

        if (chatProvider.conversations.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: () async {
            await chatProvider.loadConversations();
            HapticFeedback.mediumImpact();
          },
          child: Column(
            children: [
              _buildConnectionStatus(chatProvider),
              Expanded(
                child: ListView.separated(
                  cacheExtent: 500,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: chatProvider.conversations.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final conversation = chatProvider.conversations[index];
                    return StaggeredFadeIn(
                      index: index,
                      beginOffset: const Offset(0.1, 0),
                      child: _buildConversationItem(
                        context,
                        conversation,
                        chatProvider.isUserOnline(conversation.otherUserId),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildConnectionStatus(ChatProvider chatProvider) {
    if (chatProvider.isConnected) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.orange.shade100,
      child: Row(
        children: [
          Icon(LucideIcons.cloudOff, size: 16, color: Colors.orange.shade800),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'messages.offlineMode'.tr(),
              style: TextStyle(fontSize: 12, color: Colors.orange.shade800),
            ),
          ),
          TextButton(
            onPressed: () => chatProvider.reconnect(),
            child: Text('common.retry'.tr()),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationItem(
    BuildContext context,
    Conversation conversation,
    bool isOnline,
  ) {
    final avatarUrl = conversation.otherUserAvatar != null
        ? ApiConfig.getAvatarUrl(conversation.otherUserAvatar)
        : null;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          FadeScaleRoute(
            builder: (_) => ChatScreen(
              conversationId: conversation.id,
              recipientName: conversation.otherUserName,
              recipientAvatar: avatarUrl,
              adTitle: conversation.adTitle,
            ),
          ),
        ).then((_) {
          if (context.mounted) {
            context.read<ChatProvider>().loadConversations();
          }
        });
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: avatarUrl != null
                      ? CachedNetworkImageProvider(avatarUrl)
                      : null,
                  child: avatarUrl == null
                      ? Text(
                          conversation.otherUserName.isNotEmpty
                              ? conversation.otherUserName[0].toUpperCase()
                              : '?',
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[600],
                          ),
                        )
                      : null,
                ),
                if (isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          conversation.otherUserName,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: conversation.hasUnread
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: const Color(0xFF111827),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTime(conversation.lastMessageAt),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: conversation.hasUnread
                              ? const Color(0xFFDC143C)
                              : Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.lastMessage.isNotEmpty
                              ? conversation.lastMessage
                              : 'No messages yet',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: conversation.hasUnread
                                ? FontWeight.w600
                                : FontWeight.normal,
                            color: conversation.hasUnread
                                ? Colors.grey[800]
                                : Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.hasUnread)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC143C),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${conversation.unreadCount}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (conversation.adTitle != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.tag,
                          size: 14,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            conversation.adTitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.grey[500],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // ANNOUNCEMENTS TAB
  // ==========================================

  Widget _buildAnnouncementsTab() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        if (chatProvider.announcementsLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (chatProvider.announcements.isEmpty) {
          return _buildEmptyAnnouncementsState();
        }

        return RefreshIndicator(
          onRefresh: () async {
            await chatProvider.loadAnnouncements();
            HapticFeedback.mediumImpact();
          },
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: chatProvider.announcements.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final announcement = chatProvider.announcements[index];
              return _buildAnnouncementItem(
                context,
                announcement,
                chatProvider,
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildAnnouncementItem(
    BuildContext context,
    Announcement announcement,
    ChatProvider chatProvider,
  ) {
    return InkWell(
      onTap: () {
        if (!announcement.isRead) {
          chatProvider.markAnnouncementRead(announcement.id);
        }
        _showAnnouncementDetail(context, announcement);
      },
      child: Container(
        color: announcement.isRead ? null : const Color(0xFFEFF6FF),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: announcement.isRead
                    ? Colors.grey[100]
                    : const Color(0xFF3B82F6).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                LucideIcons.megaphone,
                size: 22,
                color: announcement.isRead
                    ? Colors.grey[400]
                    : const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          announcement.title,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: announcement.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: const Color(0xFF111827),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTime(announcement.createdAt),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    announcement.content,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAnnouncementDetail(
    BuildContext context,
    Announcement announcement,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.all(24),
          child: ListView(
            controller: scrollController,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.megaphone,
                      color: Colors.white,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        announcement.title,
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                DateFormat(
                  'MMMM d, yyyy · h:mm a',
                ).format(announcement.createdAt),
                style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500]),
              ),
              const SizedBox(height: 16),
              Text(
                announcement.content,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  color: Colors.grey[800],
                  height: 1.6,
                ),
              ),
              if (announcement.readAt != null) ...[
                const SizedBox(height: 24),
                Text(
                  'Read on ${DateFormat('MMM d, yyyy · h:mm a').format(announcement.readAt!)}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[400],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // NEW CONVERSATION SEARCH
  // ==========================================

  void _showNewConversationSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _NewConversationSheet(
        onUserSelected: (user) async {
          Navigator.pop(context);

          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => const Center(child: CircularProgressIndicator()),
          );

          final conversation = await context
              .read<ChatProvider>()
              .getOrCreateConversation(participantId: user.id);

          if (!context.mounted) return;
          Navigator.pop(context); // Close loading

          if (conversation != null) {
            final avatarUrl = user.avatar != null
                ? ApiConfig.getAvatarUrl(user.avatar)
                : null;
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ChatScreen(
                  conversationId: conversation.id,
                  recipientName: user.fullName,
                  recipientAvatar: avatarUrl,
                ),
              ),
            ).then((_) {
              if (context.mounted) {
                context.read<ChatProvider>().loadConversations();
              }
            });
          }
        },
      ),
    );
  }

  // ==========================================
  // EMPTY / ERROR STATES
  // ==========================================

  Widget _buildErrorState(ChatProvider chatProvider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertCircle, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              chatProvider.error ?? 'Failed to load conversations',
              style: GoogleFonts.inter(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => chatProvider.loadConversations(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC143C),
                foregroundColor: Colors.white,
              ),
              child: Text('common.retry'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return StaggeredFadeIn(
      index: 0,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FloatingWidget(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    LucideIcons.messageCircle,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'messages.noMessages'.tr(),
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'messages.startConversation'.tr(),
                style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyAnnouncementsState() {
    return StaggeredFadeIn(
      index: 0,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FloatingWidget(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    LucideIcons.megaphone,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'messages.noAnnouncements'.tr(),
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'messages.announcementsSubtitle'.tr(),
                style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';

    return DateFormat('MMM d').format(time);
  }
}

// ==========================================
// NEW CONVERSATION BOTTOM SHEET
// ==========================================

class _NewConversationSheet extends StatefulWidget {
  final Function(SearchUser) onUserSelected;

  const _NewConversationSheet({required this.onUserSelected});

  @override
  State<_NewConversationSheet> createState() => _NewConversationSheetState();
}

class _NewConversationSheetState extends State<_NewConversationSheet> {
  final TextEditingController _searchController = TextEditingController();
  final MessageClient _messageClient = MessageClient();
  List<SearchUser> _results = [];
  bool _isSearching = false;
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _search(query);
    });
  }

  Future<void> _search(String query) async {
    if (query.length < 2) {
      setState(() => _results = []);
      return;
    }

    setState(() => _isSearching = true);
    final response = await _messageClient.searchUsers(query);

    if (mounted) {
      setState(() {
        _isSearching = false;
        _results = response.success ? (response.data ?? []) : [];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'messages.newMessage'.tr(),
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchController,
              autofocus: true,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'messages.searchUsers'.tr(),
                prefixIcon: const Icon(LucideIcons.search),
                suffixIcon: _isSearching
                    ? const Padding(
                        padding: EdgeInsets.all(14),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
            ),
            const SizedBox(height: 8),
            if (_searchController.text.length < 2 && _results.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'messages.typeToSearch'.tr(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                  ),
                ),
              )
            else
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final user = _results[index];
                    final avatarUrl = user.avatar != null
                        ? ApiConfig.getAvatarUrl(user.avatar)
                        : null;

                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.grey[200],
                        backgroundImage: avatarUrl != null
                            ? CachedNetworkImageProvider(avatarUrl)
                            : null,
                        child: avatarUrl == null
                            ? Text(
                                user.fullName.isNotEmpty
                                    ? user.fullName[0].toUpperCase()
                                    : '?',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[600],
                                ),
                              )
                            : null,
                      ),
                      title: Text(
                        user.fullName,
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                      ),
                      onTap: () => widget.onUserSelected(user),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
