import 'package:intl/intl.dart';

/// Nepal Time offset: UTC+5:45
const _nepalOffset = Duration(hours: 5, minutes: 45);

/// Converts a UTC DateTime to Nepal Time (UTC+5:45).
/// If the DateTime is already local (not UTC), it first converts to UTC.
DateTime toNepalTime(DateTime dt) {
  final utc = dt.isUtc ? dt : dt.toUtc();
  return utc.add(_nepalOffset);
}

/// Formats a DateTime in Nepal Time with the given pattern.
/// Pass [locale] ('ne' or 'en') for localized month/day names.
String formatNepalTime(DateTime dt, String pattern, [String locale = 'en']) {
  return DateFormat(pattern, locale).format(toNepalTime(dt));
}

/// Formats price with commas and localized currency symbol.
/// Returns "रु." for Nepali, "Rs." for English.
String formatLocalizedPrice(double? price, String locale) {
  if (price == null) return locale == 'ne' ? 'मूल्यको लागि सम्पर्क गर्नुहोस्' : 'Contact for price';
  if (price == 0) return locale == 'ne' ? 'निःशुल्क' : 'Free';
  final formatted = price
      .toStringAsFixed(0)
      .replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]},',
      );
  return locale == 'ne' ? 'रु. $formatted' : 'Rs. $formatted';
}

/// Returns a localized "time ago" string.
String localizedTimeAgo(DateTime dateTime, String locale) {
  final difference = DateTime.now().difference(dateTime);
  if (difference.inDays > 7) {
    return formatNepalTime(dateTime, 'MMM d, yyyy', locale);
  } else if (difference.inDays > 0) {
    final d = difference.inDays;
    return locale == 'ne' ? '$d दिन अघि' : '${d}d ago';
  } else if (difference.inHours > 0) {
    final h = difference.inHours;
    return locale == 'ne' ? '$h घण्टा अघि' : '${h}h ago';
  } else if (difference.inMinutes > 0) {
    final m = difference.inMinutes;
    return locale == 'ne' ? '$m मिनेट अघि' : '${m}m ago';
  } else {
    return locale == 'ne' ? 'भर्खरै' : 'Just now';
  }
}

/// Common button/action labels
String l(String key, String locale) {
  const ne = {
    'cancel': 'रद्द गर्नुहोस्',
    'retry': 'पुनः प्रयास',
    'done': 'सम्पन्न',
    'save': 'सेभ गर्नुहोस्',
    'proceed': 'अगाडि बढ्नुहोस्',
    'tryAgain': 'पुनः प्रयास गर्नुहोस्',
    'delete': 'हटाउनुहोस्',
    'confirm': 'पुष्टि गर्नुहोस्',
    'close': 'बन्द गर्नुहोस्',
    'search': 'खोज्नुहोस्',
    'apply': 'लागू गर्नुहोस्',
    'reset': 'रिसेट',
    'yes': 'हो',
    'no': 'होइन',
    'back': 'पछाडि',
    'next': 'अर्को',
    'submit': 'पेश गर्नुहोस्',
    'edit': 'सम्पादन',
    'loading': 'लोड हुँदैछ...',
    'noResults': 'कुनै नतिजा भेटिएन',
    'somethingWentWrong': 'केही गलत भयो',
    'description': 'विवरण',
    'location': 'स्थान',
    'category': 'वर्ग',
    'condition': 'अवस्था',
    'price': 'मूल्य',
    'views': 'हेराइहरू',
    'free': 'निःशुल्क',
    'verified': 'प्रमाणित',
    'all': 'सबै',
    'about': 'बारेमा',
    'contactInfo': 'सम्पर्क जानकारी',
  };

  const en = {
    'cancel': 'Cancel',
    'retry': 'Retry',
    'done': 'Done',
    'save': 'Save',
    'proceed': 'Proceed',
    'tryAgain': 'Try Again',
    'delete': 'Delete',
    'confirm': 'Confirm',
    'close': 'Close',
    'search': 'Search',
    'apply': 'Apply',
    'reset': 'Reset',
    'yes': 'Yes',
    'no': 'No',
    'back': 'Back',
    'next': 'Next',
    'submit': 'Submit',
    'edit': 'Edit',
    'loading': 'Loading...',
    'noResults': 'No results found',
    'somethingWentWrong': 'Something went wrong',
    'description': 'Description',
    'location': 'Location',
    'category': 'Category',
    'condition': 'Condition',
    'price': 'Price',
    'views': 'Views',
    'free': 'Free',
    'verified': 'Verified',
    'all': 'All',
    'about': 'About',
    'contactInfo': 'Contact Information',
  };

  if (locale == 'ne') return ne[key] ?? en[key] ?? key;
  return en[key] ?? key;
}
