import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../core/api/promotion_client.dart';
import '../../core/models/models.dart';
import '../../core/models/promotion.dart';
import '../../core/models/payment.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/utils/localized_helpers.dart';
import '../payment/gateway_selector.dart';

/// Promote Ad Screen - allows any user to promote any ad
class PromoteAdScreen extends StatefulWidget {
  final int adId;
  final String adTitle;
  final String? adThumbnail;

  const PromoteAdScreen({
    super.key,
    required this.adId,
    required this.adTitle,
    this.adThumbnail,
  });

  @override
  State<PromoteAdScreen> createState() => _PromoteAdScreenState();
}

class _PromoteAdScreenState extends State<PromoteAdScreen> {
  final PromotionClient _promotionClient = PromotionClient();

  bool _isLoading = true;
  String? _error;
  PricingResponse? _pricingData;
  AdPromotion? _activePromotion;
  PromotionCampaign? _activeCampaign;
  String _userAccountType = 'individual';

  PromotionTypeEnum _selectedType = PromotionTypeEnum.featured;
  int _selectedDuration = 7;

  final List<int> _durationOptions = [3, 7, 15];

  @override
  void initState() {
    super.initState();
    _detectAccountType();
    _loadData();
  }

  void _detectAccountType() {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user == null) return;

    final accountType = (user['accountType'] ?? user['account_type'] ?? 'individual') as String;
    final bizStatus = (user['businessVerificationStatus'] ?? user['business_verification_status'] ?? '') as String;
    final individualVerified = user['individualVerified'] ?? user['individual_verified'] ?? false;

    if (accountType == 'business' && bizStatus == 'approved') {
      _userAccountType = 'business';
    } else if (accountType == 'individual' &&
        (individualVerified == true || bizStatus == 'verified')) {
      _userAccountType = 'individual_verified';
    } else {
      _userAccountType = 'individual';
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final results = await Future.wait([
      _promotionClient.getPricing(adId: widget.adId),
      _promotionClient.getAdActivePromotion(widget.adId),
      _promotionClient.getActiveCampaign(),
    ]);

    final pricingResponse = results[0] as ApiResponse<PricingResponse>;
    final promotionResponse = results[1] as ApiResponse<AdPromotion?>;
    final campaignResponse = results[2] as ApiResponse<PromotionCampaign?>;

    setState(() {
      _isLoading = false;
      if (pricingResponse.success && pricingResponse.data != null) {
        _pricingData = pricingResponse.data;
      } else {
        _error = pricingResponse.errorMessage ?? (context.locale.languageCode == 'ne'
            ? 'मूल्य लोड गर्न असफल'
            : 'Failed to load pricing');
      }

      if (promotionResponse.success) {
        _activePromotion = promotionResponse.data;
      }

      if (campaignResponse.success) {
        _activeCampaign = campaignResponse.data;
      }

    });
  }

  // ==========================================
  // PRICING CALCULATION (matches web logic)
  // ==========================================

  int _getAccountDiscount() {
    if (_userAccountType == 'business') return 40;
    if (_userAccountType == 'individual_verified') return 20;
    return 0;
  }

  int _getCampaignDiscount() {
    return _activeCampaign?.discountPercentage ?? 0;
  }

  int _getTotalDiscount() {
    final total = _getAccountDiscount() + _getCampaignDiscount();
    return total.clamp(0, 90);
  }

  /// Get the individual base price (original price before any discounts)
  double? _getOriginalPrice() {
    if (_pricingData == null) return null;
    final basePrice = _pricingData!.getBasePrice(_selectedType, _selectedDuration);
    return basePrice?.price;
  }

  /// Get the final price after all additive discounts
  double? _getFinalPrice() {
    final original = _getOriginalPrice();
    if (original == null) return null;
    final discount = _getTotalDiscount();
    return (original * (1 - discount / 100)).roundToDouble();
  }

  double _getAccountSavings() {
    final original = _getOriginalPrice() ?? 0;
    return original * _getAccountDiscount() / 100;
  }

  double _getCampaignSavings() {
    final original = _getOriginalPrice() ?? 0;
    return original * _getCampaignDiscount() / 100;
  }

  void _proceedToPayment() {
    final price = _getFinalPrice();
    if (price == null || price <= 0) return;

    GatewaySelector.show(
      context,
      amount: price,
      paymentType: PaymentType.adPromotion,
      relatedId: widget.adId,
      orderName: '${_selectedType.displayName} Promotion - ${widget.adTitle}',
      metadata: {
        'promotionType': _selectedType.apiValue,
        'durationDays': _selectedDuration,
        'adId': widget.adId,
      },
      onSuccess: () {
        _showSuccessAndPop();
      },
    );
  }

