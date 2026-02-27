import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:mobile/core/api/ad_client.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/ad_detail/ad_detail_screen.dart';

class MyAdsScreen extends StatefulWidget {
  const MyAdsScreen({super.key});

  @override
  State<MyAdsScreen> createState() => _MyAdsScreenState();
}

class _MyAdsScreenState extends State<MyAdsScreen> with SingleTickerProviderStateMixin {
  final AdClient _adClient = AdClient();
  late TabController _tabController;

  List<AdWithDetails> _allAds = [];
  bool _isLoading = true;
  String? _error;

  // Tab filters
  static const List<String> _tabs = ['All', 'Active', 'Pending', 'Sold', 'Rejected'];
  static final Map<String, AdStatus?> _statusMap = {
    'All': null,
    'Active': AdStatus.active,
    'Pending': AdStatus.pending,
    'Sold': AdStatus.sold,
    'Rejected': AdStatus.rejected,
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _fetchAds();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      setState(() {}); // Rebuild to filter ads
    }
  }

  Future<void> _fetchAds() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _adClient.getMyAds(limit: 100);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (response.success) {
          _allAds = response.data;
        } else {
          _error = response.errorMessage ?? 'Failed to load ads';
        }
      });
    }
  }

  List<AdWithDetails> get _filteredAds {
    final status = _statusMap[_tabs[_tabController.index]];
    if (status == null) return _allAds;
    return _allAds.where((ad) => ad.status == status).toList();
  }

  Map<String, int> get _statusCounts {
    return {
      'All': _allAds.length,
      'Active': _allAds.where((a) => a.status == AdStatus.active).length,
      'Pending': _allAds.where((a) => a.status == AdStatus.pending).length,
      'Sold': _allAds.where((a) => a.status == AdStatus.sold).length,
      'Rejected': _allAds.where((a) => a.status == AdStatus.rejected).length,
    };
  }

  Future<void> _deleteAd(AdWithDetails ad) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Ad'),
        content: Text('Are you sure you want to delete "${ad.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final response = await _adClient.deleteAd(ad.id);
      if (response.success) {
        setState(() {
          _allAds.removeWhere((a) => a.id == ad.id);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Ad deleted successfully'), backgroundColor: Colors.green),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.error ?? 'Failed to delete'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Future<void> _markAsSold(AdWithDetails ad) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Sold'),
        content: Text('Mark "${ad.title}" as sold?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Mark Sold'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final response = await _adClient.markAsSold(ad.id);
      if (response.success) {
        _fetchAds(); // Refresh to get updated status
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Ad marked as sold!'), backgroundColor: Colors.green),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.error ?? 'Failed to update'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          'My Ads',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppTheme.textDark),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textDark),
      ),
      body: Column(
        children: [
          // Stats Row
          _buildStatsRow(),

          // Tab Bar
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: AppTheme.primary,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppTheme.primary,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: _tabs.map((tab) {
                final count = _statusCounts[tab] ?? 0;
                return Tab(text: '$tab ($count)');
              }).toList(),
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? _buildErrorState()
                    : _filteredAds.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: _fetchAds,
                            color: AppTheme.primary,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredAds.length,
                              itemBuilder: (context, index) => _buildAdItem(_filteredAds[index]),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final counts = _statusCounts;
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('Total', counts['All'] ?? 0, Colors.blue),
          _buildStatItem('Active', counts['Active'] ?? 0, Colors.green),
          _buildStatItem('Pending', counts['Pending'] ?? 0, Colors.orange),
          _buildStatItem('Sold', counts['Sold'] ?? 0, Colors.purple),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          count.toString(),
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.alertCircle, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(_error!, style: GoogleFonts.inter(color: Colors.grey[600])),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _fetchAds,
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.package, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No ads found',
            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Start selling by posting your first ad!',
            style: GoogleFonts.inter(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildAdItem(AdWithDetails ad) {
    final imageUrl = ad.thumbnail != null
        ? ApiConfig.getAdImageUrl(ad.thumbnail)
        : (ad.images.isNotEmpty ? ApiConfig.getAdImageUrl(ad.images.first) : null);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => AdDetailScreen(adId: ad.id, slug: ad.slug)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          children: [
            // Main Content Row
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[100],
                      child: imageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                              errorWidget: (context, url, error) =>
                                  Icon(LucideIcons.image, color: Colors.grey[400]),
                            )
                          : Icon(LucideIcons.image, color: Colors.grey[400]),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ad.title,
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatPrice(ad.price),
                          style: GoogleFonts.inter(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            _buildStatusBadge(ad.status.name),
                            const SizedBox(width: 8),
                            Icon(LucideIcons.eye, size: 14, color: Colors.grey[500]),
                            const SizedBox(width: 4),
                            Text(
                              '${ad.viewCount ?? 0}',
                              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Menu
                  PopupMenuButton<String>(
                    icon: Icon(LucideIcons.moreVertical, color: Colors.grey[600]),
                    onSelected: (value) {
                      switch (value) {
                        case 'view':
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => AdDetailScreen(adId: ad.id, slug: ad.slug)),
                          );
                          break;
                        case 'edit':
                          // TODO: Navigate to edit screen
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Edit feature coming soon')),
                          );
                          break;
                        case 'sold':
                          _markAsSold(ad);
                          break;
                        case 'delete':
                          _deleteAd(ad);
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: 'view', child: Text('View Ad')),
                      if (ad.status == AdStatus.active)
                        const PopupMenuItem(value: 'edit', child: Text('Edit')),
                      if (ad.status == AdStatus.active)
                        const PopupMenuItem(value: 'sold', child: Text('Mark as Sold')),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text('Delete', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Footer with date
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.clock, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    'Posted ${_formatDate(ad.createdAt)}',
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
                  ),
                  const Spacer(),
                  if (ad.categoryName != null)
                    Text(
                      ad.categoryName!,
                      style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status.toLowerCase()) {
      case 'active':
        bgColor = Colors.green[50]!;
        textColor = Colors.green[700]!;
        label = 'Active';
        break;
      case 'pending':
        bgColor = Colors.orange[50]!;
        textColor = Colors.orange[700]!;
        label = 'Pending';
        break;
      case 'sold':
        bgColor = Colors.purple[50]!;
        textColor = Colors.purple[700]!;
        label = 'Sold';
        break;
      case 'rejected':
        bgColor = Colors.red[50]!;
        textColor = Colors.red[700]!;
        label = 'Rejected';
        break;
      default:
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey[700]!;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatPrice(double? price) {
    if (price == null) return 'Contact for price';
    final formatted = price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
    return 'Rs. $formatted';
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Unknown';
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} weeks ago';
    return '${(diff.inDays / 30).floor()} months ago';
  }
}
