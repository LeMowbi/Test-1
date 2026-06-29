import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Button, Card, IconCircle, Txt } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/operator';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

// Aide & Support : signaler un problème (→ serveur, vu par l'opérateur), référencer son
// club, et nous écrire par e-mail. On n'expose aucun numéro : PadelConnect recontacte.
export default function Support() {
  const router = useRouter();
  const { submitSupportMessage } = useApp();
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (message.trim().length < 5 || sending) return;
    setSending(true);
    const res = await submitSupportMessage(message);
    setSending(false);
    if (res.ok) {
      setSent(true);
      setMessage('');
      toast.show('Message envoyé à PadelConnect ✅');
    } else {
      toast.show(res.error ?? 'Envoi impossible', { icon: 'alert-circle' });
    }
  };

  return (
    <Screen back title="Aide & support" subtitle="Une question, un souci ? On est là.">
      {/* Signaler un problème */}
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.head}>
          <IconCircle icon="chatbubble-ellipses-outline" color={colors.signature} bg={colors.signatureSoft} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">Signaler un problème</Txt>
            <Txt variant="muted">Décris ce qui ne va pas — on le reçoit directement.</Txt>
          </View>
        </View>
        {sent ? (
          <View style={styles.okBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
              Merci ! Ton message est bien arrivé. On revient vers toi si besoin.
            </Txt>
          </View>
        ) : null}
        <TextInput
          value={message}
          onChangeText={(t) => {
            setMessage(t);
            if (sent) setSent(false);
          }}
          placeholder="Explique ton problème (bug, réservation, club, paiement…)"
          placeholderTextColor={colors.textFaint}
          multiline
          style={styles.input}
        />
        <Button
          label={sending ? 'Envoi…' : 'Envoyer mon message'}
          icon="paper-plane"
          onPress={send}
          disabled={message.trim().length < 5 || sending}
          full
        />
      </Card>

      {/* Inscrire un club */}
      <Card onPress={() => router.push('/inscrire-club')} style={[styles.row, { marginTop: spacing.md }]}>
        <IconCircle icon="business" color={colors.amber} bg={colors.amberSoft} />
        <View style={{ flex: 1 }}>
          <Txt variant="h3">Ton club n'est pas dans la liste ?</Txt>
          <Txt variant="muted">Inscris-le — on te recontacte pour l'activer.</Txt>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>

      {/* Email direct */}
      <Card onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})} style={[styles.row, { marginTop: spacing.md }]}>
        <IconCircle icon="mail-outline" color={colors.purple} bg={colors.purpleSoft} />
        <View style={{ flex: 1 }}>
          <Txt variant="h3">Nous écrire par e-mail</Txt>
          <Txt variant="muted">{SUPPORT_EMAIL}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    height: 110,
    textAlignVertical: 'top',
    fontSize: 15,
    marginVertical: spacing.md,
  },
  okBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
