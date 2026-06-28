import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button, Txt } from './ui';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

// Verrou de l'Espace opérateur — code PIN (≥ 4 chiffres).
// 1ʳᵉ fois : l'opérateur CRÉE son code sur l'appareil. Ensuite : il le saisit.
// Le code est redemandé à chaque lancement de l'app (cf. AppContext.operatorUnlocked).
export function OperatorPinSheet({
  visible,
  onClose,
  onUnlocked,
}: {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const { state, unlockOperator } = useApp();
  const creating = !state.operatorPin; // pas encore de code défini → mode création
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCode('');
    setConfirm('');
    setError(null);
  };

  const submit = () => {
    if (creating && code !== confirm) {
      setError('Les deux codes ne correspondent pas.');
      return;
    }
    if (unlockOperator(code)) {
      reset();
      onUnlocked();
    } else {
      setError(creating ? 'Choisis un code d’au moins 4 chiffres.' : 'Code incorrect — réessaie.');
    }
  };

  const canSubmit = code.length >= 4 && (!creating || confirm.length >= 4);

  return (
    <BottomSheet
      visible={visible}
      title={creating ? 'Crée ton code opérateur' : 'Espace opérateur'}
      subtitle={
        creating
          ? 'Choisis un code secret (≥ 4 chiffres). Il te sera redemandé à chaque ouverture. Garde-le pour toi.'
          : 'Entre ton code opérateur pour continuer.'
      }
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <View style={{ gap: spacing.md }}>
        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, '').slice(0, 8));
            setError(null);
          }}
          placeholder={creating ? 'Nouveau code' : '••••'}
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          style={styles.input}
        />
        {creating ? (
          <TextInput
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t.replace(/\D/g, '').slice(0, 8));
              setError(null);
            }}
            placeholder="Confirme le code"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            style={styles.input}
          />
        ) : null}
        {error ? (
          <Txt variant="small" color={colors.danger}>
            {error}
          </Txt>
        ) : null}
        <Button
          label={creating ? 'Créer et ouvrir' : 'Déverrouiller'}
          icon="lock-open"
          disabled={!canSubmit}
          onPress={submit}
          full
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
