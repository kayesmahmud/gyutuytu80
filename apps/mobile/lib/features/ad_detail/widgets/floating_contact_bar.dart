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
    final bottomPadding = MediaQuery.of(context).viewPadding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, bottomPadding + 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -4)),
        ],
      ),
      child: Row(
        children: [
          // Call - dark filled, icon only
          _buildIconBtn(
            Icons.phone,
            const Color(0xFF374151),
            () => _launchPhone(ad.userPhone),
          ),
          const SizedBox(width: 10),
          // Chat - blue filled, takes more space
          Expanded(
            flex: 2,
            child: _buildFilledBtn(
              Icons.chat_bubble_outline_rounded,
              "Chat",
              const Color(0xFF2563EB),
              () => _startChat(context),
            ),
          ),
          const SizedBox(width: 10),
          // WhatsApp - green filled
          Expanded(
            flex: 2,
            child: _buildFilledBtn(
              Icons.message_rounded,
              "WhatsApp",
              const Color(0xFF25D366),
              () => _launchWhatsApp(ad.userPhone),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _startChat(BuildContext context) async {
    final authProvider = context.read<AuthProvider>();

    // Require login
    if (!authProvider.isLoggedIn) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SignInScreen(
            onSuccess: () => Navigator.pop(context),
          ),
        ),
      );
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
              recipientName: (conversation.otherUserName.isNotEmpty && conversation.otherUserName != 'Unknown')
                  ? conversation.otherUserName
                  : (ad.userName ?? 'Seller'),
              recipientAvatar: avatarUrl,
              adTitle: ad.title,
              initialMessage: "Hi, I'm interested in \"${ad.title}\"\nhttps://thulobazaar.com/en/ad/${ad.slug}",
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

  Widget _buildIconBtn(IconData icon, Color bg, VoidCallback onTap) {
    return SizedBox(
      height: 48,
      width: 52,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: Colors.white,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: EdgeInsets.zero,
        ),
        child: Icon(icon, size: 22),
      ),
    );
  }

  Widget _buildFilledBtn(
      IconData icon, String label, Color bg, VoidCallback onTap) {
    return SizedBox(
      height: 48,
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(label,
            style: GoogleFonts.inter(
                fontSize: 13, fontWeight: FontWeight.w600)),
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: Colors.white,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
        ),
      ),
    );
  }

  Future<void> _launchPhone(String? phone) async {
    if (phone == null) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  String _formatWhatsAppNumber(String phone) {
    final cleaned = phone.replaceAll(RegExp(r'\D'), '');
    if (cleaned.startsWith('0')) return '977${cleaned.substring(1)}';
    if (!cleaned.startsWith('977')) return '977$cleaned';
    return cleaned;
  }

  Future<void> _launchWhatsApp(String? phone) async {
    if (phone == null) return;
    final formatted = _formatWhatsAppNumber(phone);
    final adUrl = 'https://thulobazaar.com/en/ad/${ad.slug}';
    final message = Uri.encodeComponent("Hi, I'm interested in \"${ad.title}\"\n$adUrl");
    final uri = Uri.parse('whatsapp://send?phone=+$formatted&text=$message');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
