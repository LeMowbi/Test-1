import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Card, Txt } from './ui';
import { paymentMethods } from '@/data/payments';
import { colors, radius, spacing } from '@/theme';

// Sélection du moyen de paiement (radio). Paiement simulé dans le prototype.
export function PaymentMethods({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {paymentMethods.map((m) => {
        const active = m.id === value;
        return (
          <Card key={m.id} onPress={() => onChange(m.id)} style={[styles.row, active && { borderColor: colors.gold }]}>
            <View style={[styles.icon, { backgroundColor: m.accent + '22' }]}>
              <Ionicons name={m.icon} size={18} color={m.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="h3" style={{ fontSize: 15 }}>
                {m.label}
              </Txt>
              <Txt variant="muted">{m.hint}</Txt>
            </View>
            <Ionicons
              name={active ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={active ? colors.gold : colors.textFaint}
            />
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
