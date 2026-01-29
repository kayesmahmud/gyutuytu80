import 'package:flutter/material.dart';
import '../../core/api/promotion_client.dart';
import '../../core/models/models.dart';
import '../../core/models/promotion.dart';
import '../../core/models/payment.dart';
import '../payment/gateway_selector.dart';

/// Promote Ad Screen - allows users to promote their ads
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

  PromotionTypeEnum _selectedType = PromotionTypeEnum.featured;
  int _selectedDuration = 7;

  final List<int> _durationOptions = [3, 7, 15];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final results = await Future.wait([
      _promotionClient.getPricing(adId: widget.adId),
      _promotionClient.getAdActivePromotion(widget.adId),
    ]);

    final pricingResponse = results[0] as ApiResponse<PricingResponse>;
    final promotionResponse = results[1] as ApiResponse<AdPromotion?>;

    setState(() {
      _isLoading = false;
      if (pricingResponse.success && pricingResponse.data != null) {
        _pricingData = pricingResponse.data;
      } else {
        _error = pricingResponse.errorMessage ?? 'Failed to load pricing';
      }

      if (promotionResponse.success) {
        _activePromotion = promotionResponse.data;
      }
    });
  }

  double? _getPrice() {
    if (_pricingData == null) return null;
    final pricing = _pricingData!.getPricing(_selectedType, _selectedDuration);
    return pricing?.finalPrice;
  }

  double? _getOriginalPrice() {
    if (_pricingData == null) return null;
    final pricing = _pricingData!.getPricing(_selectedType, _selectedDuration);
    return pricing?.price;
  }

  int _getTotalDiscount() {
    if (_pricingData == null) return 0;
    final pricing = _pricingData!.getPricing(_selectedType, _selectedDuration);
    int discount = pricing?.discountPercentage ?? 0;
    if (_pricingData!.activeCampaign != null) {
      discount += _pricingData!.activeCampaign!.discountPercentage;
    }
    return discount.clamp(0, 90);
  }

  void _proceedToPayment() {
    final price = _getPrice();
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
                Icons.celebration,
                color: Color(0xFF10B981),
                size: 48,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Ad Promoted!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your ad is now ${_selectedType.displayName.toLowerCase()} for $_selectedDuration days',
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
                child: const Text('Done'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Promote Ad'),
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
          const SizedBox(height: 24),
          _buildPromotionTypes(),
          const SizedBox(height: 24),
          _buildDurationSelector(),
          const SizedBox(height: 24),
          _buildPriceSummary(),
          if (_pricingData?.activeCampaign != null) ...[
            const SizedBox(height: 16),
            _buildCampaignBanner(),
          ],
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
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

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
                    errorBuilder: (_, __, ___) => const Icon(Icons.image, color: Colors.grey),
                  )
                : const Icon(Icons.image, color: Colors.grey),
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
                  'Ad ID: ${widget.adId}',
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

  Widget _buildActivePromotionBanner() {
    final promo = _activePromotion!;
    final timeRemaining = promo.timeRemaining;
    final days = timeRemaining.inDays;
    final hours = timeRemaining.inHours % 24;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _getTypeColor(promo.promotionType).withValues(alpha: 0.1),
            _getTypeColor(promo.promotionType).withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _getTypeColor(promo.promotionType).withValues(alpha: 0.3)),
      ),
      child: Row(
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
                  'Active ${promo.promotionType.displayName} Promotion',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${days}d ${hours}h remaining',
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
    );
  }

  Widget _buildPromotionTypes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Promotion Type',
          style: TextStyle(
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
                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Duration',
          style: TextStyle(
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
                        'days',
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

  Widget _buildPriceSummary() {
    final price = _getPrice();
    final originalPrice = _getOriginalPrice();
    final discount = _getTotalDiscount();

    if (price == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Base Price',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                'Rs. ${originalPrice?.toStringAsFixed(0) ?? '--'}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  decoration: discount > 0 ? TextDecoration.lineThrough : null,
                ),
              ),
            ],
          ),
          if (discount > 0) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.discount, size: 16, color: Color(0xFF10B981)),
                    const SizedBox(width: 6),
                    Text(
                      'Discount ($discount%)',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Text(
                  '-Rs. ${(originalPrice! - price).toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF10B981),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Rs. ${price.toStringAsFixed(0)}',
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

  Widget _buildCampaignBanner() {
    final campaign = _pricingData!.activeCampaign!;

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
          const Icon(
            Icons.celebration,
            color: Color(0xFF6366F1),
            size: 24,
          ),
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
                if (campaign.description != null)
                  Text(
                    campaign.description!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
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

  Widget? _buildBottomBar() {
    if (_isLoading || _error != null) return null;

    final price = _getPrice();

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
      child: ElevatedButton(
        onPressed: price != null && price > 0 ? _proceedToPayment : null,
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
          price != null ? 'Promote for Rs. ${price.toStringAsFixed(0)}' : 'Select Options',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

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
