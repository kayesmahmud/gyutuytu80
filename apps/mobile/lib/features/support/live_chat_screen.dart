import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:easy_localization/easy_localization.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'package:mobile/core/utils/localized_helpers.dart';
import 'package:mobile/core/utils/profanity_check.dart';

/// Live Chat — one endless conversation with support. Deliberately simpler
/// than a support ticket: no subject, no category, no status, nothing to
/// close. The AI assistant replies first and hands over to the team when it
/// cannot help; the user just keeps chatting either way.
const _kLiveChatPollInterval = Duration(seconds: 5);

class LiveChatScreen extends StatefulWidget {
  const LiveChatScreen({super.key});

  @override
  State<LiveChatScreen> createState() => _LiveChatScreenState();
}

class _LiveChatScreenState extends State<LiveChatScreen>
    with WidgetsBindingObserver {
  final _client = SupportClient();
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  List<SupportMessage> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  bool _isPolling = false;
  String? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
    _startPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _poll();
      _startPolling();
    } else {
      _pollTimer?.cancel();
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(_kLiveChatPollInterval, (_) => _poll());
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final response = await _client.getLiveChat();
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (response.hasData) {
        _messages = response.data!.messages;
      } else {
        _error = response.errorMessage;
      }
    });
    _scrollToBottom();
  }

  /// Silent refresh — replies from the AI or an editor appear on their own.
  Future<void> _poll() async {
    if (_isPolling || _isSending || !mounted) return;
    _isPolling = true;
    try {
      final response = await _client.getLiveChat();
      if (!mounted || !response.hasData) return;
      final fresh = response.data!.messages;
      if (fresh.length == _messages.length) return;
      setState(() => _messages = fresh);
      _scrollToBottom();
    } finally {
      _isPolling = false;
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    if (checkProfanity(text).hasProfanity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('liveChat.profanityWarning'.tr()),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() => _isSending = true);
    final response = await _client.sendLiveChatMessage(text);
    if (!mounted) return;

    setState(() {
      _isSending = false;
      if (response.hasData) {
        _messageController.clear();
        _messages = [..._messages, response.data!];
      }
    });

    if (!response.hasData) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response.errorMessage)),
      );
      return;
    }
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'liveChat.title'.tr(),
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1F2937),
              ),
            ),
            Text(
              'liveChat.subtitle'.tr(),
              style: GoogleFonts.inter(
                fontSize: 11,
                color: const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFE11D48)));
    }

    if (_error != null && _messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertCircle, size: 40, color: Color(0xFFE11D48)),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: const Color(0xFF6B7280)),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _load,
                child: Text('support.retry'.tr()),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: _messages.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _poll,
                  child: ListView.builder(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) =>
                        _buildMessageBubble(_messages[index]),
                  ),
                ),
        ),
        _buildInputBar(),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: Color(0xFFFFE4E6),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.headphones, size: 30, color: Color(0xFFE11D48)),
            ),
            const SizedBox(height: 16),
            Text(
              'liveChat.emptyTitle'.tr(),
              style: GoogleFonts.poppins(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'liveChat.emptyBody'.tr(),
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(SupportMessage msg) {
    final isOwn = msg.isOwnMessage;
    return Align(
      alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isOwn ? const Color(0xFFE11D48) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isOwn ? 16 : 4),
            bottomRight: Radius.circular(isOwn ? 4 : 16),
          ),
          border: isOwn ? null : Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          crossAxisAlignment:
              isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isOwn)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFFE4E6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.headphones,
                        size: 11,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                    const SizedBox(width: 5),
                    // Real sender name, so an AI reply is never mistaken for
                    // a human one.
                    Text(
                      msg.sender.fullName.isNotEmpty
                          ? msg.sender.fullName
                          : 'support.supportTeam'.tr(),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFE11D48),
                      ),
                    ),
                  ],
                ),
              ),
            Text(
              msg.content,
              style: GoogleFonts.inter(
                fontSize: 14,
                height: 1.4,
                color: isOwn ? Colors.white : const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              formatNepalTime(msg.createdAt, 'h:mm a', context.locale.languageCode),
              style: GoogleFonts.inter(
                fontSize: 10,
                color: isOwn ? Colors.white70 : const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    style: GoogleFonts.inter(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'liveChat.inputPlaceholder'.tr(),
                      filled: true,
                      fillColor: const Color(0xFFF3F4F6),
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: _isSending ? null : _send,
                    icon: _isSending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(LucideIcons.send, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'liveChat.aiNotice'.tr(),
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF9CA3AF)),
            ),
          ],
        ),
      ),
    );
  }
}
