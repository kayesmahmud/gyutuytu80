import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/models/verification_models.dart';

/// Compact verification tile — designed for side-by-side layout.
/// Centered icon with status overlay, title, status pill, and CTA.
class VerificationStatusCard extends StatelessWidget {
  final String type; // 'individual' or 'business'
  final String title;
  final String subtitle;
  final String status; // 'verified', 'pending', 'rejected', 'unverified'
  final VoidCallback onTap;
  final bool isSelected;
  final String? rejectionReason;
  final int? daysRemaining;
  final bool isExpiringSoon;
  final String? expiresAt;

  const VerificationStatusCard({
    Key? key,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.status,
    required this.onTap,
    this.isSelected = false,
    this.rejectionReason,
    this.daysRemaining,
    this.isExpiringSoon = false,
    this.expiresAt,
  }) : super(key: key);

  // --- Derived colors ---

  Color get _bgColor {
    switch (status) {
      case 'verified': return Colors.green.shade50;
      case 'pending': return Colors.amber.shade50;
      case 'rejected': return Colors.red.shade50;
      default: return Colors.white;
    }
  }

  Color get _borderColor {
    switch (status) {
      case 'verified': return Colors.green.shade200;
      case 'pending': return Colors.amber.shade200;
      case 'rejected': return Colors.red.shade200;
      default: return Colors.grey.shade200;
    }
  }

  Color get _accentColor {
    switch (status) {
      case 'verified': return const Color(0xFF10B981);
      case 'pending': return const Color(0xFFF59E0B);
      case 'rejected': return const Color(0xFFEF4444);
      default:
        return type == 'individual'
            ? const Color(0xFF3B82F6)
            : const Color(0xFFF59E0B);
    }
  }

  List<Color> get _topBarGradient {
    switch (status) {
      case 'verified':
        return [const Color(0xFF10B981), const Color(0xFF059669)];
      case 'pending':
        return [const Color(0xFFF59E0B), const Color(0xFFEA580C)];
      case 'rejected':
        return [const Color(0xFFEF4444), const Color(0xFFDB2777)];
      default:
        return type == 'individual'
            ? [const Color(0xFF3B82F6), const Color(0xFF6366F1)]
            : [const Color(0xFFF59E0B), const Color(0xFFEA580C)];
    }
  }

  List<Color> get _iconGradient {
    return type == 'individual'
        ? [const Color(0xFF3B82F6), const Color(0xFF6366F1)]
        : [const Color(0xFFF59E0B), const Color(0xFFEA580C)];
  }

  IconData get _typeIcon =>
      type == 'individual' ? LucideIcons.user : LucideIcons.building;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: _bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? _accentColor : _borderColor,
            width: isSelected ? 2.5 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: _accentColor.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // Gradient accent bar
            Container(
              height: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: _topBarGradient),
              ),
            ),
            // Centered content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildIconWithOverlay(),
                    const SizedBox(height: 10),
                    Text(
                      type == 'individual' ? 'Individual' : 'Business',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      'Verification',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                    const SizedBox(height: 8),
                    _buildStatusPill(),
                    const SizedBox(height: 8),
                    _buildBottomInfo(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconWithOverlay() {
    final iconCircle = Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _iconGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Icon(_typeIcon, color: Colors.white, size: 22),
    );

    if (status == 'unverified') return iconCircle;

    final overlayIcon = status == 'verified'
        ? LucideIcons.check
        : status == 'pending'
            ? LucideIcons.clock
            : LucideIcons.x;

    final overlayColor = status == 'verified'
        ? const Color(0xFF10B981)
        : status == 'pending'
            ? const Color(0xFFF59E0B)
            : const Color(0xFFEF4444);

    return SizedBox(
      width: 52,
      height: 52,
      child: Stack(
        children: [
          Positioned(top: 0, left: 2, child: iconCircle),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: overlayColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Icon(overlayIcon, color: Colors.white, size: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill() {
    final dotColor = _accentColor;
    final textColor = switch (status) {
      'verified' => Colors.green.shade800,
      'pending' => Colors.amber.shade800,
      'rejected' => Colors.red.shade800,
      _ => Colors.grey.shade700,
    };
    final pillBg = switch (status) {
      'verified' => Colors.green.shade50,
      'pending' => Colors.amber.shade50,
      'rejected' => Colors.red.shade50,
      _ => Colors.white,
    };
    final pillBorder = switch (status) {
      'verified' => Colors.green.shade200,
      'pending' => Colors.amber.shade200,
      'rejected' => Colors.red.shade200,
      _ => Colors.grey.shade300,
    };
    final label = switch (status) {
      'verified' => 'Verified',
      'pending' => 'Pending',
      'rejected' => 'Rejected',
      _ => 'Unverified',
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: pillBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: pillBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomInfo() {
    switch (status) {
      case 'verified':
        if (isExpiringSoon && daysRemaining != null) {
          return Text(
            '${daysRemaining}d left',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.amber.shade700,
            ),
          );
        }
        if (expiresAt != null) {
          return Text(
            'Until ${_formatDate(expiresAt!)}',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: Colors.green.shade700,
            ),
          );
        }
        return const SizedBox(height: 14);
      case 'pending':
        return Text(
          'Under review',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Colors.amber.shade700,
          ),
        );
      case 'rejected':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Resubmit Free',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.red.shade600,
              ),
            ),
            const SizedBox(width: 2),
            Icon(LucideIcons.arrowRight, size: 14, color: Colors.red.shade600),
          ],
        );
      default:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Start',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _accentColor,
              ),
            ),
            const SizedBox(width: 2),
            Icon(LucideIcons.arrowRight, size: 14, color: _accentColor),
          ],
        );
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

