import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useToast } from '@/components/Toast';
import { Button, Card, Txt } from '@/components/ui';
import { opStyles } from '@/components/operator/styles';
import { fcfa } from '@/lib/format';
import { colors, spacing } from '@/theme';

// Frais fixe des tournois JOUEURS : l’opérateur fixe le montant (FCFA) figé à chaque nouvelle
// création de tournoi par un joueur. Les tournois des clubs n’en paient pas.
export function TournamentFee({
  fee,
  onSet,
  toast,
}: {
  fee: number;
  onSet: (amount: number) => Promise<{ ok: boolean }>;
  toast: ReturnType<typeof useToast>;
}) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const amount = Number(draft.replace(/[^\d]/g, ''));
    if (busy || !Number.isFinite(amount) || amount < 0) {
      toast.show('Entre un montant valide (FCFA)', { icon: 'alert-circle' });
      return;
    }
    setBusy(true);
    const { ok } = await onSet(amount);
    setBusy(false);
    if (ok) {
      setDraft('');
      toast.show('Frais des tournois mis à jour ✅');
    } else {
      toast.show('Changement impossible — réessaie', { icon: 'alert-circle' });
    }
  };

  return (
    <Card>
      <Txt variant="small" color={colors.textMuted}>
        Montant prélevé par PadelConnect sur chaque tournoi organisé par un JOUEUR (les tournois des clubs en sont exemptés). Il est figé à
        la création de chaque tournoi.
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Txt variant="body" style={{ fontWeight: '600' }}>
            Frais actuel
          </Txt>
          <Txt variant="muted">{fee > 0 ? fcfa(fee) : 'Aucun (gratuit)'}</Txt>
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`${fee}`}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={[opStyles.clubInput, { width: 96, marginTop: 0, textAlign: 'center' }]}
        />
        <Button size="sm" label={busy ? '…' : 'OK'} onPress={save} disabled={busy || !draft.trim()} />
      </View>
    </Card>
  );
}
