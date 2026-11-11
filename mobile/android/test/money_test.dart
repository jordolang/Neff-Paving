import 'package:flutter_test/flutter_test.dart';
import 'package:neff_service/core/money.dart';

void main() {
  group('Money.parse', () {
    test('parses contract decimal strings exactly', () {
      expect(Money.parse('1250.00').cents, 125000);
      expect(Money.parse('0.10').cents, 10);
      expect(Money.parse('4200').cents, 420000);
      expect(Money.parse('19.9').cents, 1990);
    });

    test('handles signs, commas and dollar signs', () {
      expect(Money.parse('-3.10').cents, -310);
      expect(Money.parse(r'$1,234.56').cents, 123456);
      expect(Money.parse('+5').cents, 500);
    });

    test('rounds beyond two places half away from zero', () {
      expect(Money.parse('1.005').cents, 101);
      expect(Money.parse('1.004').cents, 100);
      expect(Money.parse('-1.005').cents, -101);
    });

    test('null/empty is zero; garbage throws', () {
      expect(Money.parse(null), Money.zero);
      expect(Money.parse(''), Money.zero);
      expect(() => Money.parse('abc'), throwsFormatException);
      expect(() => Money.parse('.'), throwsFormatException);
      expect(Money.tryParse('12x'), isNull);
    });

    test('parseOrNull distinguishes absent from zero', () {
      expect(Money.parseOrNull(null), isNull);
      expect(Money.parseOrNull('  '), isNull);
      expect(Money.parseOrNull('0.00'), Money.zero);
      expect(Money.parseOrNull('12.5')!.toApi(), '12.50');
    });

    test('accepts numbers without binary drift', () {
      expect(Money.parse(0.1).cents, 10);
      expect(Money.parse(3).cents, 300);
    });
  });

  group('formatting', () {
    test('toApi round-trips', () {
      for (final s in ['0.00', '1250.00', '-3.10', '0.05', '1000000.99']) {
        expect(Money.parse(s).toApi(), s);
      }
    });

    test('format shows currency with grouping', () {
      expect(Money.parse('1250').format(), r'$1,250.00');
      expect(Money.parse('0.5').format(), r'$0.50');
      expect(Money.parse('-1234.56').format(), r'-$1,234.56');
    });
  });

  group('arithmetic', () {
    test('add / subtract / compare', () {
      final a = Money.parse('10.10');
      final b = Money.parse('0.20');
      expect((a + b).toApi(), '10.30');
      expect((a - b).toApi(), '9.90');
      expect(a > b, isTrue);
      expect(b <= a, isTrue);
    });

    test('timesQuantity rounds to cents', () {
      expect(Money.parse('100.00').timesQuantity('2.5').toApi(), '250.00');
      expect(Money.parse('0.33').timesQuantity('3').toApi(), '0.99');
      expect(Money.parse('1.25').timesQuantity('0.5').toApi(), '0.63');
    });
  });
}