/// Dynamic verification status banner — changes based on overall account state.
/// 4 states: unverified (purple), pending (amber), rejected (red), verified (green/gold).
class VerificationStatusBanner extends StatelessWidget {
  final String individualStatus;
  final String businessStatus;
  final String? individualName;
  final String? businessName;
  final String? individualRejectionReason;
  final String? businessRejectionReason;
  final String? individualCreatedAt;
  final String? businessCreatedAt;
  final int? individualDaysRemaining;
  final int? businessDaysRemaining;

  const VerificationStatusBanner({
    Key? key,
    required this.individualStatus,
    required this.businessStatus,
    this.individualName,
    this.businessName,
    this.individualRejectionReason,
    this.businessRejectionReason,
    this.individualCreatedAt,
    this.businessCreatedAt,
    this.individualDaysRemaining,
    this.businessDaysRemaining,
  }) : super(key: key);

  /// Priority: verified > pending > rejected > unverified
  String get _overallStatus {
    final statuses = [individualStatus, businessStatus];
    if (statuses.contains('verified')) return 'verified';
    if (statuses.contains('pending')) return 'pending';
    if (statuses.contains('rejected')) return 'rejected';
    return 'unverified';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _gradientColors.first.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(_icon, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _subtitle,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Detail section (state-specific)
          ..._buildDetails(),

          // Footer (state-specific)
          if (_footer != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Row(
                children: [
                  Icon(LucideIcons.info, size: 14,
                      color: Colors.white.withValues(alpha: 0.7)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      _footer!,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  List<Color> get _gradientColors {
    switch (_overallStatus) {
      case 'verified':
        return [const Color(0xFF10B981), const Color(0xFF059669)];
      case 'pending':
        return [const Color(0xFFF59E0B), const Color(0xFFEA580C)];
      case 'rejected':
        return [const Color(0xFFEF4444), const Color(0xFFDB2777)];
      default:
        return [const Color(0xFF6366F1), const Color(0xFF8B5CF6)];
    }
  }

  IconData get _icon {
    switch (_overallStatus) {
      case 'verified':
        return LucideIcons.shieldCheck;
      case 'pending':
        return LucideIcons.clock;
      case 'rejected':
        return LucideIcons.xCircle;
      default:
        return LucideIcons.shield;
    }
  }

  String get _title {
    switch (_overallStatus) {
      case 'verified':
        return 'Verified Account';
      case 'pending':
        return 'Verification Pending';
      case 'rejected':
        return 'Verification Rejected';
      default:
        return 'Get Verified';
    }
  }

  String get _subtitle {
    switch (_overallStatus) {
      case 'verified':
        return 'Your account is verified and trusted';
      case 'pending':
        return "We're reviewing your application";
      case 'rejected':
        return 'Your application was not approved';
      default:
        return 'Build trust with buyers and unlock features';
    }
  }

  String? get _footer {
    switch (_overallStatus) {
      case 'pending':
        return 'Our team typically reviews within 24-48 hours';
      case 'rejected':
        return 'You can resubmit at no additional cost';
      default:
        return null;
    }
  }

  List<Widget> _buildDetails() {
    switch (_overallStatus) {
      case 'pending':
        return _buildPendingDetails();
      case 'rejected':
        return _buildRejectedDetails();
      case 'verified':
        return _buildVerifiedDetails();
      default:
        return [];
    }
  }

  List<Widget> _buildPendingDetails() {
    final items = <Widget>[];
    if (individualStatus == 'pending') {
      items.add(_buildDetailChip(
        label: 'Individual',
        name: individualName,
        extra: _formatDate(individualCreatedAt),
        badgeColor: const Color(0xFF6366F1),
      ));
    }
    if (businessStatus == 'pending') {
      items.add(_buildDetailChip(
        label: 'Business',
        name: businessName,
        extra: _formatDate(businessCreatedAt),
        badgeColor: const Color(0xFFF59E0B),
      ));
    }
    if (items.isEmpty) return [];
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Column(children: items),
      ),
    ];
  }

  List<Widget> _buildRejectedDetails() {
    final items = <Widget>[];
    if (individualStatus == 'rejected' && individualRejectionReason != null) {
      items.add(_buildRejectionChip(
        label: 'Individual',
        reason: individualRejectionReason!,
      ));
    }
    if (businessStatus == 'rejected' && businessRejectionReason != null) {
      items.add(_buildRejectionChip(
        label: 'Business',
        reason: businessRejectionReason!,
      ));
    }
    if (items.isEmpty) return [];
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Column(children: items),
      ),
    ];
  }

  List<Widget> _buildVerifiedDetails() {
    final items = <Widget>[];
    if (individualStatus == 'verified' && individualName != null) {
      items.add(_buildVerifiedChip(
        label: 'Individual',
        name: individualName!,
        daysRemaining: individualDaysRemaining,
      ));
    }
    if (businessStatus == 'verified' && businessName != null) {
      items.add(_buildVerifiedChip(
        label: 'Business',
        name: businessName!,
        daysRemaining: businessDaysRemaining,
      ));
    }
    if (items.isEmpty) return [];
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
        child: Column(children: items),
      ),
    ];
  }

