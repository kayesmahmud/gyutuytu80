import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';

class SellerCard extends StatelessWidget {
  final AdWithDetails ad;

  const SellerCard({super.key, required this.ad});

  @override
  Widget build(BuildContext context) {
    bool isBusiness = ad.businessVerificationStatus == 'verified' ||
        ad.businessVerificationStatus == 'approved';
    bool isVerified = isBusiness || ad.individualVerified == true;

    return Container(
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
      child: Column(
        children: [
          // Header: Avatar + Name + Link
          Row(
            children: [
              Stack(
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
                  if (isVerified)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                            color: Colors.white, shape: BoxShape.circle),
                        child: Icon(Icons.verified,
                            size: 16,
                            color: isBusiness
                                ? const Color(0xFFD4AF37)
                                : Colors.blue),
                      ),
                    ),
                ],
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
                          Icon(Icons.verified,
                              size: 16,
                              color: isBusiness
                                  ? const Color(0xFFD4AF37)
                                  : Colors.blue),
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
            ],
          ),
          const SizedBox(height: 16),

          // Action Row: Wishlist, Share
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildActionIcon(Icons.favorite_border, "0"),
              _buildActionIcon(Icons.share, "Share"),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionIcon(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF6B7280)),
        const SizedBox(width: 6),
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 14, color: const Color(0xFF6B7280))),
      ],
    );
  }
}
