import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Tag, Txt } from './ui';
import type { Match } from '@/data/matches';
import { colors, spacing } from '@/theme';

export function MatchCard({ match }: { match: Match }) {
  const [joined, setJoined] = useState(false);
  const isPublic = match.visibility === 'public';

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={styles.topRow}>
        <Tag label={match.type} tone="neutral" />
        <Tag
          label={isPublic ? 'Public' : 'Amis uniquement'}
          tone={isPublic ? 'green' : 'gold'}
          icon={isPublic ? 'earth' : 'people'}
        />
      </View>

      <Txt variant="h3" style={{ marginTop: spacing.md }}>
        {match.clubName}
      </Txt>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Txt variant="muted">
            {match.date} · {match.time}
          </Txt>
        </View>
        <View style={styles.meta}>
          <Ionicons name="podium-outline" size={14} color={colors.textMuted} />
          <Txt variant="muted">{match.level}</Txt>
        </View>
      </View>

      <View style={styles.footer}>
        <Txt variant="muted">
          {match.spotsLeft} place{match.spotsLeft > 1 ? 's' : ''} · Hôte : {match.host}
        </Txt>
        <Button
          size="sm"
          label={joined ? 'Inscrit ✓' : 'Rejoindre'}
          variant={joined ? 'secondary' : 'primary'}
          onPress={() => setJoined((v) => !v)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});
