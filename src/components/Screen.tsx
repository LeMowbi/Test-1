import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from './ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  scroll?: boolean;
  headerRight?: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  title,
  subtitle,
  back,
  scroll = true,
  headerRight,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const header = (title || back) && (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {back ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          {title ? <Txt variant="h1">{title}</Txt> : null}
          {subtitle ? (
            <Txt variant="muted" style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {headerRight}
      </View>
    </View>
  );

  const body = (
    <>
      {header}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
