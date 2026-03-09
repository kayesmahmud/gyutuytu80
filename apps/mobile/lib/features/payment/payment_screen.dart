import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/api/payment_client.dart';
import '../../core/models/models.dart';
import '../../core/models/payment.dart';
import '../../core/utils/localized_helpers.dart';

/// Payment Screen - handles Khalti/eSewa payment flows
class PaymentScreen extends StatefulWidget {
  final PaymentGateway gateway;
  final double amount;
  final PaymentType paymentType;
  final int? relatedId;
  final String orderName;
  final Map<String, dynamic>? metadata;
  final VoidCallback? onSuccess;
  final VoidCallback? onFailure;

  const PaymentScreen({
    super.key,
    required this.gateway,
    required this.amount,
    required this.paymentType,
    this.relatedId,
    required this.orderName,
    this.metadata,
    this.onSuccess,
    this.onFailure,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final PaymentClient _paymentClient = PaymentClient();

  bool _isLoading = true;
  bool _isVerifying = false;
  bool _callbackHandled = false;
  String? _error;
  PaymentInitiateResponse? _paymentData;
  WebViewController? _webViewController;
  String? _transactionId;

  @override
  void initState() {
    super.initState();
    _initiatePayment();
  }

  Future<void> _initiatePayment() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _callbackHandled = false;
    });

    final response = await _paymentClient.initiatePayment(
      gateway: widget.gateway,
      amount: widget.amount,
      paymentType: widget.paymentType,
      relatedId: widget.relatedId,
      orderName: widget.orderName,
      metadata: widget.metadata,
    );

