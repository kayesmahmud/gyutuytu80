import 'package:flutter/material.dart';
import 'package:mobile/core/api/auth_client.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/features/profile/phone_verification_screen.dart';
import 'package:intl/intl.dart';

class SecuritySettingsScreen extends StatefulWidget {
   // ... (rest of class)
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  final AuthClient _authClient = AuthClient();
  bool _isLoading = false;
  bool _is2faEnabled = false;
  List<dynamic> _sessions = [];
  bool _isLoadingSessions = true;
  String? _phone;
  bool _isPhoneVerified = false;

  @override
  void initState() {
    super.initState();
    _fetchSecurityData();
  }

  Future<void> _fetchSecurityData() async {
    setState(() => _isLoadingSessions = true);
    try {
      // Fetch 2FA status from profile (or separate endpoint if available)
      // Since we added 2FA status to profile response, we can use getProfile
      final profile = await _authClient.getProfile();
      final sessionsData = await _authClient.getSessions();

      if (mounted) {
        setState(() {
          _is2faEnabled = profile['data']['twoFactorEnabled'] ?? false;
          _sessions = sessionsData['data'] ?? [];
          _phone = profile['data']['phone'];
          _isPhoneVerified = profile['data']['phoneVerified'] ?? false;
          _isLoadingSessions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingSessions = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load security settings: $e')),
        );
      }
    }
  }

  Future<void> _toggle2FA(bool value) async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    try {
      final result = await _authClient.toggle2FA(value);
      if (result['success'] == true) {
        setState(() => _is2faEnabled = result['data']['enabled']);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Two-Factor Authentication ${value ? "Enabled" : "Disabled"}')),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update 2FA: $e')),
        );
        // Revert switch if failed
        setState(() {}); 
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _revokeSession(int sessionId) async {
    try {
      final result = await _authClient.revokeSession(sessionId);
      if (result['success'] == true) {
        setState(() {
          _sessions.removeWhere((s) => s['id'] == sessionId);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Session revoked successfully')),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to revoke session: $e')),
        );
      }
    }
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: currentPasswordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Current Password'),
                validator: (v) => v?.isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: newPasswordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New Password'),
                validator: (v) => (v?.length ?? 0) < 6 ? 'Min 6 chars' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: confirmPasswordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirm New Password'),
                validator: (v) {
                  if (v?.isEmpty == true) return 'Required';
                  if (v != newPasswordController.text) return 'Passwords do not match';
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState!.validate()) {
                Navigator.pop(context); // Close dialog first
                _changePassword(
                  currentPasswordController.text,
                  newPasswordController.text,
                );
              }
            },
            child: const Text('Change'),
          ),
        ],
      ),
    );
  }

  Future<void> _changePassword(String current, String newPass) async {
    setState(() => _isLoading = true);
    try {
      final result = await _authClient.changePassword(current, newPass);
      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Password changed successfully')),
          );
        }
      } else {
        throw Exception(result['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to change password: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Security Settings'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0.5,
      ),
      body: _isLoading && _sessions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildSectionTitle('Password & Authentication'),
                Card(
                  elevation: 0,
                  color: Colors.grey[50],
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(
                          _isPhoneVerified ? Icons.verified : Icons.phonelink_ring, 
                          color: _isPhoneVerified ? Colors.green : AppTheme.primary
                        ),
                        title: const Text('Phone Verification'),
                        subtitle: Text(_isPhoneVerified ? 'Verified: $_phone' : 'Verify your phone number'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () async {
                           await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => PhoneVerificationScreen(
                               onVerified: _fetchSecurityData,
                            )),
                          );
                          _fetchSecurityData();
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.lock_outline, color: AppTheme.primary),
                        title: const Text('Change Password'),
                        subtitle: const Text('Update your login password'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _showChangePasswordDialog,
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        secondary: const Icon(Icons.security, color: AppTheme.primary),
                        title: const Text('Two-Factor Authentication'),
                        subtitle: const Text('Secure your account with 2FA'),
                        value: _is2faEnabled,
                        onChanged: _toggle2FA,
                        activeColor: AppTheme.primary,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _buildSectionTitle('Active Sessions'),
                if (_isLoadingSessions)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                else if (_sessions.isEmpty)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: Text('No active sessions found.')))
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _sessions.length,
                    separatorBuilder: (c, i) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final session = _sessions[index];
                      final created = DateTime.parse(session['created_at']);
                      // We don't have device info yet, so we show date
                      final dateStr = DateFormat.yMMMd().add_jm().format(created);
                      
                      return Card(
                        elevation: 0,
                        color: Colors.grey[50],
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey[200]!),
                        ),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Colors.white,
                            child: Icon(Icons.devices, color: Colors.grey),
                          ),
                          title: Text('Session started'),
                          subtitle: Text(dateStr),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: () => _revokeSession(session['id']),
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }
}
