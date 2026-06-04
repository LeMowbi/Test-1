import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { Txt, type IconName } from './ui';
import { colors, radius, spacing } from '@/theme';

// Puce de sélection réutilisable (filtres, dates, créneaux, niveaux…).
export function Chip({
  label,
  active,
  onPress,
  size = 'md',
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  size?: 'md' | 'lg';
  icon?: IconName;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.base, size === 'lg' && styles.lg, active && styles.active]}>
      {icon ? <Ionicons name={icon} size={13} color={active ? colors.onGold : colors.textMuted} /> : null}
      <Txt variant="small" color={active ? colors.onGold : colors.text} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lg: { paddingHorizontal: spacing.lg },
  active: { backgroundColor: colors.gold, borderColor: colors.gold },
});
