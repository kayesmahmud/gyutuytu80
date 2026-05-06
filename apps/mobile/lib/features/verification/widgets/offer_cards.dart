import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Two-card chooser shown to first-time eligible users:
///   - FREE: skip payment, get a short verification (e.g. 30 days)
///   - PAID: pick a duration and pay via gateway (existing flow)
class OfferCards extends StatelessWidget {
  final String selectedType; // 'individual' | 'business'
  final int freeDurationDays;
  final VoidCallback onSelectFree;
  final VoidCallback onSelectPaid;
  final VoidCallback onClear;

  const OfferCards({
    super.key,
    required this.selectedType,
    required this.freeDurationDays,
    required this.onSelectFree,
    required this.onSelectPaid,
    required this.onClear,
  });

  Future<void> _handleFreeTap(BuildContext context) async {
    final confirmed = await _showFreeConfirmDialog(context);
    if (confirmed == true) {
      onSelectFree();
    }
  }

  Future<bool?> _showFreeConfirmDialog(BuildContext context) {
    final lang = context.locale.languageCode;
    final months = (freeDurationDays / 30).round().clamp(1, 12);
    final monthsLabel = months == 1
        ? (lang == 'ne' ? '१-महिना' : '1-month')
        : (lang == 'ne' ? '$months-महिना' : '$months-month');

    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Text('🎁', style: TextStyle(fontSize: 28)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                lang == 'ne'
                    ? 'निःशुल्क प्रमाणीकरण पुष्टि गर्नुहोस्'
                    : 'Confirm Free Verification',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          lang == 'ne'
              ? 'तपाईंले आफ्नो एक-पटक निःशुल्क $monthsLabel प्रमाणीकरण लिँदै हुनुहुन्छ। यो नयाँ प्रयोगकर्ताहरूका लागि लन्च प्रस्ताव हो — एक पटक प्रयोग गरेपछि, तपाईंले आफ्नो प्रमाणीकरण नवीकरण वा विस्तार गर्न सदस्यता लिनुपर्नेछ।'
              : "You're claiming your one-time free $monthsLabel verification. This is a launch offer for new users — once used, you'll need to subscribe to renew or extend your verification.",
          style: const TextStyle(fontSize: 14, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(lang == 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(ctx, true),
            icon: const Icon(LucideIcons.arrowRight, size: 16),
            label: Text(lang == 'ne' ? 'हो, जारी राख्नुहोस्' : 'Yes, Continue'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green.shade600,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    final typeLabel = selectedType == 'individual'
        ? (lang == 'ne' ? 'व्यक्तिगत' : 'individual')
        : (lang == 'ne' ? 'व्यापार' : 'business');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  lang == 'ne'
                      ? 'आफ्नो $typeLabel प्रमाणीकरण योजना छान्नुहोस्'
                      : 'Choose your $typeLabel verification plan',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              GestureDetector(
                onTap: onClear,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(LucideIcons.x, size: 18, color: Colors.grey[600]),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _FreeCard(
            freeDurationDays: freeDurationDays,
            onTap: () => _handleFreeTap(context),
          ),
          const SizedBox(height: 12),
          _PaidCard(onTap: onSelectPaid),
        ],
      ),
    );
  }
}

class _FreeCard extends StatelessWidget {
  final int freeDurationDays;
  final VoidCallback onTap;

  const _FreeCard({required this.freeDurationDays, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    final months = (freeDurationDays / 30).round().clamp(1, 12);
    final headline = months == 1
        ? (lang == 'ne' ? 'निःशुल्क — १ महिना' : 'FREE — 1 Month')
        : (lang == 'ne' ? 'निःशुल्क — $months महिना' : 'FREE — $months Months');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.green.shade50, Colors.green.shade100],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.green.shade300, width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('🎁', style: TextStyle(fontSize: 28)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        headline,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade900,
                        ),
                      ),
                      Text(
                        lang == 'ne'
                            ? 'थुलो बजारमा स्वागत छ!'
                            : 'Welcome to Thulo Bazaar!',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.green.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _bullet(
              context,
              lang == 'ne'
                  ? 'नयाँ हुनुहुन्छ? निःशुल्क $freeDurationDays दिनको प्रमाणीकरण — कुनै भुक्तानी आवश्यक छैन'
                  : 'New here? Get $freeDurationDays days verification on us — no payment needed',
            ),
            const SizedBox(height: 6),
            _bullet(
              context,
              lang == 'ne'
                  ? 'केवल आफ्नो परिचयपत्र पेश गर्नुहोस्'
                  : 'Just submit your ID',
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Text(
                lang == 'ne'
                    ? 'ⓘ एक-पटकको स्वागत उपहार। आफ्नो प्रमाणित स्थिति राख्न पछि सदस्यता लिनुपर्नेछ।'
                    : "ⓘ One-time welcome gift. You'll need to subscribe later to keep your verified status.",
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.green.shade900,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green.shade500, Colors.green.shade700],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                lang == 'ne'
                    ? 'मेरो निःशुल्क प्रमाणीकरण लिनुहोस् →'
                    : 'Get My Free Verification →',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bullet(BuildContext context, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(
            LucideIcons.check,
            size: 14,
            color: Colors.green.shade700,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: const TextStyle(fontSize: 12, height: 1.4)),
        ),
      ],
    );
  }
}

class _PaidCard extends StatelessWidget {
  final VoidCallback onTap;
  const _PaidCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final lang = context.locale.languageCode;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.indigo.shade50, Colors.purple.shade50],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.indigo.shade300, width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('💎', style: TextStyle(fontSize: 28)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang == 'ne'
                            ? 'सशुल्क — अवधि छान्नुहोस्'
                            : 'PAID — Choose duration',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo.shade900,
                        ),
                      ),
                      Text(
                        lang == 'ne'
                            ? 'लामो अवधिको लागि भुक्तानी गर्नुहोस्'
                            : 'Pay for longer coverage',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.indigo.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _bullet(
              context,
              lang == 'ne'
                  ? '१ महिना / ३ महिना / ६ महिना / १ वर्ष'
                  : '1 month / 3 months / 6 months / 1 year',
            ),
            const SizedBox(height: 6),
            _bullet(
              context,
              lang == 'ne'
                  ? 'क्याम्पेन छुटहरू स्वतः लागू हुन्छ'
                  : 'Campaign discounts apply automatically',
            ),
            const SizedBox(height: 6),
            _bullet(
              context,
              lang == 'ne'
                  ? 'eSewa / Khalti मार्फत भुक्तानी गर्नुहोस्'
                  : 'Pay via eSewa / Khalti',
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.indigo.shade500, Colors.purple.shade600],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                lang == 'ne'
                    ? 'सशुल्क योजना छान्नुहोस् →'
                    : 'Choose Paid Plan →',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bullet(BuildContext context, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(
            LucideIcons.check,
            size: 14,
            color: Colors.indigo.shade600,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: const TextStyle(fontSize: 12, height: 1.4)),
        ),
      ],
    );
  }
}
