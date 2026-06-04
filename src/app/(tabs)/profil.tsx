import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button, Card, Divider, IconCircle, SectionHeader, Tag, Txt } from '@/components/ui';
import { currentUser, seedFriends } from '@/data/user';
import { useApp } from '@/store/AppContext';
import { initials } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export default function ProfilScreen() {
  const router = useRouter();
  const { state, recordWin, recordLoss, setDefaultVisibility, resetAll } = useApp();
  const { wins, losses, played, defaultVisibility, reservations } = state;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <Screen title="Profil">
      {/* En-tête joueur */}
      <Card style={{ marginTop: spacing.sm }}>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Txt variant="display" color={colors.gold}>
              {initials(currentUser.name)}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="h2">{currentUser.name}</Txt>
            <Txt variant="muted">{currentUser.handle}</Txt>
            <View style={{ marginTop: spacing.sm }}>
              <Tag label={currentUser.level} tone="gold" icon="ribbon" />
            </View>
          </View>
        </View>
      </Card>

      {/* Statistiques */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Mes statistiques" />
        <View style={styles.stats}>
          <Stat value={wins} label="Victoires" color={colors.green} />
          <Stat value={losses} label="Défaites" color={colors.danger} />
          <Stat value={played} label="Parties" color={colors.text} />
          <Stat value={`${winRate}%`} label="Réussite" color={colors.gold} />
        </View>
        <Card style={{ marginTop: spacing.md }}>
          <Txt variant="h3">Enregistrer un résultat</Txt>
          <Txt variant="muted" style={{ marginTop: 2 }}>
            C’est toi qui déclares tes résultats, en toute confiance.
          </Txt>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button label="J'ai gagné" icon="trophy" onPress={recordWin} full />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="J'ai perdu" icon="close" variant="danger" onPress={recordLoss} full />
            </View>
          </View>
        </Card>
      </View>

      {/* Visibilité par défaut */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Visibilité par défaut" />
        <Card>
          <Txt variant="muted" style={{ marginBottom: spacing.md }}>
            Qui voit tes matchs quand tu en crées un ?
          </Txt>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <VisChip
              active={defaultVisibility === 'public'}
              icon="earth"
              label="Public"
              onPress={() => setDefaultVisibility('public')}
            />
            <VisChip
              active={defaultVisibility === 'amis'}
              icon="people"
              label="Amis"
              onPress={() => setDefaultVisibility('amis')}
            />
          </View>
        </Card>
      </View>

      {/* Réservations */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Mes réservations" />
        {reservations.length === 0 ? (
          <Card>
            <Txt variant="muted">Aucune réservation pour l’instant.</Txt>
          </Card>
        ) : (
          reservations.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <IconCircle icon="calendar" color={colors.green} bg={colors.greenSoft} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt variant="h3" style={{ fontSize: 15 }}>
                    {r.clubName}
                  </Txt>
                  <Txt variant="muted">
                    {r.date} · {r.time} · {r.players} joueurs
                  </Txt>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Amis */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title={`Amis · ${seedFriends.length}`} />
        <Card>
          {seedFriends.map((f, i) => (
            <View key={f.id}>
              {i > 0 ? <Divider style={{ marginVertical: spacing.sm }} /> : null}
              <View style={styles.friend}>
                <View style={styles.friendAvatar}>
                  <Txt variant="h3" color={colors.textMuted} style={{ fontSize: 14 }}>
                    {initials(f.name)}
                  </Txt>
                </View>
                <Txt variant="body" style={{ flex: 1, fontWeight: '600' }}>
                  {f.name}
                </Txt>
                <Tag label={f.level} tone="neutral" />
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* Espace Club */}
      <View style={{ marginTop: spacing.xl }}>
        <Card onPress={() => router.push('/club-admin')} style={styles.clubCta}>
          <IconCircle icon="business" />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">Tu gères un club ?</Txt>
            <Txt variant="muted">Ouvre l’Espace Club : créneaux, réservations, compétitions.</Txt>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Réinitialiser la démo" icon="refresh" variant="ghost" onPress={resetAll} />
      </View>
    </Screen>
  );
}

function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Txt variant="h2" color={color}>
        {value}
      </Txt>
      <Txt variant="small" color={colors.textMuted}>
        {label}
      </Txt>
    </View>
  );
}

function VisChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.visChip, active && styles.visChipActive]}>
      <Ionicons name={icon} size={16} color={active ? '#10120F' : colors.textMuted} />
      <Txt variant="small" color={active ? '#10120F' : colors.text} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  visChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  friend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
