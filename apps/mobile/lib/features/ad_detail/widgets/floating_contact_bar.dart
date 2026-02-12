import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/providers/auth_provider.dart';
import 'package:mobile/core/providers/chat_provider.dart';
import 'package:mobile/features/auth/signin_screen.dart';
import 'package:mobile/features/messages/chat_screen.dart';
import 'package:mobile/core/api/api_config.dart';

class FloatingContactBar extends StatelessWidget {
  final AdWithDetails ad;

  const FloatingContactBar({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 34), // Safe area bottom padding
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, -4)),
        ],
      ),
      child: Row(
        children: [
          Expanded(
              child: _buildContactBtn(
                  Icons.phone,
                  "Call",
                  const Color(0xFF1F2937),
                  Colors.white,
                  () => _launchPhone(ad.userPhone))),
          const SizedBox(width: 12),
          Expanded(
              child: _buildContactBtn(
                  Icons.chat_bubble_outline,
                  "Chat",
                  const Color(0xFF4B5563),
                  Colors.white,
                  () => _startChat(context))),
          const SizedBox(width: 12),
          Expanded(
              child: _buildContactBtn(
                  Icons.message,
                  "WhatsApp",
                  const Color(0xFF25D366),
                  Colors.white,
                  () => _launchWhatsApp(ad.userPhone))),
        ],
      ),
    );
  }

  Future<void> _startChat(BuildContext context) async {
    final authProvider = context.read<AuthProvider>();

    // Require login
    if (!authProvider.isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const SignInScreen()));
      return;
    }

    // Prevent self-messaging
    if (authProvider.userId == ad.userId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You cannot message yourself')),
      );
      return;
    }

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final chatProvider = ChatProvider();
      await chatProvider.initialize(authProvider.userId!);

      final conversation = await chatProvider.getOrCreateConversation(
        participantId: ad.userId,
        adId: ad.id,
      );

      if (!context.mounted) return;
      Navigator.pop(context); // Close loading

      if (conversation != null) {
        final avatarUrl = conversation.otherUserAvatar != null
            ? ApiConfig.getAvatarUrl(conversation.otherUserAvatar)
            : null;

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversationId: conversation.id,
              recipientName: conversation.otherUserName.isNotEmpty
                  ? conversation.otherUserName
                  : (ad.userName ?? 'Seller'),
              recipientAvatar: avatarUrl,
              adTitle: ad.title,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to start conversation')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close loading
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Widget _buildContactBtn(
      IconData icon, String label, Color bg, Color fg, VoidCallback onTap) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        elevation: 0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20),
          const SizedBox(height: 2),
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _launchPhone(String? phone) async {
    if (phone == null) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchWhatsApp(String? phone) async {
    if (phone == null) return;
    final uri = Uri.parse('https://wa.me/$phone');
    if (await canLaunchUrl(uri))
      await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
