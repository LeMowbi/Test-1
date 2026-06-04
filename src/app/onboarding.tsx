import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button, Txt } from '@/components/ui';
import { pickImage } from '@/lib/pickImage';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

export default function Onboarding() {
  const router = useRouter();
  const { setAccount } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const ready =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 1 &&
    phone.replace(/\D/g, '').length >= 8;

  const choosePhoto = async () => {
    const uri = await pickImage();
    if (uri) setPhotoUri(uri);
  };

  const create = () => {
    if (!ready) return;
    setAccount({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), photoUri });
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Logo size={36} />
        <Txt variant="display" style={{ fontSize: 28, marginTop: spacing.lg }}>
          Crée ton profil
        </Txt>
        <Txt variant="muted" style={{ marginTop: 4 }}>
          Pour réserver, jouer et suivre tes résultats.
        </Txt>
      </View>

      {/* Photo optionnelle */}
      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Pressable onPress={choosePhoto} style={styles.avatar}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
          )}
        </Pressable>
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
          Photo (optionnel)
        </Txt>
      </View>

      <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Ex. Moustapha" />
      <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Ex. Bitar" />
      <Field
        label="Numéro de téléphone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+225 07 00 00 00 00"
        keyboardType="phone-pad"
      />

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Créer mon profil" icon="checkmark" onPress={create} disabled={!ready} full />
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Profil enregistré sur ton téléphone. La vérification par SMS viendra avec la version finale.
        </Txt>
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <>
      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType ?? 'default'}
        style={styles.input}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.lg },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: 15,
  },
});