  Widget _buildDetailChip({
    required String label,
    String? name,
    String? extra,
    required Color badgeColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: badgeColor,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              label.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (name != null)
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                if (extra != null)
                  Text(
                    'Submitted $extra',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          Icon(LucideIcons.loader, size: 16,
              color: Colors.white.withValues(alpha: 0.6)),
        ],
      ),
    );
  }

  Widget _buildRejectionChip({
    required String label,
    required String reason,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.red.shade800,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              label.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              reason,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifiedChip({
    required String label,
    required String name,
    int? daysRemaining,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.badgeCheck, size: 18,
              color: Colors.white.withValues(alpha: 0.9)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$label: $name',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          if (daysRemaining != null)
            Text(
              '${daysRemaining}d left',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 11,
              ),
            ),
        ],
      ),
    );
  }

  String? _formatDate(String? dateStr) {
    if (dateStr == null) return null;
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

/// Campaign discount banner
class CampaignBanner extends StatelessWidget {
  final VerificationCampaign campaign;

  const CampaignBanner({Key? key, required this.campaign}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.purple.shade600, Colors.indigo.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Text(campaign.bannerEmoji ?? '🎉',
              style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      campaign.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${campaign.discountPercentage.toInt()}% OFF',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${campaign.daysRemaining} days left',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// FAQ Section
class FaqSection extends StatelessWidget {
  const FaqSection({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.indigo.shade50,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.helpCircle, size: 18, color: Colors.indigo),
              const SizedBox(width: 8),
              const Text(
                'Frequently Asked Questions',
                style: TextStyle(
                  color: Colors.indigo,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Everything you need to know',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        _buildFaqItem(
          'How long does verification take?',
          'Verification usually takes 24-48 hours. You will be notified once your documents are reviewed.',
        ),
        _buildFaqItem(
          'Why should I verify my account?',
          'Verified accounts get a blue checkmark, higher trust from buyers, and priority support.',
        ),
        _buildFaqItem(
          'Is my data safe?',
          'Yes, your documents are encrypted and stored securely. We only use them for verification purposes.',
        ),
      ],
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.clock, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            answer,
            style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.4),
          ),
        ],
      ),
    );
  }
}