  void _showSuccessAndPop() {
    final locale = context.locale.languageCode;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.partyPopper,
                color: Color(0xFF10B981),
                size: 48,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              locale == 'ne' ? 'विज्ञापन प्रवर्द्धित!' : 'Ad Promoted!',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              locale == 'ne'
                  ? 'यो विज्ञापन अब $_selectedDuration दिनको लागि ${_selectedType.displayName.toLowerCase()} छ'
                  : 'This ad is now ${_selectedType.displayName.toLowerCase()} for $_selectedDuration days',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop(true);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(l('done', locale)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // BUILD
  // ==========================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.locale.languageCode == 'ne' ? 'विज्ञापन प्रवर्द्धन' : 'Promote Ad'),
        centerTitle: true,
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _buildErrorState();
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildAdPreview(),
          if (_activePromotion != null) ...[
            const SizedBox(height: 16),
            _buildActivePromotionBanner(),
          ],
          if (_pricingData != null && _pricingData!.pricingTier != 'default') ...[
            const SizedBox(height: 16),
            _buildPricingTierBadge(),
          ],
          if (_activeCampaign != null) ...[
            const SizedBox(height: 16),
            _buildCampaignBanner(),
          ],
          const SizedBox(height: 16),
          _buildAccountTypeBadge(),
          const SizedBox(height: 24),
          _buildPromotionTypes(),
          const SizedBox(height: 24),
          _buildDurationSelector(),
          const SizedBox(height: 24),
          _buildPriceSummary(),
          const SizedBox(height: 100), // Space for bottom bar
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertCircle, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: Text(l('retry', context.locale.languageCode)),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // AD PREVIEW
  // ==========================================

  Widget _buildAdPreview() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: Colors.grey[200],
            ),
            clipBehavior: Clip.antiAlias,
            child: widget.adThumbnail != null
                ? Image.network(
                    widget.adThumbnail!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(LucideIcons.image, color: Colors.grey),
                  )
                : const Icon(LucideIcons.image, color: Colors.grey),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.adTitle,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${context.locale.languageCode == 'ne' ? 'विज्ञापन आईडी' : 'Ad ID'}: ${widget.adId}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // ACTIVE PROMOTION BANNER
  // ==========================================

  Widget _buildActivePromotionBanner() {
    final promo = _activePromotion!;
    final timeRemaining = promo.timeRemaining;
    final days = timeRemaining.inDays;
    final hours = timeRemaining.inHours % 24;
    final isSameType = promo.promotionType.apiValue == _selectedType.apiValue;
    final bannerColor = isSameType ? const Color(0xFF10B981) : const Color(0xFFF59E0B);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            bannerColor.withValues(alpha: 0.1),
            bannerColor.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: bannerColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                promo.promotionType.emoji,
                style: const TextStyle(fontSize: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.locale.languageCode == 'ne'
                          ? 'सक्रिय ${promo.promotionType.displayName} प्रवर्द्धन'
                          : 'Active ${promo.promotionType.displayName} Promotion',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      context.locale.languageCode == 'ne'
                          ? '$days दिन $hours घण्टा बाँकी'
                          : '${days}d ${hours}h remaining',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isSameType
                ? (context.locale.languageCode == 'ne'
                    ? 'थप दिन किनेर यो प्रवर्द्धन विस्तार गर्न सक्नुहुन्छ।'
                    : 'You can extend this promotion by purchasing more days.')
                : (context.locale.languageCode == 'ne'
                    ? 'फरक प्रकारको प्रवर्द्धन थप्न सकिँदैन। ${promo.promotionType.displayName} मा स्विच गरेर विस्तार गर्नुहोस्।'
                    : 'Cannot add a different type. Switch to ${promo.promotionType.displayName} to extend.'),
            style: TextStyle(
              fontSize: 12,
              color: isSameType ? const Color(0xFF059669) : const Color(0xFFD97706),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PRICING TIER BADGE
  // ==========================================

  Widget _buildPricingTierBadge() {
    final tier = _pricingData!.pricingTier;
    final tierLabels = {
      'electronics': 'Electronics',
      'vehicles': 'Vehicles',
      'property': 'Property',
    };
    final label = tierLabels[tier] ?? tier;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.info, size: 18, color: Color(0xFFD97706)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              context.locale.languageCode == 'ne'
                  ? '$label वर्गको मूल्य यो विज्ञापनमा लागू हुन्छ'
                  : '$label category pricing applies to this ad',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFFD97706),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // CAMPAIGN BANNER
  // ==========================================

  Widget _buildCampaignBanner() {
    final campaign = _activeCampaign!;
    final emoji = campaign.bannerEmoji ?? '🎉';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF6366F1).withValues(alpha: 0.1),
            const Color(0xFF8B5CF6).withValues(alpha: 0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  campaign.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF6366F1),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  context.locale.languageCode == 'ne'
                      ? 'थप ${campaign.discountPercentage}% छुट स्वतः लागू भयो!'
                      : 'Extra ${campaign.discountPercentage}% OFF automatically applied!',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                if (campaign.daysRemaining > 0)
                  Text(
                    context.locale.languageCode == 'ne'
                        ? '${campaign.daysRemaining} दिन बाँकी'
                        : '${campaign.daysRemaining} days remaining',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              '-${campaign.discountPercentage}%',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // ACCOUNT TYPE BADGE
  // ==========================================

  Widget _buildAccountTypeBadge() {
    final Color bgColor;
    final Color textColor;
    final IconData icon;
    final String label;

    final locale = context.locale.languageCode;
    switch (_userAccountType) {
      case 'business':
        bgColor = const Color(0xFFF59E0B).withValues(alpha: 0.1);
        textColor = const Color(0xFFD97706);
        icon = LucideIcons.badgeCheck;
        label = locale == 'ne' ? 'प्रमाणित व्यापार विक्रेता (४०% छुट)' : 'Verified Business Seller (40% OFF)';
        break;
      case 'individual_verified':
        bgColor = const Color(0xFF3B82F6).withValues(alpha: 0.1);
        textColor = const Color(0xFF2563EB);
        icon = LucideIcons.checkCircle;
        label = locale == 'ne' ? 'प्रमाणित व्यक्तिगत विक्रेता (२०% छुट)' : 'Verified Individual Seller (20% OFF)';
        break;
      default:
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey[600]!;
        icon = LucideIcons.user;
        label = locale == 'ne' ? 'व्यक्तिगत विक्रेता (मानक मूल्य)' : 'Individual Seller (Standard Price)';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: textColor),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // PROMOTION TYPES
  // ==========================================

  Widget _buildPromotionTypes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.locale.languageCode == 'ne' ? 'प्रवर्द्धन प्रकार' : 'Promotion Type',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ...PromotionTypeEnum.values.map((type) => _buildTypeCard(type)),
      ],
    );
  }

  Widget _buildTypeCard(PromotionTypeEnum type) {
    final isSelected = _selectedType == type;
    final color = _getTypeColor(type);

    return GestureDetector(
      onTap: () => setState(() => _selectedType = type),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? color : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? color.withValues(alpha: 0.05) : Colors.white,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(type.emoji, style: const TextStyle(fontSize: 22)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    type.displayName,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? color : Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    type.description,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: type.benefits.map((benefit) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          benefit,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[700],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? color : Colors.grey[400]!,
                  width: 2,
                ),
                color: isSelected ? color : Colors.transparent,
              ),
              child: isSelected
                  ? const Icon(LucideIcons.check, size: 16, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // DURATION SELECTOR
  // ==========================================

  Widget _buildDurationSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.locale.languageCode == 'ne' ? 'अवधि' : 'Duration',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: _durationOptions.map((days) {
            final isSelected = _selectedDuration == days;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedDuration = days),
                child: Container(
                  margin: EdgeInsets.only(
                    right: days != _durationOptions.last ? 12 : 0,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected ? const Color(0xFFDC143C) : Colors.grey[300]!,
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    color: isSelected
                        ? const Color(0xFFDC143C).withValues(alpha: 0.05)
                        : Colors.white,
                  ),
                  child: Column(
                    children: [
                      Text(
                        '$days',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? const Color(0xFFDC143C) : Colors.grey[800],
                        ),
                      ),
                      Text(
                        context.locale.languageCode == 'ne' ? 'दिन' : 'days',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ==========================================
  // PRICE SUMMARY (with discount breakdown)
  // ==========================================

  Widget _buildPriceSummary() {
    final originalPrice = _getOriginalPrice();
    final finalPrice = _getFinalPrice();
    final accountDiscount = _getAccountDiscount();
    final campaignDiscount = _getCampaignDiscount();
    final totalDiscount = _getTotalDiscount();

    if (originalPrice == null || finalPrice == null) return const SizedBox.shrink();

    final accountSavings = _getAccountSavings();
    final campaignSavings = _getCampaignSavings();
    final totalSavings = originalPrice - finalPrice;

    final locale = context.locale.languageCode;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          // Original price
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'ne' ? 'आधार मूल्य' : 'Base Price',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              Text(
                formatLocalizedPrice(originalPrice, locale),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  decoration: totalDiscount > 0 ? TextDecoration.lineThrough : null,
                ),
              ),
            ],
          ),

          // Account discount line
          if (accountDiscount > 0) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      _userAccountType == 'business' ? LucideIcons.badgeCheck : LucideIcons.checkCircle,
                      size: 16,
                      color: const Color(0xFF3B82F6),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _userAccountType == 'business'
                          ? (locale == 'ne' ? 'व्यापार छुट ($accountDiscount%)' : 'Business Discount ($accountDiscount%)')
                          : (locale == 'ne' ? 'प्रमाणित छुट ($accountDiscount%)' : 'Verified Discount ($accountDiscount%)'),
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF3B82F6),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Text(
                  '-${formatLocalizedPrice(accountSavings, locale)}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF3B82F6),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],

          // Campaign discount line
          if (campaignDiscount > 0) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.partyPopper, size: 16, color: Color(0xFF10B981)),
                    const SizedBox(width: 6),
                    Text(
                      '${_activeCampaign?.name ?? (locale == 'ne' ? 'अभियान' : 'Campaign')} ($campaignDiscount%)',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Text(
                  '-${formatLocalizedPrice(campaignSavings, locale)}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF10B981),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],

          // Total savings
          if (totalDiscount > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.piggyBank, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 6),
                  Text(
                    locale == 'ne'
                        ? 'तपाईंले ${formatLocalizedPrice(totalSavings, locale)} बचत गर्नुहुन्छ ($totalDiscount% छुट)'
                        : 'You save ${formatLocalizedPrice(totalSavings, locale)} ($totalDiscount% OFF)',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const Divider(height: 24),

          // Final total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'ne' ? 'जम्मा' : 'Total',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                formatLocalizedPrice(finalPrice, locale),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFDC143C),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // BOTTOM BAR
  // ==========================================

  Widget? _buildBottomBar() {
    if (_isLoading || _error != null) return null;

    final price = _getFinalPrice();

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
      child: Builder(
        builder: (context) {
          final isDifferentTypeActive = _activePromotion != null &&
              _activePromotion!.promotionType.apiValue != _selectedType.apiValue;
          final isSameTypeExtension = _activePromotion != null &&
              _activePromotion!.promotionType.apiValue == _selectedType.apiValue;
          final isDisabled = isDifferentTypeActive || price == null || price <= 0;

          return ElevatedButton(
            onPressed: !isDisabled ? _proceedToPayment : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC143C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              disabledBackgroundColor: Colors.grey[300],
            ),
            child: Text(
              isDifferentTypeActive
                  ? (context.locale.languageCode == 'ne'
                      ? '${_activePromotion!.promotionType.displayName} मा स्विच गर्नुहोस्'
                      : 'Switch to ${_activePromotion!.promotionType.displayName} to Extend')
                  : isSameTypeExtension
                      ? (context.locale.languageCode == 'ne'
                          ? '${formatLocalizedPrice(price!, 'ne')} मा विस्तार गर्नुहोस्'
                          : 'Extend for ${formatLocalizedPrice(price!, 'en')}')
                      : price != null
                          ? (context.locale.languageCode == 'ne'
                              ? '${formatLocalizedPrice(price, 'ne')} मा प्रवर्द्धन गर्नुहोस्'
                              : 'Promote for ${formatLocalizedPrice(price, 'en')}')
                          : (context.locale.languageCode == 'ne' ? 'विकल्पहरू छान्नुहोस्' : 'Select Options'),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          );
        },
      ),
    );
  }

  // ==========================================
  // HELPERS
  // ==========================================

  Color _getTypeColor(PromotionTypeEnum type) {
    switch (type) {
      case PromotionTypeEnum.featured:
        return const Color(0xFFF59E0B); // Amber/yellow
      case PromotionTypeEnum.urgent:
        return const Color(0xFFEF4444); // Red
      case PromotionTypeEnum.sticky:
        return const Color(0xFF3B82F6); // Blue
    }
  }
}
