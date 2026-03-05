import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';

class TicketDetailScreen extends StatefulWidget {
  final int ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final _client = SupportClient();
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  SupportTicketDetail? _ticket;
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTicket();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadTicket() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _client.getTicketDetail(widget.ticketId);
    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (response.hasData) {
        _ticket = response.data;
      } else {
        _error = response.errorMessage;
      }
    });

    _scrollToBottom();
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

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    setState(() => _isSending = true);
    _messageController.clear();

    final response = await _client.sendMessage(widget.ticketId, content);
    if (!mounted) return;

    setState(() => _isSending = false);

    if (response.hasData) {
      // Reload ticket to get updated messages
      await _loadTicket();
    } else {
      _messageController.text = content; // Restore text on failure
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.errorMessage),
          backgroundColor: Colors.red[700],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_ticket?.subject ?? 'Support Ticket',
                style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600, fontSize: 16),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
            if (_ticket != null)
              Text(_ticket!.ticketNumber,
                  style: GoogleFonts.robotoMono(fontSize: 12, color: Colors.grey[500])),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _ticket == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _ticket == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(_error!, style: GoogleFonts.inter(color: Colors.grey[500])),
            const SizedBox(height: 16),
            TextButton(onPressed: _loadTicket, child: const Text('Retry')),
          ],
        ),
      );
    }

    final ticket = _ticket!;
    final isClosed = ticket.status == SupportTicketStatus.closed ||
        ticket.status == SupportTicketStatus.resolved;

    return Column(
      children: [
        // Status bar
        _buildStatusBar(ticket),

        // Messages
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadTicket,
            child: ticket.messages.isEmpty
                ? ListView(
                    children: [
                      SizedBox(
                        height: 200,
                        child: Center(
                          child: Text('No messages yet',
                              style: GoogleFonts.inter(color: Colors.grey[400])),
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    itemCount: ticket.messages.length,
                    itemBuilder: (context, index) {
                      final msg = ticket.messages[index];
                      final showDate = index == 0 ||
                          !_isSameDay(
                              ticket.messages[index - 1].createdAt, msg.createdAt);
                      return Column(
                        children: [
                          if (showDate) _buildDateSeparator(msg.createdAt),
                          _buildMessageBubble(msg),
                        ],
                      );
                    },
                  ),
          ),
        ),

        // Input bar
        if (!isClosed) _buildInputBar(),
        if (isClosed) _buildClosedBar(ticket.status),
      ],
    );
  }

  Widget _buildStatusBar(SupportTicketDetail ticket) {
    final (Color bg, Color fg) = switch (ticket.status) {
      SupportTicketStatus.open => (const Color(0xFFDCFCE7), const Color(0xFF16A34A)),
      SupportTicketStatus.inProgress => (const Color(0xFFDBEAFE), const Color(0xFF2563EB)),
      SupportTicketStatus.waitingOnUser => (const Color(0xFFFEF3C7), const Color(0xFFD97706)),
      SupportTicketStatus.resolved => (const Color(0xFFE0E7FF), const Color(0xFF4F46E5)),
      SupportTicketStatus.closed => (const Color(0xFFF3F4F6), const Color(0xFF6B7280)),
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: bg,
      child: Row(
        children: [
          Icon(LucideIcons.info, size: 16, color: fg),
          const SizedBox(width: 8),
          Text('Status: ${ticket.status.label}',
              style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w500, color: fg)),
          const Spacer(),
          Text(ticket.category.label,
              style: GoogleFonts.inter(fontSize: 12, color: fg)),
        ],
      ),
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    final isToday = _isSameDay(date, now);
    final isYesterday = _isSameDay(date, now.subtract(const Duration(days: 1)));
    final label = isToday
        ? 'Today'
        : isYesterday
            ? 'Yesterday'
            : DateFormat('MMM d, yyyy').format(date);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey[300])),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(label,
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400])),
          ),
          Expanded(child: Divider(color: Colors.grey[300])),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(SupportMessage msg) {
    final isOwn = msg.isOwnMessage;

    return Align(
      alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 8,
          left: isOwn ? 48 : 0,
          right: isOwn ? 0 : 48,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isOwn ? const Color(0xFFE11D48) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isOwn ? 16 : 4),
            bottomRight: Radius.circular(isOwn ? 4 : 16),
          ),
          border: isOwn ? null : Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          crossAxisAlignment:
              isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isOwn && msg.sender.isStaff)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.headphones,
                        size: 12, color: Color(0xFFE11D48)),
                    const SizedBox(width: 4),
                    Text('Support',
                        style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFFE11D48))),
                  ],
                ),
              ),
            Text(msg.content,
                style: GoogleFonts.inter(
                    fontSize: 14,
                    color: isOwn ? Colors.white : const Color(0xFF1F2937),
                    height: 1.4)),
            const SizedBox(height: 4),
            Text(DateFormat('h:mm a').format(msg.createdAt),
                style: GoogleFonts.inter(
                    fontSize: 11,
                    color: isOwn ? Colors.white70 : Colors.grey[400])),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      padding: EdgeInsets.fromLTRB(
          12, 8, 8, 8 + MediaQuery.of(context).padding.bottom),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                hintStyle: GoogleFonts.inter(color: Colors.grey[400]),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              style: GoogleFonts.inter(fontSize: 15),
              maxLines: 4,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFFE11D48),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              onPressed: _isSending ? null : _sendMessage,
              icon: _isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(LucideIcons.send, size: 20, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClosedBar(SupportTicketStatus status) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.lock, size: 16, color: Colors.grey[500]),
          const SizedBox(width: 8),
          Text(
            status == SupportTicketStatus.resolved
                ? 'This ticket has been resolved'
                : 'This ticket is closed',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
