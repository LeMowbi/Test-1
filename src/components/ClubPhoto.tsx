import { Image } from 'expo-image';
import { useState } from 'react';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { colors, radius } from '@/theme';

// Photo distante (réelle) avec repli automatique sur le visuel doré si l'image manque.
export function ClubPhoto({
  uri,
  accent,
  initials,
  height = 150,
  width,
  rounded = radius.lg,
}: {
  uri?: string;
  accent: string;
  initials?: string;
  height?: number;
  width?: number;
  rounded?: number;
}) {
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <PhotoPlaceholder accent={accent} initials={initials} height={height} rounded={rounded} showBadge={false} />
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setError(true)}
      contentFit="cover"
      transition={200}
      style={{ width: width ?? '100%', height, borderRadius: rounded, backgroundColor: colors.surfaceAlt }}
    />
  );
}
