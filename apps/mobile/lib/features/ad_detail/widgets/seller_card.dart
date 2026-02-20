import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/features/shop/shop_screen.dart';

class SellerCard extends StatelessWidget {
  final AdWithDetails ad;

  const SellerCard({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    bool isBusiness = ad.businessVerificationStatus == 'verified' ||
        ad.businessVerificationStatus == 'approved';
    bool isVerified = isBusiness || ad.individualVerified == true;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ShopScreen(shopSlug: ad.effectiveShopSlug),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundImage: ad.userAvatar != null
                  ? NetworkImage(ApiConfig.getAvatarUrl(ad.userAvatar))
                  : null,
              backgroundColor: Colors.grey[200],
              child: ad.userAvatar == null
                  ? const Icon(Icons.person, color: Colors.grey)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          ad.userName ?? "Seller",
                          style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1F2937)),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isVerified) ...[
                        const SizedBox(width: 4),
                        Image.asset(
                          isBusiness ? 'assets/images/golden-badge.png' : 'assets/images/blue-badge.png',
                          width: 16, height: 16,
                        ),
                      ]
                    ],
                  ),
                  Text(
                    isBusiness
                        ? "Verified Business Account"
                        : (isVerified ? "Verified Individual Seller" : "Seller"),
                    style: GoogleFonts.inter(
                        fontSize: 12, color: const Color(0xFF6B7280)),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400], size: 24),
          ],
        ),
      ),
    );
  }

}
