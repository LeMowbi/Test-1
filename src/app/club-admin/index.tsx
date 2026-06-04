import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { ClubPhoto } from '@/components/ClubPhoto';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, IconCircle, SectionHeader, Tag, Txt } from '@/components/ui';
import { clubsByName, getClub } from '@/data/clubs';
import { seedCompetitions } from '@/data/competitions';
import { useApp } from '@/store/AppContext';
import { initials } from '@/lib/format';
import { pickImage } from '@/lib/pickImage';
import { colors, radius, spacing } from '@/theme';

const ALL_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

export default function ClubAdmin() {
  const router = useRouter();
  const { state, setClubMode, setManagedClub, addClubSlot, removeClubSlot, addClubPhoto, removeClubPhoto } = useApp();
  const [url, setUrl] = useState('');

  const club = getClub(state.managedClubId) ?? clubsByName[0];
  const openSlots = state.clubSlots[club.id] ?? [];
  const photos = state.clubPhotos[club.id] ?? [];
  const reservations = state.reservations.filter((r) => r.clubId === club.id);
  const comps = [
    ...state.myCompetitions.filter((c) => c.clubId === club.id),
    ...seedCompetitions.filter((c) => c.clubId === club.id),
  ];

  const addPhotoFromDevice = async () => {
    const uri = await pickImage();
    if (uri) addClubPhoto(club.id, uri);
  };
  const addPhotoFromUrl = () => {
    if (/^https?:\/\//.test(url.trim())) {
      addClubPhoto(club.id, url.trim());
      setUrl('');
    }
  };

  return (
    <Screen back title="Espace Club" subtitle="Gérez votre club">
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={15} color={colors.textFaint} />
        <Txt variant="small" color={colors.textFaint} style={{ flex: 1 }}>
          Démo de l’interface gérant. En production, l’accès serait réservé au club connecté.
        </Txt>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <IconCircle icon="business" />
        <View style={{ flex: 1 }}>
          <Txt variant="h3">Compte club (démo)</Txt>
          <Txt variant="muted">Active le mode gérant sur cet appareil.</Txt>
        </View>
        <Switch value={state.clubMode} onValueChange={setClubMode} trackColor={{ true: colors.gold, false: colors.border }} thumbColor={colors.white} />
      </Card>

      {/* Club géré */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Club géré" />
        <View style={styles.wrap}>
          {clubsByName.map((c) => (
            <Chip key={c.id} label={c.name} active={c.id === club.id} onPress={() => setManagedClub(c.id)} />
          ))}
        </View>
      </View>

      {/* Photos du terrain */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Photos du terrain" />
        <Card>
          <Txt variant="muted">Ajoute les vraies photos de ton club (visibles par les joueurs).</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.md }}>
            {photos.map((uri) => (
              <View key={uri}>
                <ClubPhoto uri={uri} accent={club.accent} initials={initials(club.name)} height={90} width={120} rounded={radius.md} />
                <Pressable onPress={() => removeClubPhoto(club.id, uri)} style={styles.removePhoto} hitSlop={6}>
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addPhotoFromDevice} style={styles.addTile}>
              <Ionicons name="camera-outline" size={22} color={colors.gold} />
              <Txt variant="small" color={colors.gold} style={{ marginTop: 4 }}>
                Ajouter
              </Txt>
            </Pressable>
          </ScrollView>

          <View style={styles.urlRow}>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="…ou coller un lien d'image (https://)"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              style={styles.input}
            />
            <Button size="sm" label="Ajouter" icon="add" onPress={addPhotoFromUrl} />
          </View>
          <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
            Sans photo ajoutée, des visuels illustratifs sont affichés aux joueurs.
          </Txt>
        </Card>
      </View>

      {/* Créneaux */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Créneaux ouverts à la réservation" />
        <Card>
          <Txt variant="muted">Créneaux actuellement ouverts (touche pour retirer) :</Txt>
          <View style={styles.wrap}>
            {openSlots.length === 0 ? (
              <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
                Aucun créneau ajouté. Les créneaux standards restent proposés par défaut.
              </Txt>
            ) : (
              openSlots.map((s) => (
                <Pressable key={s} onPress={() => removeClubSlot(club.id, s)} style={styles.openSlot}>
                  <Txt variant="small" color={colors.green} style={{ fontWeight: '600' }}>
                    {s}
                  </Txt>
                  <Ionicons name="close" size={13} color={colors.green} />
                </Pressable>
              ))
            )}
          </View>
          <Txt variant="muted" style={{ marginTop: spacing.lg }}>
            Ajouter un créneau :
          </Txt>
          <View style={styles.wrap}>
            {ALL_TIMES.filter((t) => !openSlots.includes(t)).map((t) => (
              <Chip key={t} label={t} icon="add" onPress={() => addClubSlot(club.id, t)} />
            ))}
          </View>
        </Card>
      </View>

      {/* Réservations reçues */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title={`Réservations reçues · ${reservations.length}`} />
        {reservations.length === 0 ? (
          <Card>
            <Txt variant="muted">
              Aucune réservation pour {club.name} pour l’instant. Réserve un créneau depuis la fiche du club pour la voir
              apparaître ici.
            </Txt>
          </Card>
        ) : (
          reservations.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <IconCircle icon="time" color={colors.gold} bg={colors.goldSoft} size={40} />
              <View style={{ flex: 1 }}>
                <Txt variant="h3" style={{ fontSize: 15 }}>
                  {r.date} · {r.time}
                </Txt>
                <Txt variant="muted">{r.players} joueurs{r.payment ? ` · ${r.payment}` : ''}</Txt>
              </View>
              <Tag label="À confirmer" tone="gold" />
            </Card>
          ))
        )}
      </View>

      {/* Compétitions du club */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader title="Compétitions du club" />
        <Button
          label="Créer une compétition (club)"
          icon="trophy"
          onPress={() => router.push(`/competition/nouvelle?as=club&clubId=${club.id}`)}
          full
        />
        <View style={{ marginTop: spacing.md }}>
          {comps.length === 0 ? (
            <EmptyState icon="trophy-outline" title="Aucune compétition" text="Crée le premier tournoi de ton club." />
          ) : (
            comps.map((c) => (
              <Card key={c.id} onPress={() => router.push(`/competition/${c.id}`)} style={{ marginBottom: spacing.sm }}>
                <Txt variant="h3" style={{ fontSize: 15 }}>
                  {c.title}
                </Txt>
                <Txt variant="muted">
                  {c.date} · {c.registered}/{c.slots} inscrits
                </Txt>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  openSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 120,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
});
