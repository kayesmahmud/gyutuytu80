import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/verification/business_verification_form.dart';
import 'package:mobile/features/verification/individual_verification_form.dart';

import 'helpers/pump_localized.dart';

/// The verification forms are long: the name field is at the top, the submit
/// button far below the document pickers. A Form only knows about fields that
/// are currently mounted, so a lazily-built scroll view that unmounts the
/// scrolled-away name field makes `validate()` pass without it and `save()`
/// skip its `onSaved` — the request then reaches the API with no name.
/// Prod row #4955 (2026-09-17) was created exactly this way.
void main() {
  /// Drops focus (as tapping an image picker does) and scrolls the submit
  /// button into view, which is what lets a lazy list unmount the top fields.
  Future<void> unfocusAndScrollTo(WidgetTester tester, String label) async {
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();
    await tester.scrollUntilVisible(
      find.text(label),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
  }

  group('IndividualVerificationForm', () {
    Widget form() => const IndividualVerificationForm(
      durationDays: 180,
      price: 0,
      isFreeVerification: true,
      isResubmission: false,
    );

    testWidgets('an empty name is still rejected after scrolling to Submit', (
      tester,
    ) async {
      await pumpLocalized(tester, form());
      // Every other required field is valid; only the name is empty.
      await tester.enterText(
        find.byType(TextFormField).at(1),
        '19-01-82-12838',
      );
      await unfocusAndScrollTo(tester, 'Submit for Verification');

      final formState = tester.state<FormState>(find.byType(Form));
      expect(formState.validate(), isFalse);
    });

    testWidgets('the name typed at the top survives scrolling to Submit', (
      tester,
    ) async {
      await pumpLocalized(tester, form());
      await tester.enterText(
        find.byType(TextFormField).first,
        'Bidhneshwar Kumar Singh',
      );
      await unfocusAndScrollTo(tester, 'Submit for Verification');

      // Scroll back up: the value must still be there for save() to read.
      await tester.scrollUntilVisible(
        find.text('Full Name (as on ID document) *'),
        -300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      expect(find.text('Bidhneshwar Kumar Singh'), findsOneWidget);
    });
  });

  group('BusinessVerificationForm', () {
    Widget form() => const BusinessVerificationForm(
      durationDays: 180,
      price: 0,
      isFreeVerification: true,
      isResubmission: false,
    );

    testWidgets('an empty business name is still rejected after scrolling', (
      tester,
    ) async {
      await pumpLocalized(tester, form());
      // Every other required field is valid; only the business name is empty.
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Pan Card').last);
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(1), 'PAN-123456');
      await unfocusAndScrollTo(tester, 'Submit Verification');

      final formState = tester.state<FormState>(find.byType(Form));
      expect(formState.validate(), isFalse);
    });

    testWidgets('the business name typed at the top survives scrolling', (
      tester,
    ) async {
      await pumpLocalized(tester, form());
      await tester.enterText(find.byType(TextFormField).first, 'Singh Traders');
      await unfocusAndScrollTo(tester, 'Submit Verification');

      await tester.scrollUntilVisible(
        find.text('Business Name'),
        -300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      expect(find.text('Singh Traders'), findsOneWidget);
    });
  });
}
