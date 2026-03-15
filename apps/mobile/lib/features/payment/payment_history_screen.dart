import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../core/api/payment_client.dart';
import '../../core/models/models.dart';
import '../../core/models/payment.dart';
import '../../core/utils/localized_helpers.dart';
import '../../core/widgets/floating_widget.dart';

/// Payment History Screen - shows user's payment transactions
class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  final PaymentClient _paymentClient = PaymentClient();
  final ScrollController _scrollController = ScrollController();

  List<PaymentTransaction> _transactions = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMorePages = true;
  String? _statusFilter;

  final List<String> _filterKeys = ['All', 'Completed', 'Pending', 'Failed'];

  @override
  void initState() {
    super.initState();
    _loadTransactions();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadTransactions({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMorePages = true;
      });
    }

    setState(() {
      _isLoading = refresh || _currentPage == 1;
      _error = null;
    });

    final response = await _paymentClient.getPaymentHistory(
      page: _currentPage,
      limit: 20,
      status: _statusFilter,
    );

    setState(() {
      _isLoading = false;
      if (response.success) {
        if (refresh || _currentPage == 1) {
          _transactions = response.data;
        } else {
          _transactions.addAll(response.data);
        }
        _hasMorePages =
            response.pagination.page < response.pagination.totalPages;
      } else {
        _error = response.errorMessage ?? (context.locale.languageCode == 'ne'
          ? 'भुक्तानी इतिहास लोड गर्न असफल'
          : 'Failed to load payment history');
      }
    });
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMorePages) return;

    setState(() {
      _isLoadingMore = true;
    });

    _currentPage++;
    await _loadTransactions();

    setState(() {
      _isLoadingMore = false;
    });
  }

  String _filterLabel(String key) {
    switch (key) {
      case 'All':
        return 'payment.all'.tr();
      case 'Completed':
        return 'payment.completed'.tr();
      case 'Pending':
        return 'payment.pending'.tr();
      case 'Failed':
        return 'payment.failed'.tr();
      default:
        return key;
    }
  }

  void _onFilterChanged(String filter) {
    setState(() {
      _statusFilter = filter == 'All' ? null : filter.toLowerCase();
    });
    _loadTransactions(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('payment.title'.tr()), centerTitle: true),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _filterKeys.map((filter) {
            final isSelected =
                (_statusFilter == null && filter == 'All') ||
                _statusFilter == filter.toLowerCase();
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(_filterLabel(filter)),
                selected: isSelected,
                onSelected: (_) => _onFilterChanged(filter),
                selectedColor: const Color(0xFFDC143C),
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey[700],
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _buildErrorState();
    }

    if (_transactions.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        await _loadTransactions(refresh: true);
        HapticFeedback.mediumImpact();
      },
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: _transactions.length + (_hasMorePages ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= _transactions.length) {
            return _buildLoadingMore();
          }
          return _buildTransactionCard(_transactions[index]);
        },
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
              onPressed: () => _loadTransactions(refresh: true),
              child: Text('common.retry'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FloatingWidget(
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.receipt,
                  size: 48,
                  color: Colors.grey[400],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'payment.noTransactions'.tr(),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'payment.historySubtitle'.tr(),
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionCard(PaymentTransaction transaction) {

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _showTransactionDetails(transaction),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildGatewayIcon(transaction.gateway),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            transaction.orderName,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            formatNepalTime(transaction.createdAt, 'MMM dd, yyyy • hh:mm a', context.locale.languageCode),
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          formatLocalizedPrice(transaction.amount, context.locale.languageCode),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        _buildStatusBadge(transaction.status),
                      ],
                    ),
                  ],
                ),
                if (transaction.transactionId != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          LucideIcons.tag,
                          size: 14,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            transaction.transactionId!,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGatewayIcon(PaymentGateway gateway) {
    final color = gateway == PaymentGateway.khalti
        ? const Color(0xFF5C2D91)
        : const Color(0xFF60BB46);
    final letter = gateway == PaymentGateway.khalti ? 'K' : 'e';

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Text(
          letter,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            fontStyle: gateway == PaymentGateway.esewa
                ? FontStyle.italic
                : FontStyle.normal,
            color: color,
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(PaymentStatus status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case PaymentStatus.completed:
        bgColor = const Color(0xFF10B981).withValues(alpha: 0.1);
        textColor = const Color(0xFF10B981);
        label = 'payment.completed'.tr();
        break;
      case PaymentStatus.pending:
        bgColor = const Color(0xFFF59E0B).withValues(alpha: 0.1);
        textColor = const Color(0xFFF59E0B);
        label = 'payment.pending'.tr();
        break;
      case PaymentStatus.failed:
        bgColor = const Color(0xFFEF4444).withValues(alpha: 0.1);
        textColor = const Color(0xFFEF4444);
        label = 'payment.failed'.tr();
        break;
      case PaymentStatus.refunded:
        bgColor = const Color(0xFF6366F1).withValues(alpha: 0.1);
        textColor = const Color(0xFF6366F1);
        label = 'payment.refunded'.tr();
        break;
      case PaymentStatus.expired:
        bgColor = Colors.grey.withValues(alpha: 0.1);
        textColor = Colors.grey;
        label = 'payment.expired'.tr();
        break;
      case PaymentStatus.canceled:
        bgColor = Colors.grey.withValues(alpha: 0.1);
        textColor = Colors.grey;
        label = 'payment.expired'.tr();
        break;
      case PaymentStatus.verified:
        bgColor = const Color(0xFF10B981).withValues(alpha: 0.1);
        textColor = const Color(0xFF10B981);
        label = 'common.verified'.tr();
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildLoadingMore() {
    return const Padding(
      padding: EdgeInsets.all(16),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }

  void _showTransactionDetails(PaymentTransaction transaction) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildTransactionDetailsSheet(transaction),
    );
  }

  Widget _buildTransactionDetailsSheet(PaymentTransaction transaction) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildGatewayIcon(transaction.gateway),
                  const SizedBox(height: 16),
                  Text(
                    formatLocalizedPrice(transaction.amount, context.locale.languageCode),
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildStatusBadge(transaction.status),
                  const SizedBox(height: 24),
                  _buildDetailRow('payment.order'.tr(), transaction.orderName),
                  _buildDetailRow('payment.type'.tr(), transaction.type.displayName),
                  _buildDetailRow('payment.gateway'.tr(), transaction.gateway.displayName),
                  _buildDetailRow(
                    'payment.date'.tr(),
                    formatNepalTime(transaction.createdAt, 'MMM dd, yyyy • hh:mm a', context.locale.languageCode),
                  ),
                  if (transaction.transactionId != null)
                    _buildDetailRow(
                      'payment.transactionId'.tr(),
                      transaction.transactionId!,
                    ),
                  if (transaction.gatewayTransactionId != null)
                    _buildDetailRow(
                      'payment.gatewayRef'.tr(),
                      transaction.gatewayTransactionId!,
                    ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[100],
                        foregroundColor: Colors.grey[800],
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text('common.close'.tr()),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
