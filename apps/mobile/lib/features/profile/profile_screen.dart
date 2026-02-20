import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import 'package:mobile/features/auth/signin_screen.dart';
// import 'package:mobile/features/profile/edit_profile_screen.dart';
import 'package:mobile/features/profile/security_settings_screen.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:mobile/features/verification/verification_screen.dart';
import 'package:mobile/core/theme/app_theme.dart';
import '../../core/api/auth_client.dart';
import '../../core/api/api_config.dart';
import '../../core/api/favorites_client.dart';
import '../../core/widgets/location_picker.dart';
import '../auth/signin_screen.dart';
import '../auth/signup_screen.dart';
import 'package:mobile/core/widgets/login_required_widget.dart';
import '../ad_detail/ad_detail_screen.dart';
import 'package:intl/intl.dart';
import '../main_nav/main_nav_screen.dart'; // For restarting app on logout

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  final _authClient = AuthClient();
  final _favoritesClient = FavoritesClient();
  bool isLoggedIn = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;
  late TabController _tabController;

  // Favorites state
  List<FavoriteAd> _favorites = [];
  bool _favoritesLoading = true;
  String? _favoritesError;

  // Location state
  SelectedLocation? _selectedLocation;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    // User data is already loaded by AuthProvider
    _populateControllers();
  }

  void _onTabChanged() {
    // Load favorites when switching to the Wishlist tab (index 2)
    if (_tabController.index == 2 && _favorites.isEmpty && !_favoritesLoading) {
      _loadFavorites();
    }
  }

  Future<void> _loadFavorites() async {
    setState(() {
      _favoritesLoading = true;
      _favoritesError = null;
    });

    final response = await _favoritesClient.getFavorites();

    if (mounted) {
      setState(() {
        _favoritesLoading = false;
        if (response.success) {
          _favorites = response.data;
        } else {
          _favoritesError = response.error;
        }
      });
    }
  }

  Future<void> _removeFavorite(int adId) async {
    final response = await _favoritesClient.removeFromFavorites(adId);
    if (response.success) {
      setState(() {
        _favorites.removeWhere((f) => f.adId == adId);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Removed from saved ads'), backgroundColor: Colors.green),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.error ?? 'Failed to remove'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _populateControllers() {
    // We defer this slightly to ensure build is done if accessing provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        setState(() {
          _nameController.text = user['fullName'] ?? '';
          _emailController.text = user['email'] ?? '';
          _phoneController.text = user['phone'] ?? '';
        });
        // Load favorites initially
        _loadFavorites();
      }
    });
  }

  void _handleLogout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) {
       // Navigate to Home or Stay on Guest Profile - reset to MainNav
       Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const MainNavScreen()), (route) => false);
    }
  }

  Future<void> _openLocationPicker() async {
    final result = await LocationPicker.show(
      context,
      initialLocation: _selectedLocation,
    );

    if (result != null && mounted) {
      setState(() {
        _selectedLocation = result;
      });
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    
    if (authProvider.isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!authProvider.isLoggedIn) {
      return const Scaffold(
        body: LoginRequiredWidget(
          icon: Icons.person_outline,
          title: 'Login to View Profile',
          subtitle: 'Sign in to manage your profile,\nads, and account settings',
        ),
      );
    }
    
    // Ensure controllers are populated if not already (e.g. initial load)
    if (_nameController.text.isEmpty && authProvider.user != null) {
       _nameController.text = authProvider.user!['fullName'] ?? '';
       _emailController.text = authProvider.user!['email'] ?? '';
       _phoneController.text = authProvider.user!['phone'] ?? '';
    }

    _user = authProvider.user; // Update local ref for build methods

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildUserHeader(),
            const SizedBox(height: 16),
            _buildTabBar(),
            Container(
              color: Colors.white,
              constraints: const BoxConstraints(minHeight: 500),
              child: _buildTabContent(),
            ),
             const SizedBox(height: 100), // Bottom padding
          ],
        ),
      ),
    );
  }

  // --- GUEST VIEW COMPONENTS ---

  AppBar _buildGuestAppBar() {
    return AppBar(
      title: Text("Profile", style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppTheme.textDark)),
      centerTitle: false,
      backgroundColor: Colors.white,
      elevation: 0,
       actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.settings_outlined, color: Colors.black)),
        ],
    );
  }

  Widget _buildGuestBody(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildGuestHeaderCard(context),
          const SizedBox(height: 24),
          _buildSectionHeader("Account Settings"),
          _buildMenuItem(context, icon: Icons.settings_outlined, title: "Settings", onTap: () {}),
          _buildMenuItem(context, icon: Icons.help_outline, title: "Help Center", onTap: () {}),
        ],
      ),
    );
  }

  Widget _buildGuestHeaderCard(BuildContext context) {
     return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.grey[100], shape: BoxShape.circle),
            child: const Icon(Icons.person, size: 48, color: Colors.grey),
          ),
          const SizedBox(height: 16),
          Text("Welcome to Thulobazaar", style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
          const SizedBox(height: 8),
          Text("Log in to manage your ads and messages", textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600])),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SignInScreen())),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text("Sign In", style: GoogleFonts.inter(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SignUpScreen())),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                  child: Text("Sign Up", style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // --- LOGGED IN USER VIEW COMPONENTS ---

  Widget _buildUserHeader() {
    final String? avatar = _user?['avatar'];
    print("DEBUG: ProfileScreen User Data: $_user"); // DEBUG LOG
    final String fullName = _user?['fullName'] ?? 'User';
    print("DEBUG: Rendered Name: $fullName"); // DEBUG LOG
    final String createdAt = _user?['createdAt'] != null 
        ? "Member since ${DateFormat('MMM yyyy').format(DateTime.parse(_user!['createdAt']))}" 
        : "Member since 2025";

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Gradient Banner Part
          Container(
            height: 120, // Height for the pink gradient area
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFF43F5E), Color(0xFFEC4899)], // Pink gradient
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                  onPressed: () {
                    if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    } else {
                      // From bottom nav — go to home tab
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const MainNavScreen()),
                        (route) => false,
                      );
                    }
                  },
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                ),
              ),
            ),
          ),
          
          // Profile Info Part (Overlapping)
          Transform.translate(
            offset: const Offset(0, -40), // Move up to overlap gradient
            child: Column(
              children: [
                // Avatar with White Border
                Container(
                   padding: const EdgeInsets.all(4), // White border thickness
                   decoration: const BoxDecoration(
                     color: Colors.white,
                     shape: BoxShape.circle,
                   ),
                   child: Container(
                     width: 80,
                     height: 80,
                     decoration: BoxDecoration(
                       shape: BoxShape.circle,
                       color: Colors.white,
                       border: Border.all(color: Colors.grey[200]!),
                       boxShadow: [
                         BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                       ],
                     ),
                     child: ClipOval(
                       child: avatar != null && ApiConfig.getAvatarUrl(avatar).isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: ApiConfig.getAvatarUrl(avatar),
                              fit: BoxFit.cover,
                              width: 80,
                              height: 80,
                              placeholder: (context, url) => const CircularProgressIndicator(strokeWidth: 2),
                              errorWidget: (context, url, error) => const Icon(Icons.person, color: Colors.grey, size: 40),
                            )
                          : const Icon(Icons.person, color: Colors.grey, size: 40),
                     ),
                   ),
                ),
                
                const SizedBox(height: 12),
                Text(
                  fullName,
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.purple[50],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        "Business Account", // Dynamic?
                        style: GoogleFonts.inter(color: Colors.purple, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      createdAt,
                      style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: AppTheme.primary,
        unselectedLabelColor: Colors.grey,
        indicatorColor: AppTheme.primary,
        indicatorSize: TabBarIndicatorSize.tab,
        tabs: [
          const Tab(icon: Icon(Icons.person_outline)),
          const Tab(icon: Icon(Icons.lock_outline)),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.favorite_border),
                const SizedBox(width: 4),
                Text("${_favorites.length}", style: GoogleFonts.inter()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    return SizedBox(
      height: 600, // Fixed height for TabBarView
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildPersonalInfoTab(),
          _buildSecurityTab(),
          _buildSavedAdsTab(),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Full Name
          Text("Full Name", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey[700])),
          const SizedBox(height: 8),
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
            ),
          ),
          const SizedBox(height: 20),

          // Email Address
          Row(
            children: [
              Text("Email Address", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey[700])),
              const SizedBox(width: 4),
              Text("(Cannot be changed)", style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            readOnly: true,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.grey[50],
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[200]!)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[200]!)),
            ),
          ),
          const SizedBox(height: 20),

          // Phone Number
          Text("Phone Number", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey[700])),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              border: Border.all(color: const Color(0xFFA7F3D0)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
                const SizedBox(width: 8),
                Text(_phoneController.text, style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.textDark)),
                const SizedBox(width: 8),
                Text("Verified", style: GoogleFonts.inter(fontWeight: FontWeight.w500, color: const Color(0xFF10B981), fontSize: 13)),
                const Spacer(),
                Text("Change", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.primary, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Location
          Text("Location", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey[700])),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _openLocationPicker,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border.all(color: Colors.grey[200]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.location_on_outlined, color: Colors.grey[600], size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedLocation?.shortDisplayName ?? _user?['locationName'] ?? "Select Location",
                      style: GoogleFonts.inter(fontWeight: FontWeight.w500, color: AppTheme.textDark),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text("Change", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.primary, fontSize: 13)),
                  const SizedBox(width: 4),
                  Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.primary),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: Colors.grey[300]!),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text("Cancel", style: GoogleFonts.inter(color: Colors.grey[700], fontWeight: FontWeight.w600, fontSize: 16)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    final newName = _nameController.text.trim();
                    if (newName.isEmpty) return;
                    try {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saving changes...')));

                      // Build update payload
                      final updateData = <String, dynamic>{'fullName': newName};

                      // Add location if selected
                      if (_selectedLocation?.finalLocationId != null) {
                        updateData['locationId'] = _selectedLocation!.finalLocationId;
                      }

                      await context.read<AuthProvider>().updateProfile(updateData);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).hideCurrentSnackBar();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: Colors.green),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).hideCurrentSnackBar();
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update: $e')));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF48FB1),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text("Save Changes", style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Logout Button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: _handleLogout,
              child: Text("Log Out", style: GoogleFonts.inter(color: Colors.red, fontWeight: FontWeight.w600, fontSize: 15)),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildSecurityTab() {
    final bool isPhoneVerified = _user?['phoneVerified'] ?? false;
    final String? phone = _user?['phone'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Phone Verification Status Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isPhoneVerified ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isPhoneVerified ? Colors.green.withOpacity(0.3) : Colors.orange.withOpacity(0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isPhoneVerified ? Icons.verified_user : Icons.warning_amber_rounded,
                  color: isPhoneVerified ? Colors.green : Colors.orange,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isPhoneVerified ? 'Phone Verified' : 'Verify Your Phone',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isPhoneVerified ? Colors.green[800] : Colors.orange[800],
                          fontSize: 16,
                        ),
                      ),
                      if (phone != null)
                        Text(
                          phone,
                          style: TextStyle(
                            color: isPhoneVerified ? Colors.green[800] : Colors.orange[800],
                          ),
                        ),
                    ],
                  ),
                ),
                if (!isPhoneVerified)
                  ElevatedButton(
                    onPressed: () async {
                       await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => PhoneVerificationScreen(
                          onVerified: () => context.read<AuthProvider>().refreshProfile(),
                        )),
                      );
                      // Force refresh regardless of callback sometimes
                      if (mounted) context.read<AuthProvider>().refreshProfile();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    child: const Text('Verify'),
                  ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          const Text(
            'Security Settings',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // Security Options List
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey[200]!),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.security, color: AppTheme.primary),
                  title: const Text('Security Center'),
                  subtitle: const Text('Password, 2FA, Active Sessions'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                     Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SecuritySettingsScreen()),
                    );
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.verified, color: AppTheme.primary),
                  title: const Text('Verification Center'),
                  subtitle: const Text('Identity, Business, Badges'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                     Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const VerificationScreen()),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text(
            'Account Management',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey[200]!),
            ),
            child: ListTile(
              leading: const Icon(Icons.delete_forever, color: Colors.red),
              title: const Text('Delete Account'),
              subtitle: const Text('Permanently delete your account and data'),
              onTap: () {
                // TODO: Implement account deletion 
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Account deletion coming soon')),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppTheme.primary, size: 22),
        ),
        title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.textDark)),
        subtitle: Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }

  Widget _buildSavedAdsTab() {
    if (_favoritesLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    if (_favoritesError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(_favoritesError!, style: GoogleFonts.inter(color: Colors.grey[600])),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFavorites,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_favorites.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.grey[100], shape: BoxShape.circle),
              child: Icon(Icons.favorite_border, size: 48, color: Colors.grey[400]),
            ),
            const SizedBox(height: 16),
            Text("No saved ads yet", style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.grey[700])),
            const SizedBox(height: 8),
            Text("Save ads by clicking the bookmark icon", style: GoogleFonts.inter(color: Colors.grey[500])),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const MainNavScreen(initialIndex: 1)),
                (route) => false,
              ),
              icon: const Icon(Icons.search),
              label: const Text("Browse Ads"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadFavorites,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _favorites.length,
        itemBuilder: (context, index) => _buildSavedAdItem(_favorites[index]),
      ),
    );
  }

  Widget _buildSavedAdItem(FavoriteAd favorite) {
    final ad = favorite.ad;
    final imageUrl = ad.primaryImage != null ? ApiConfig.getAdImageUrl(ad.primaryImage) : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          // Main Content
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 90,
                    height: 90,
                    color: Colors.grey[100],
                    child: imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                            errorWidget: (context, url, error) => Icon(Icons.image_outlined, color: Colors.grey[400]),
                          )
                        : Icon(Icons.image_outlined, color: Colors.grey[400]),
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
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.textDark),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (ad.categoryName != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(4)),
                              child: Text(ad.categoryName!, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600])),
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (ad.locationName != null)
                            Expanded(
                              child: Text(ad.locationName!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500]), overflow: TextOverflow.ellipsis),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        ad.price != null ? 'Rs. ${_formatNumber(ad.price!)}' : 'Price on request',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Action Buttons
          Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AdDetailScreen(adId: ad.id, slug: ad.slug))),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.visibility_outlined, size: 16, color: AppTheme.primary),
                          const SizedBox(width: 6),
                          Text("View", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.primary, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
                Container(width: 1, height: 40, color: Colors.grey[200]),
                Expanded(
                  child: InkWell(
                    onTap: () => _removeFavorite(favorite.adId),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.delete_outline, size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 6),
                          Text("Remove", style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey[600], fontSize: 13)),
                        ],
                      ),
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

  String _formatNumber(double number) {
    return number.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }


  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title.toUpperCase(),
          style: GoogleFonts.inter(
            color: Colors.grey[500],
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, {required IconData icon, required String title, required VoidCallback onTap}) {
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 1), // Separator line effect
      child: ListTile(
        leading: Icon(icon, color: Colors.grey[700], size: 22),
        title: Text(title, style: GoogleFonts.inter(fontSize: 15, color: Colors.grey[900])),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      ),
    );
  }
}