/// Plan summary card shown at top of verification forms.
/// Matches the web PlanSummary component styling.
class PlanSummaryCard extends StatelessWidget {
  final String type; // 'individual' or 'business'
  final int durationDays;
  final double price;
  final bool isFree;
  final bool isResubmission;

  const PlanSummaryCard({
    Key? key,
    required this.type,
    required this.durationDays,
    required this.price,
    required this.isFree,
    required this.isResubmission,
  }) : super(key: key);

  String get _durationLabel {
    switch (durationDays) {
      case 30:
        return '1 Month';
      case 90:
        return '3 Months';
      case 180:
        return '6 Months';
      case 365:
        return '1 Year';
      default:
        return '$durationDays Days';
    }
  }

  String get _typeLabel =>
      type == 'individual' ? 'Individual' : 'Business';

  @override
  Widget build(BuildContext context) {
    final Color gradientStart;
    final Color gradientEnd;
    final Color borderColor;
    final Color priceColor;
    final String title;
    final String priceText;
    final String? subtitle;

    if (isResubmission) {
      gradientStart = Colors.blue.shade50;
      gradientEnd = Colors.indigo.shade50;
      borderColor = Colors.blue.shade200;
      priceColor = Colors.blue.shade600;
      title = 'Resubmit $_durationLabel $_typeLabel Verification';
      priceText = 'NO CHARGE';
      subtitle =
          'Fix the issues from your previous application and resubmit with correct documents';
    } else if (isFree) {
      gradientStart = Colors.green.shade50;
      gradientEnd = Colors.teal.shade50;
      borderColor = Colors.green.shade200;
      priceColor = Colors.green.shade600;
      title = '$_durationLabel $_typeLabel Verification';
      priceText = 'FREE';
      subtitle = null;
    } else if (type == 'business') {
      gradientStart = Colors.pink.shade50;
      gradientEnd = Colors.red.shade50;
      borderColor = Colors.pink.shade200;
      priceColor = Colors.pink.shade600;
      title = '$_durationLabel Business Verification';
      priceText = 'NPR ${price.toInt()}';
      subtitle = 'Get verified business badge';
    } else {
      gradientStart = Colors.indigo.shade50;
      gradientEnd = Colors.purple.shade50;
      borderColor = Colors.indigo.shade200;
      priceColor = Colors.indigo.shade600;
      title = '$_durationLabel Individual Verification';
      priceText = 'NPR ${price.toInt()}';
      subtitle = 'Get verified seller badge';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [gradientStart, gradientEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 2),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: Colors.grey[900],
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      height: 1.3,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            priceText,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: priceColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// Step indicator for 2-step paid verification flow.
/// Matches the web StepIndicator component.
class VerificationStepIndicator extends StatelessWidget {
  final int currentStep; // 1 = form, 2 = payment
  final Color accentColor;

  const VerificationStepIndicator({
    Key? key,
    required this.currentStep,
    this.accentColor = Colors.indigo,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildStep(1, 'Fill Details'),
          Expanded(
            child: Container(
              height: 2,
              margin: const EdgeInsets.symmetric(horizontal: 8),
              color: currentStep >= 2
                  ? accentColor
                  : Colors.grey.shade300,
            ),
          ),
          _buildStep(2, 'Payment'),
        ],
      ),
    );
  }

  Widget _buildStep(int step, String label) {
    final isActive = currentStep >= step;
    final isCompleted = currentStep > step;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: isActive ? accentColor : Colors.grey.shade200,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: isCompleted
                ? const Icon(LucideIcons.check, color: Colors.white, size: 16)
                : Text(
                    '$step',
                    style: TextStyle(
                      color: isActive ? Colors.white : Colors.grey.shade500,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            color: isActive ? accentColor : Colors.grey.shade500,
          ),
        ),
      ],
    );
  }
}
