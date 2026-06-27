import { View, StyleSheet } from 'react-native';
import { Txt } from './ui';
import { colors, radius, spacing } from '@/theme';

// Mini graphique à barres verticales (tokens uniquement). Remplissage par créneau,
// stats club… Hauteur relative au max ; barre minimale visible même à 0.
export function BarChart({
  data,
  color = colors.signature,
  height = 88,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.row}>
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <View key={d.label} style={styles.col}>
            <Txt variant="small" color={colors.textFaint} style={{ fontSize: 10 }}>
              {d.value}
            </Txt>
            <View style={[styles.track, { height }]}>
              <View style={[styles.fill, { height: `${Math.max(pct, 4)}%` as `${number}%`, backgroundColor: color }]} />
            </View>
            <Txt variant="small" color={colors.textFaint} style={{ fontSize: 9 }} numberOfLines={1}>
              {d.label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  track: { width: '100%', borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: radius.sm },
});
