import 'dart:async';
import 'dart:developer' as developer;
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:easy_localization/easy_localization.dart';

import '../../core/widgets/staggered_fade_in.dart';
import '../../core/widgets/floating_widget.dart';
import '../../core/api/api_config.dart';
import '../../core/api/message_client.dart';
import '../../core/utils/localized_helpers.dart';
import '../../core/models/message.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/services/notification_service.dart';

/// Chat Screen - individual conversation view
class ChatScreen extends StatefulWidget {
  final int conversationId;
  final String recipientName;
  final String? recipientAvatar;
  final String? adTitle;
  final String? initialMessage;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.recipientName,
    this.recipientAvatar,
    this.adTitle,
    this.initialMessage,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  final ImagePicker _imagePicker = ImagePicker();
  final MessageClient _messageClient = MessageClient();

  int? _currentUserId;
  bool _isTyping = false;
  Timer? _typingDebounce;
  File? _pendingImage;
  bool _isUploading = false;
  int _initialMessageCount = 0;
  bool _initialLoadDone = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialMessage != null) {
      _messageController.text = widget.initialMessage!;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _initialize());
    _messageController.addListener(_onTyping);
  }

  Future<void> _initialize() async {
    // Suppress push notifications for this conversation while viewing
    NotificationService().setActiveConversation(widget.conversationId);

    final authProvider = context.read<AuthProvider>();
    _currentUserId = authProvider.userId;

    if (_currentUserId != null) {
      final chatProvider = context.read<ChatProvider>();
      await chatProvider.loadMessages(widget.conversationId);
      chatProvider.markAsRead(widget.conversationId);

      if (mounted) {
        _initialMessageCount = chatProvider.getMessages(widget.conversationId).length;
        _initialLoadDone = true;
        setState(() {});
        _scrollToBottom();
      }
    }
  }

  void _onTyping() {
    if (!mounted) return;
    final chatProvider = context.read<ChatProvider>();

    if (_messageController.text.isNotEmpty && !_isTyping) {
      _isTyping = true;
      chatProvider.startTyping(widget.conversationId);
    }

    _typingDebounce?.cancel();
    _typingDebounce = Timer(const Duration(seconds: 2), () {
      if (_isTyping && mounted) {
        _isTyping = false;
        context.read<ChatProvider>().stopTyping(widget.conversationId);
      }
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    _isTyping = false;
    final chatProvider = context.read<ChatProvider>();
    chatProvider.stopTyping(widget.conversationId);

    final success = await chatProvider.sendMessage(
      conversationId: widget.conversationId,
      content: text,
    );
    if (kDebugMode) developer.log('Sent message result: $success', name: 'ChatScreen');

    if (success) {
      _scrollToBottom();
    }
  }

  Future<void> _pickAndSendImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 80,
    );
    if (picked == null) return;

    // Validate file size (max 5MB)
    final file = File(picked.path);
    final fileSize = await file.length();
    if (fileSize > 5 * 1024 * 1024) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('messages.imageSizeError'.tr()),
          ),
        );
      }
      return;
    }

    setState(() {
      _pendingImage = file;
    });
  }

  Future<void> _sendImage() async {
    if (_pendingImage == null) return;

    setState(() => _isUploading = true);

    try {
      final uploadResult = await _messageClient.uploadImage(_pendingImage!);
      if (uploadResult.success && uploadResult.data != null) {
        if (mounted) {
          await context.read<ChatProvider>().sendMessage(
                conversationId: widget.conversationId,
                content: 'Image',
                type: MessageType.image,
                attachmentUrl: uploadResult.data!,
              );
        }
        setState(() {
          _pendingImage = null;
          _isUploading = false;
        });
        _scrollToBottom();
      } else {
        setState(() => _isUploading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('messages.failedToUpload'.tr())),
          );
        }
      }
    } catch (e) {
      setState(() => _isUploading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload error: $e')),
        );
      }
    }
  }

  void _cancelImage() {
    setState(() => _pendingImage = null);
  }

  @override
  void dispose() {
    // Clear active conversation so notifications resume
    NotificationService().setActiveConversation(null);
    _typingDebounce?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Watch global provider
    final chatProvider = context.watch<ChatProvider>();

    if (chatProvider.isLoading && chatProvider.getMessages(widget.conversationId).isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: Text(widget.recipientName),
        ),
        body: Skeletonizer(
          enabled: true,
          child: ListView.builder(
            reverse: true,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            itemCount: 6,
            itemBuilder: (context, index) {
              final isMe = index % 3 == 0;
              return Align(
                alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.7,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: isMe ? 120 : 180,
                        height: 14,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 6),
                      Container(width: 50, height: 10, color: Colors.white),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: _buildAppBar(),
      body: Column(
        children: [
          if (widget.adTitle != null) _buildAdBanner(),
          Expanded(child: _buildMessageList()),
          _buildTypingIndicator(),
          if (_pendingImage != null) _buildImagePreview(),
          _buildInputArea(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 1,
      leading: IconButton(
        icon: const Icon(LucideIcons.arrowLeft, color: Colors.black87),
        onPressed: () => Navigator.pop(context),
      ),
      title: Consumer<ChatProvider>(
        builder: (context, chatProvider, child) {
          final isOnline = chatProvider.isUserOnline(widget.conversationId);
          return Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: Colors.grey[200],
                backgroundImage: widget.recipientAvatar != null
                    ? CachedNetworkImageProvider(widget.recipientAvatar!)
                    : null,
                child: widget.recipientAvatar == null
                    ? Text(
                        widget.recipientName.isNotEmpty
                            ? widget.recipientName[0].toUpperCase()
                            : '?',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[600],
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.recipientName,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (isOnline)
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'messages.online'.tr(),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF10B981),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
      actions: [
        IconButton(
          icon: const Icon(LucideIcons.moreVertical, color: Colors.black54),
          onPressed: () {
            // TODO: Show options menu
          },
        ),
      ],
    );
  }

  Widget _buildAdBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.tag, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'messages.aboutAd'.tr(args: [widget.adTitle!]),
              style: GoogleFonts.inter(
                fontSize: 13,
                color: Colors.grey[700],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        final messages = chatProvider.getMessages(widget.conversationId);

        if (kDebugMode) developer.log('Building list. Count: ${messages.length}', name: 'ChatScreen');

        if (messages.isEmpty) {
          return _buildEmptyState();
        }

        return ListView.builder(
          controller: _scrollController,
          reverse: true,
          cacheExtent: 500,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          itemCount: messages.length,
          itemBuilder: (context, index) {
            final message = messages[index];
            final showDate = _shouldShowDate(messages, index);
            final isMe = message.senderId == _currentUserId;
            if (kDebugMode) developer.log('Msg $index: sender=${message.senderId}, me=$_currentUserId, isMe=$isMe, content=${message.content}', name: 'ChatScreen');

            final isNewMessage = _initialLoadDone && index < (messages.length - _initialMessageCount);
            final bubble = Column(
              children: [
                if (showDate) _buildDateHeader(message.createdAt),
                _buildMessageBubble(message, isMe),
              ],
            );

            if (!isNewMessage) return bubble;

            return StaggeredFadeIn(
              index: 0,
              duration: const Duration(milliseconds: 200),
              beginOffset: Offset(isMe ? 0.1 : -0.1, 0),
              child: bubble,
            );
          },
        );
      },
    );
  }

  bool _shouldShowDate(List<Message> messages, int index) {
    if (index == messages.length - 1) return true;

    final current = messages[index].createdAt;
    final previous = messages[index + 1].createdAt;

    return current.day != previous.day ||
        current.month != previous.month ||
        current.year != previous.year;
  }

  Widget _buildDateHeader(DateTime date) {
    final now = DateTime.now();
    String text;

    if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day) {
      text = 'messages.today'.tr();
    } else if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day - 1) {
      text = 'messages.yesterday'.tr();
    } else {
      text = formatNepalTime(date, 'MMMM d, yyyy');
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 12,
          color: Colors.grey[500],
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildMessageBubble(Message message, bool isMe) {
    if (message.isDeleted) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Align(
          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(18),
            ),
            child: Text(
              'messages.messageDeleted'.tr(),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ),
      );
    }

    final isImage = message.type == MessageType.image && message.attachmentUrl != null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          padding: isImage
              ? const EdgeInsets.all(4)
              : const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: isMe ? const Color(0xFFDC143C) : Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(18),
              topRight: const Radius.circular(18),
              bottomLeft: Radius.circular(isMe ? 18 : 4),
              bottomRight: Radius.circular(isMe ? 4 : 18),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (isImage)
                GestureDetector(
                  onTap: () => _showFullImage(context, message.attachmentUrl!),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CachedNetworkImage(
                      imageUrl: _getFullImageUrl(message.attachmentUrl!),
                      width: 220,
                      fit: BoxFit.cover,
                      memCacheWidth: 440,
                      fadeInDuration: const Duration(milliseconds: 200),
                      fadeOutDuration: const Duration(milliseconds: 200),
                      placeholder: (_, __) => Container(
                        width: 220,
                        height: 160,
                        color: Colors.grey[300],
                      ),
                      errorWidget: (_, __, ___) => Container(
                        width: 220,
                        height: 160,
                        color: Colors.grey[300],
                        child: const Icon(LucideIcons.imageOff, color: Colors.grey),
                      ),
                    ),
                  ),
                )
              else
                Text(
                  message.content,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    color: isMe ? Colors.white : Colors.black87,
                  ),
                ),
              const SizedBox(height: 4),
              Padding(
                padding: isImage ? const EdgeInsets.symmetric(horizontal: 8, vertical: 4) : EdgeInsets.zero,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      formatNepalTime(message.createdAt, 'h:mm a'),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: isMe
                            ? Colors.white.withValues(alpha: 0.7)
                            : Colors.grey[500],
                      ),
                    ),
                    if (message.isEdited) ...[
                      const SizedBox(width: 4),
                      Text(
                        'messages.edited'.tr(),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: isMe
                              ? Colors.white.withValues(alpha: 0.7)
                              : Colors.grey[500],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getFullImageUrl(String url) {
    if (url.startsWith('http')) return url;
    return '${ApiConfig.baseUrl.replaceFirst(RegExp(r'/api$'), '')}$url';
  }

  void _showFullImage(BuildContext context, String url) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            iconTheme: const IconThemeData(color: Colors.white),
          ),
          body: Center(
            child: InteractiveViewer(
              child: CachedNetworkImage(
                imageUrl: _getFullImageUrl(url),
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        final typingUsers = chatProvider.getTypingUsers(widget.conversationId);
        if (typingUsers.isEmpty) return const SizedBox.shrink();

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              SizedBox(
                width: 24,
                child: _TypingAnimation(),
              ),
              const SizedBox(width: 8),
              Text(
                'messages.typing'.tr(args: [widget.recipientName]),
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildImagePreview() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(top: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(
              _pendingImage!,
              width: 60,
              height: 60,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'messages.imageReady'.tr(),
              style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[700]),
            ),
          ),
          if (_isUploading)
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else ...[
            IconButton(
              icon: const Icon(LucideIcons.x, color: Colors.grey),
              onPressed: _cancelImage,
            ),
            IconButton(
              icon: const Icon(LucideIcons.send, color: Color(0xFFDC143C)),
              onPressed: _sendImage,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      focusNode: _focusNode,
                      decoration: InputDecoration(
                        hintText: 'messages.typeMessage'.tr(),
                        hintStyle: GoogleFonts.inter(
                          color: Colors.grey[500],
                          fontSize: 15,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      style: GoogleFonts.inter(fontSize: 15),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  IconButton(
                    icon: Icon(LucideIcons.paperclip, color: Colors.grey[600]),
                    onPressed: _pickAndSendImage,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(
                color: Color(0xFFDC143C),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.send,
                color: Colors.white,
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FloatingWidget(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                LucideIcons.messageCircle,
                size: 36,
                color: Colors.grey[400],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'messages.noMessagesYet'.tr(),
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'messages.startTheConversation'.tr(),
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}

/// Typing animation widget (three dots)
class _TypingAnimation extends StatefulWidget {
  @override
  State<_TypingAnimation> createState() => _TypingAnimationState();
}

class _TypingAnimationState extends State<_TypingAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            final delay = index * 0.15;
            final value = ((_controller.value - delay) % 1.0);
            final scale = 0.5 + (value < 0.5 ? value : 1 - value) * 0.5;

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 1.5),
              child: Transform.scale(
                scale: scale,
                child: Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: Colors.grey[400],
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
