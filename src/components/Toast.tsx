import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from './ui';
import { colors, radius, shadows, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ToastApi = { show: (message: string, opts?: { icon?: IconName }) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

/** Petit message éphémère de confirmation (« c'est fait ✅ »), réutilisable partout. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [icon, setIcon] = useState<IconName>('checkmark-circle');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback<ToastApi['show']>(
    (msg, opts) => {
      setMessage(msg);
      setIcon(opts?.icon ?? 'checkmark-circle');
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, 2400);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message !== null ? (
        <Animated.View pointerEvents="none" style={[styles.wrap, { opacity, bottom: insets.bottom + spacing.xl }]}>
          <View style={styles.toast}>
            <Ionicons name={icon} size={18} color={colors.white} />
            <Txt color={colors.white} style={{ flex: 1 }}>
              {message}
            </Txt>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    ...shadows.e3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 420,
    backgroundColor: colors.signatureDark,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
