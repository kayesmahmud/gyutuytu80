import 'package:flutter/material.dart';
import '../../core/api/payment_client.dart';
import '../../core/models/payment.dart';
import 'payment_screen.dart';

/// Gateway Selector - shows available payment gateways
class GatewaySelector extends StatefulWidget {
  final double amount;
  final PaymentType paymentType;
  final int? relatedId;
  final String orderName;
  final Map<String, dynamic>? metadata;
  final VoidCallback? onSuccess;
  final VoidCallback? onFailure;

  const GatewaySelector({
    super.key,
    required this.amount,
    required this.paymentType,
    this.relatedId,
    required this.orderName,
    this.metadata,
    this.onSuccess,
    this.onFailure,
  });

  /// Show gateway selector as a bottom sheet
  static Future<bool?> show(
    BuildContext context, {
    required double amount,
    required PaymentType paymentType,
    int? relatedId,
    required String orderName,
    Map<String, dynamic>? metadata,
    VoidCallback? onSuccess,
    VoidCallback? onFailure,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => GatewaySelector(
        amount: amount,
        paymentType: paymentType,
        relatedId: relatedId,
        orderName: orderName,
        metadata: metadata,
        onSuccess: onSuccess,
        onFailure: onFailure,
      ),
    );
  }

  @override
  State<GatewaySelector> createState() => _GatewaySelectorState();
}

class _GatewaySelectorState extends State<GatewaySelector> {
  final PaymentClient _paymentClient = PaymentClient();

  bool _isLoading = true;
  List<GatewayInfo> _gateways = [];
  PaymentGateway? _selectedGateway;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadGateways();
  }

  Future<void> _loadGateways() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _paymentClient.getAvailableGateways();

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _gateways = response.data!.where((g) => g.enabled).toList();
        if (_gateways.isNotEmpty) {
          _selectedGateway = _gateways.first.gateway;
        }
      } else {
        _error = response.errorMessage ?? 'Failed to load payment options';
      }
    });
  }

  void _proceedToPayment() {
    if (_selectedGateway == null) return;

    Navigator.pop(context); // Close bottom sheet

    Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentScreen(
          gateway: _selectedGateway!,
          amount: widget.amount,
          paymentType: widget.paymentType,
          relatedId: widget.relatedId,
          orderName: widget.orderName,
          metadata: widget.metadata,
          onSuccess: widget.onSuccess,
          onFailure: widget.onFailure,
        ),
      ),
    ).then((success) {
      if (success == true) {
        widget.onSuccess?.call();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHandle(),
            _buildHeader(),
            const Divider(height: 1),
            _buildContent(),
          ],
        ),
      ),
    );
  }

  Widget _buildHandle() {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFDC143C).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.payment,
              color: Color(0xFFDC143C),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Select Payment Method',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.orderName,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
              Text(
                'Rs. ${widget.amount.toStringAsFixed(0)}',
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

  Widget _buildContent() {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _loadGateways,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_gateways.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(
              Icons.payment_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No payment methods available',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: _gateways.map((gateway) {
              return _buildGatewayOption(gateway);
            }).toList(),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedGateway != null ? _proceedToPayment : null,
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
                'Pay Rs. ${widget.amount.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
        _buildSecurityNote(),
      ],
    );
  }

  Widget _buildGatewayOption(GatewayInfo gateway) {
    final isSelected = _selectedGateway == gateway.gateway;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedGateway = gateway.gateway;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? const Color(0xFFDC143C) : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? const Color(0xFFDC143C).withValues(alpha: 0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _getGatewayColor(gateway.gateway).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: _getGatewayIcon(gateway.gateway),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    gateway.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    gateway.description,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
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
                  color: isSelected ? const Color(0xFFDC143C) : Colors.grey[400]!,
                  width: 2,
                ),
                color: isSelected ? const Color(0xFFDC143C) : Colors.transparent,
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

  Widget _buildSecurityNote() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      color: Colors.grey[50],
      child: Row(
        children: [
          Icon(
            Icons.lock_outline,
            size: 16,
            color: Colors.grey[600],
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Your payment is secure and encrypted',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getGatewayColor(PaymentGateway gateway) {
    switch (gateway) {
      case PaymentGateway.khalti:
        return const Color(0xFF5C2D91); // Khalti purple
      case PaymentGateway.esewa:
        return const Color(0xFF60BB46); // eSewa green
    }
  }

  Widget _getGatewayIcon(PaymentGateway gateway) {
    switch (gateway) {
      case PaymentGateway.khalti:
        return Text(
          'K',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: _getGatewayColor(gateway),
          ),
        );
      case PaymentGateway.esewa:
        return Text(
          'e',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            fontStyle: FontStyle.italic,
            color: _getGatewayColor(gateway),
          ),
        );
    }
  }
}
