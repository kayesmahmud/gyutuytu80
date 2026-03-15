import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:easy_localization/easy_localization.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'package:mobile/core/utils/localized_helpers.dart';

class TicketDetailScreen extends StatefulWidget {
  final int ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final _client = SupportClient();
  final _messageController = TextEditingController();
  final _csatCommentController = TextEditingController();
  final _scrollController = ScrollController();

  SupportTicketDetail? _ticket;
  bool _isLoading = true;
  bool _isSending = false;
  bool _isSubmittingCsat = false;
  int _selectedStar = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTicket();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _csatCommentController.dispose();
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
      await _loadTicket();
    } else {
      _messageController.text = content;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.errorMessage),
          backgroundColor: Colors.red[700],
        ),
      );
    }
  }

  Future<void> _submitCsat() async {
    if (_selectedStar == 0) return;

    setState(() => _isSubmittingCsat = true);

    final comment = _csatCommentController.text.trim();
    final response = await _client.submitCsat(
      widget.ticketId,
      _selectedStar,
      comment: comment.isNotEmpty ? comment : null,
    );

    if (!mounted) return;

    setState(() => _isSubmittingCsat = false);

    if (response.hasData) {
      setState(() {
        _ticket = _ticket?.copyWith(
          csatScore: _selectedStar,
          csatComment: comment.isNotEmpty ? comment : null,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('support.feedbackSubmitted'.tr()),
          backgroundColor: const Color(0xFF16A34A),
        ),
      );
    } else {
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
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_ticket?.subject ?? 'support.supportTicket'.tr(),
                style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600, fontSize: 16),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
            if (_ticket != null)
              Text(_ticket!.ticketNumber,
                  style: GoogleFonts.robotoMono(
                      fontSize: 11, color: Colors.grey[500])),
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
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.alertCircle,
                    size: 28, color: Colors.red[300]),
              ),
              const SizedBox(height: 16),
              Text(_error!,
                  style: GoogleFonts.inter(color: Colors.grey[500]),
                  textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loadTicket,
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                label: Text('support.retry'.tr()),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFE11D48),
                  side: const BorderSide(color: Color(0xFFE11D48)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final ticket = _ticket!;
    final isClosed = ticket.status == SupportTicketStatus.closed ||
        ticket.status == SupportTicketStatus.resolved;

    return Column(
      children: [
        _buildStatusBar(ticket),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadTicket,
            color: const Color(0xFFE11D48),
            child: ticket.messages.isEmpty
                ? ListView(
                    children: [
                      SizedBox(
                        height: 200,
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.messageSquare,
                                  size: 32, color: Colors.grey[300]),
                              const SizedBox(height: 8),
                              Text('support.noMessages'.tr(),
                                  style: GoogleFonts.inter(
                                      color: Colors.grey[400])),
                            ],
                          ),
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
                          !_isSameDay(ticket.messages[index - 1].createdAt,
                              msg.createdAt);
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
        if (!isClosed) _buildInputBar(),
        if (isClosed) _buildCsatBar(ticket),
      ],
    );
  }

  Widget _buildStatusBar(SupportTicketDetail ticket) {
    final (Color bg, Color fg, IconData icon) = switch (ticket.status) {
      SupportTicketStatus.open => (const Color(0xFFDCFCE7), const Color(0xFF16A34A), Icons.circle),
      SupportTicketStatus.inProgress => (const Color(0xFFDBEAFE), const Color(0xFF2563EB), Icons.loop),
      SupportTicketStatus.waitingOnUser => (const Color(0xFFFEF3C7), const Color(0xFFD97706), Icons.error_outline),
      SupportTicketStatus.resolved => (const Color(0xFFE0E7FF), const Color(0xFF4F46E5), Icons.check_circle_outline),
      SupportTicketStatus.closed => (const Color(0xFFF3F4F6), const Color(0xFF6B7280), Icons.cancel_outlined),
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: bg,
      child: Row(
        children: [
          Icon(icon, size: 15, color: fg),
          const SizedBox(width: 8),
          Text(ticket.status.label,
              style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600, color: fg)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: fg.withAlpha(20),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(ticket.category.label,
                style: GoogleFonts.inter(
                    fontSize: 11, fontWeight: FontWeight.w500, color: fg)),
          ),
        ],
      ),
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    final isToday = _isSameDay(date, now);
    final isYesterday =
        _isSameDay(date, now.subtract(const Duration(days: 1)));
    final label = isToday
        ? 'support.today'.tr()
        : isYesterday
            ? 'support.yesterday'.tr()
            : formatNepalTime(date, 'MMM d, yyyy');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey[300])),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(label,
                style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[500])),
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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(8),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
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
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE11D48).withAlpha(25),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(LucideIcons.headphones,
                          size: 11, color: Color(0xFFE11D48)),
                    ),
                    const SizedBox(width: 5),
                    Text('support.supportTeam'.tr(),
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
            Text(formatNepalTime(msg.createdAt, 'h:mm a'),
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
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
          12, 10, 8, 10 + MediaQuery.of(context).padding.bottom),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'support.typeMessage'.tr(),
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
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFE11D48).withAlpha(60),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: IconButton(
              onPressed: _isSending ? null : _sendMessage,
              icon: _isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(LucideIcons.send,
                      size: 20, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCsatBar(SupportTicketDetail ticket) {
    final hasRating = ticket.csatScore != null;
    final bottomPad = MediaQuery.of(context).padding.bottom;

    // Already submitted — show thank-you state
    if (hasRating) {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          border: Border(top: BorderSide(color: Colors.green[200]!)),
        ),
        padding: EdgeInsets.fromLTRB(16, 14, 16, 14 + bottomPad),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                5,
                (i) => Icon(
                  i < ticket.csatScore! ? Icons.star_rounded : Icons.star_outline_rounded,
                  color: const Color(0xFFF59E0B),
                  size: 24,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'support.feedbackReceived'.tr(),
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.green[700],
              ),
            ),
            if (ticket.csatComment != null && ticket.csatComment!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                '"${ticket.csatComment}"',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      );
    }

    // Rating form
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(16, 14, 16, 14 + bottomPad),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'support.rateExperience'.tr(),
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final star = i + 1;
              return GestureDetector(
                onTap: () => setState(() => _selectedStar = star),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    star <= _selectedStar
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: const Color(0xFFF59E0B),
                    size: 36,
                  ),
                ),
              );
            }),
          ),
          if (_selectedStar > 0) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _csatCommentController,
              decoration: InputDecoration(
                hintText: 'support.csatCommentHint'.tr(),
                hintStyle: GoogleFonts.inter(
                  fontSize: 13,
                  color: Colors.grey[400],
                ),
                filled: true,
                fillColor: Colors.grey[50],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
              ),
              style: GoogleFonts.inter(fontSize: 14),
              maxLines: 2,
              minLines: 1,
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmittingCsat ? null : _submitCsat,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE11D48),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: _isSubmittingCsat
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        'support.submitFeedback'.tr(),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
