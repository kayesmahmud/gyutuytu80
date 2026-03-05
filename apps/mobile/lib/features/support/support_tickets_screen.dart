import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import 'package:mobile/core/api/support_client.dart';
import 'package:mobile/core/models/support_ticket.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/widgets/login_required_widget.dart';
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

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      return Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: Text('Support Tickets',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1F2937),
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        body: const LoginRequiredWidget(
          icon: LucideIcons.ticket,
          title: 'Login to View Tickets',
          subtitle: 'Sign in to create and manage\nyour support tickets',
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Support Tickets',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButton: _tickets.isEmpty ? null : FloatingActionButton.extended(
        onPressed: () async {
          final created = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (_) => const CreateTicketScreen()),
          );
          if (created == true) _loadTickets();
        },
        backgroundColor: const Color(0xFFE11D48),
        icon: const Icon(LucideIcons.plus, size: 20),
        label: Text('New Ticket',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(_error!, style: GoogleFonts.inter(color: Colors.grey[500])),
            const SizedBox(height: 16),
            TextButton(onPressed: _loadTickets, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_tickets.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadTickets,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tickets.length,
        itemBuilder: (context, index) => _buildTicketCard(_tickets[index]),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.ticket, size: 56, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text('No support tickets yet',
              style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600])),
          const SizedBox(height: 8),
          Text('Create a ticket to get help from our team',
              style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[400])),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () async {
              final created = await Navigator.push<bool>(
                context,
                MaterialPageRoute(builder: (_) => const CreateTicketScreen()),
              );
              if (created == true) _loadTickets();
            },
            icon: const Icon(LucideIcons.plus, size: 18),
            label: Text('Create Ticket',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE11D48),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketCard(SupportTicket ticket) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
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
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row: ticket number + status
              Row(
                children: [
                  Text(ticket.ticketNumber,
                      style: GoogleFonts.robotoMono(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[500])),
                  const Spacer(),
                  _StatusBadge(status: ticket.status),
                ],
              ),
              const SizedBox(height: 8),

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
                        fontSize: 13, color: Colors.grey[500]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ],

              const SizedBox(height: 10),

              // Footer: category + date
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(ticket.category.label,
                        style: GoogleFonts.inter(
                            fontSize: 11, color: Colors.grey[600])),
                  ),
                  const Spacer(),
                  Text(_formatDate(ticket.updatedAt),
                      style: GoogleFonts.inter(
                          fontSize: 12, color: Colors.grey[400])),
                ],
              ),
            ],
          ),
        ),
      ),
    );
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
    final (Color bg, Color fg) = switch (status) {
      SupportTicketStatus.open => (const Color(0xFFDCFCE7), const Color(0xFF16A34A)),
      SupportTicketStatus.inProgress => (const Color(0xFFDBEAFE), const Color(0xFF2563EB)),
      SupportTicketStatus.waitingOnUser => (const Color(0xFFFEF3C7), const Color(0xFFD97706)),
      SupportTicketStatus.resolved => (const Color(0xFFE0E7FF), const Color(0xFF4F46E5)),
      SupportTicketStatus.closed => (const Color(0xFFF3F4F6), const Color(0xFF6B7280)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(status.label,
          style: GoogleFonts.inter(
              fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
    );
  }
}
