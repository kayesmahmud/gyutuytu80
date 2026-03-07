import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/login_required_widget.dart';
import 'package:mobile/core/widgets/floating_widget.dart';
import 'create_ticket_screen.dart';
import 'ticket_detail_screen.dart';

class SupportTicketsScreen extends StatefulWidget {
  const SupportTicketsScreen({super.key});

  @override
  State<SupportTicketsScreen> createState() => _SupportTicketsScreenState();
}

class _SupportTicketsScreenState extends State<SupportTicketsScreen> {
  final _client = SupportClient();
  List<SupportTicket> _tickets = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _client.getTickets();
    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (response.hasData) {
        _tickets = response.data!;
      } else {
        _error = response.errorMessage;
      }
    });
  }

  void _navigateToCreate() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreateTicketScreen()),
    );
    _loadTickets();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      return Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: Text('Support',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1F2937),
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        body: const LoginRequiredWidget(
          icon: LucideIcons.headphones,
          title: 'Login to View Tickets',
          subtitle: 'Sign in to create and manage\nyour support tickets',
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Support',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (_tickets.isNotEmpty)
            IconButton(
              onPressed: _navigateToCreate,
              icon: const Icon(LucideIcons.plusCircle, size: 22),
              tooltip: 'New Ticket',
            ),
          const SizedBox(width: 4),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
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
                child: Icon(LucideIcons.wifiOff, size: 28, color: Colors.red[300]),
              ),
              const SizedBox(height: 16),
              Text('Something went wrong',
                  style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[700])),
              const SizedBox(height: 6),
              Text(_error!,
                  style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
                  textAlign: TextAlign.center),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _loadTickets,
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                label: const Text('Try Again'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFE11D48),
                  side: const BorderSide(color: Color(0xFFE11D48)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_tickets.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadTickets,
      color: const Color(0xFFE11D48),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        itemCount: _tickets.length + 1, // +1 for header
        itemBuilder: (context, index) {
          if (index == 0) return _buildSummaryHeader();
          return _buildTicketCard(_tickets[index - 1]);
        },
      ),
    );
  }

  Widget _buildSummaryHeader() {
    final openCount = _tickets.where((t) =>
        t.status == SupportTicketStatus.open ||
        t.status == SupportTicketStatus.inProgress ||
        t.status == SupportTicketStatus.waitingOnUser).length;
    final resolvedCount = _tickets.where((t) =>
        t.status == SupportTicketStatus.resolved ||
        t.status == SupportTicketStatus.closed).length;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          _buildSummaryChip(
            icon: LucideIcons.messageCircle,
            label: '$openCount active',
            color: const Color(0xFF2563EB),
            bgColor: const Color(0xFFDBEAFE),
          ),
          const SizedBox(width: 8),
          _buildSummaryChip(
            icon: LucideIcons.checkCircle,
            label: '$resolvedCount resolved',
            color: const Color(0xFF16A34A),
            bgColor: const Color(0xFFDCFCE7),
          ),
          const Spacer(),
          Text('${_tickets.length} total',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400])),
        ],
      ),
    );
  }

  Widget _buildSummaryChip({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Decorative icon with background
            FloatingWidget(
              child: Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFFE11D48).withAlpha(20),
                      const Color(0xFFE11D48).withAlpha(8),
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.headphones,
                    size: 40, color: Color(0xFFE11D48)),
              ),
            ),
            const SizedBox(height: 24),
            Text('How can we help?',
                style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1F2937))),
            const SizedBox(height: 8),
            Text(
              'Create a support ticket and our team\nwill get back to you shortly.',
              style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500], height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _navigateToCreate,
                icon: const Icon(LucideIcons.pencil, size: 18),
                label: Text('Create a Ticket',
                    style: GoogleFonts.inter(
                        fontSize: 16, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE11D48),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: Icon(LucideIcons.helpCircle, size: 18, color: Colors.grey[600]),
                label: Text('Browse Help Center',
                    style: GoogleFonts.inter(
                        fontSize: 15, fontWeight: FontWeight.w500, color: Colors.grey[700])),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(color: Colors.grey[300]!),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketCard(SupportTicket ticket) {
    final statusColor = _statusColor(ticket.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: InkWell(
        onTap: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => TicketDetailScreen(ticketId: ticket.id)),
          );
          _loadTickets();
        },
        borderRadius: BorderRadius.circular(12),
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Left color accent
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 16, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header: status badge + date
                      Row(
                        children: [
                          _StatusBadge(status: ticket.status),
                          const Spacer(),
                          Icon(LucideIcons.clock, size: 12, color: Colors.grey[400]),
                          const SizedBox(width: 4),
                          Text(_formatDate(ticket.updatedAt),
                              style: GoogleFonts.inter(
                                  fontSize: 12, color: Colors.grey[400])),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Subject
                      Text(ticket.subject,
                          style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF1F2937)),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),

                      if (ticket.lastMessageContent != null) ...[
                        const SizedBox(height: 6),
                        Text(ticket.lastMessageContent!,
                            style: GoogleFonts.inter(
                                fontSize: 13,
                                color: Colors.grey[500],
                                height: 1.3),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis),
                      ],

                      const SizedBox(height: 10),

                      // Footer: ticket number + category
                      Row(
                        children: [
                          Icon(LucideIcons.hash, size: 12, color: Colors.grey[400]),
                          const SizedBox(width: 3),
                          Text(ticket.ticketNumber,
                              style: GoogleFonts.robotoMono(
                                  fontSize: 11, color: Colors.grey[400])),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(ticket.category.label,
                                style: GoogleFonts.inter(
                                    fontSize: 11, color: Colors.grey[600])),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // Chevron
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(LucideIcons.chevronRight,
                    size: 18, color: Colors.grey[300]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(SupportTicketStatus status) {
    return switch (status) {
      SupportTicketStatus.open => const Color(0xFF16A34A),
      SupportTicketStatus.inProgress => const Color(0xFF2563EB),
      SupportTicketStatus.waitingOnUser => const Color(0xFFD97706),
      SupportTicketStatus.resolved => const Color(0xFF4F46E5),
      SupportTicketStatus.closed => const Color(0xFF9CA3AF),
    };
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(date);
  }
}

class _StatusBadge extends StatelessWidget {
  final SupportTicketStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg, IconData icon) = switch (status) {
      SupportTicketStatus.open => (const Color(0xFFDCFCE7), const Color(0xFF16A34A), Icons.circle),
      SupportTicketStatus.inProgress => (const Color(0xFFDBEAFE), const Color(0xFF2563EB), Icons.loop),
      SupportTicketStatus.waitingOnUser => (const Color(0xFFFEF3C7), const Color(0xFFD97706), Icons.error_outline),
      SupportTicketStatus.resolved => (const Color(0xFFE0E7FF), const Color(0xFF4F46E5), Icons.check_circle_outline),
      SupportTicketStatus.closed => (const Color(0xFFF3F4F6), const Color(0xFF6B7280), Icons.cancel_outlined),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 4),
          Text(status.label,
              style: GoogleFonts.inter(
                  fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
        ],
      ),
    );
  }
}