    if (response.success && response.data != null) {
      _paymentData = response.data;
      _transactionId = response.data!.transactionId;
      _setupWebView();
    } else {
      setState(() {
        _error = response.errorMessage ?? (context.locale.languageCode == 'ne' ? 'भुक्तानी सुरु गर्न असफल' : 'Failed to initiate payment');
        _isLoading = false;
      });
    }
  }

  void _setupWebView() {
    final paymentUrl = _paymentData!.paymentUrl;

    final navDelegate = NavigationDelegate(
      onPageStarted: (String url) {
        _handleNavigation(url);
      },
      onPageFinished: (String url) {
        setState(() {
          _isLoading = false;
        });
      },
      onWebResourceError: (WebResourceError error) {
        if (error.errorType == WebResourceErrorType.unknown) return;
        setState(() {
          _error = context.locale.languageCode == 'ne'
              ? 'भुक्तानी पृष्ठ लोड गर्न असफल: ${error.description}'
              : 'Failed to load payment page: ${error.description}';
          _isLoading = false;
        });
      },
      onNavigationRequest: (NavigationRequest request) {
        if (PaymentClient.isPaymentCallback(request.url)) {
          _handlePaymentCallback(request.url);
          return NavigationDecision.prevent;
        }
        return NavigationDecision.navigate;
      },
    );

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(navDelegate);

    // eSewa requires POST — load an auto-submit HTML form
    if (widget.gateway == PaymentGateway.esewa &&
        paymentUrl.contains('epay/main/v2/form')) {
      final uri = Uri.parse(paymentUrl);
      final formUrl = '${uri.scheme}://${uri.host}${uri.path}';
      final html = _buildEsewaAutoSubmitForm(formUrl, uri.queryParameters);
      _webViewController!.loadHtmlString(html);
    } else {
      _webViewController!.loadRequest(Uri.parse(paymentUrl));
    }

    setState(() {});
  }

  /// Builds an HTML page with hidden form fields that auto-submits via POST.
  /// This matches how the web handles eSewa payments.
  String _buildEsewaAutoSubmitForm(
      String actionUrl, Map<String, String> fields) {
    final hiddenInputs = fields.entries
        .map((e) =>
            '<input type="hidden" name="${const HtmlEscape().convert(e.key)}" value="${const HtmlEscape().convert(e.value)}" />')
        .join('\n');

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:sans-serif; background:#f9fafb; }
    .loader { text-align:center; }
    .spinner { width:40px; height:40px; border:4px solid #e5e7eb; border-top-color:#60BB46; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    p { color:#6b7280; font-size:14px; }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Redirecting to eSewa...</p>
  </div>
  <form id="esewaForm" method="POST" action="$actionUrl">
    $hiddenInputs
  </form>
  <script>document.getElementById('esewaForm').submit();</script>
</body>
</html>
''';
  }

  void _handleNavigation(String url) {
    // Check for payment success/failure patterns
    if (PaymentClient.isPaymentCallback(url)) {
      _handlePaymentCallback(url);
    }
  }

  Future<void> _handlePaymentCallback(String url) async {
    // Guard against duplicate calls (both onNavigationRequest and onPageStarted can fire)
    if (_callbackHandled) return;
    _callbackHandled = true;

    final params = PaymentClient.parseCallbackUrl(url);
    final isSuccess = PaymentClient.isPaymentSuccess(url);

    if (isSuccess && _transactionId != null) {
      await _verifyPayment(params);
    } else {
      _handleFailure(context.locale.languageCode == 'ne'
          ? 'भुक्तानी रद्द भयो वा असफल भयो'
          : 'Payment was cancelled or failed');
    }
  }

  Future<void> _verifyPayment(Map<String, String> params) async {
    setState(() {
      _isVerifying = true;
    });

    // Extract gateway-specific data
    final pidx = params['pidx']; // Khalti
    final esewaData = params['data']; // eSewa encoded data

    final response = await _paymentClient.verifyPayment(
      transactionId: _transactionId!,
      pidx: pidx,
      esewaData: esewaData,
    );

    if (response.success && response.data != null) {
      _handleSuccess(response.data!);
    } else {
      _handleFailure(response.errorMessage ?? (context.locale.languageCode == 'ne'
          ? 'भुक्तानी प्रमाणीकरण असफल'
          : 'Payment verification failed'));
    }
  }

  void _handleSuccess(PaymentVerifyResponse result) {
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
                LucideIcons.checkCircle,
                color: Color(0xFF10B981),
                size: 48,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              locale == 'ne' ? 'भुक्तानी सफल!' : 'Payment Successful!',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${locale == 'ne' ? 'कारोबार आईडी' : 'Transaction ID'}: ${result.transactionId}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              '${locale == 'ne' ? 'रकम' : 'Amount'}: ${formatLocalizedPrice(widget.amount, locale)}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop(true);
                  widget.onSuccess?.call();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  l('done', locale),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleFailure(String message) {
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
                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.alertCircle,
                color: Color(0xFFEF4444),
                size: 48,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              locale == 'ne' ? 'भुक्तानी असफल' : 'Payment Failed',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).pop(false);
                      widget.onFailure?.call();
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(color: Colors.grey[300]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(l('cancel', locale)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      _initiatePayment();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC143C),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(l('retry', locale)),
                  ),
                ),
              ],
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
        title: Text(
          widget.gateway == PaymentGateway.khalti
              ? (context.locale.languageCode == 'ne' ? 'खल्ती भुक्तानी' : 'Khalti Payment')
              : (context.locale.languageCode == 'ne' ? 'eSewa भुक्तानी' : 'eSewa Payment'),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(LucideIcons.x),
          onPressed: () => _showCancelConfirmation(),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_error != null) {
      return _buildErrorState();
    }

    if (_isVerifying) {
      return _buildVerifyingState();
    }

    if (_isLoading || _webViewController == null) {
      return _buildLoadingState();
    }

    return WebViewWidget(controller: _webViewController!);
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: _getGatewayColor().withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const CircularProgressIndicator(),
          ),
          const SizedBox(height: 24),
          Text(
            context.locale.languageCode == 'ne' ? 'भुक्तानी तयार गर्दै...' : 'Preparing Payment...',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.locale.languageCode == 'ne'
                ? '${widget.gateway == PaymentGateway.khalti ? 'खल्ती' : 'eSewa'} मा जडान हुँदैछ'
                : 'Connecting to ${widget.gateway == PaymentGateway.khalti ? 'Khalti' : 'eSewa'}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifyingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const CircularProgressIndicator(
              color: Color(0xFF10B981),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            context.locale.languageCode == 'ne' ? 'भुक्तानी प्रमाणीकरण हुँदैछ...' : 'Verifying Payment...',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.locale.languageCode == 'ne'
                ? 'कृपया प्रतीक्षा गर्नुहोस्, तपाईंको भुक्तानी पुष्टि हुँदैछ'
                : 'Please wait while we confirm your payment',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
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
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.alertCircle,
                color: Color(0xFFEF4444),
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              context.locale.languageCode == 'ne' ? 'भुक्तानी सुरु गर्न असमर्थ' : 'Unable to Start Payment',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    side: BorderSide(color: Colors.grey[300]!),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(l('cancel', context.locale.languageCode)),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _initiatePayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFDC143C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(l('tryAgain', context.locale.languageCode)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getGatewayColor() {
    return widget.gateway == PaymentGateway.khalti
        ? const Color(0xFF5C2D91) // Khalti purple
        : const Color(0xFF60BB46); // eSewa green
  }

  void _showCancelConfirmation() {
    final locale = context.locale.languageCode;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(locale == 'ne' ? 'भुक्तानी रद्द गर्ने?' : 'Cancel Payment?'),
        content: Text(locale == 'ne'
            ? 'के तपाईं यो भुक्तानी रद्द गर्न चाहनुहुन्छ?'
            : 'Are you sure you want to cancel this payment?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(locale == 'ne' ? 'होइन, जारी राख्नुहोस्' : 'No, Continue'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context, false);
              widget.onFailure?.call();
            },
            child: Text(
              locale == 'ne' ? 'हो, रद्द गर्नुहोस्' : 'Yes, Cancel',
              style: const TextStyle(color: Color(0xFFEF4444)),
            ),
          ),
        ],
      ),
    );
  }
}
