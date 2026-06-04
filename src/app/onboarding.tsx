import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Button, Txt } from '@/components/ui';
import { pickImage } from '@/lib/pickImage';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAccount, loadDemo } = useApp();
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

  const demo = () => {
    loadDemo();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Héros dégradé */}
        <LinearGradient
          colors={['#1A1710', '#15171C', colors.bg]}
          style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
        >
          <Logo size={40} />
          <Txt variant="display" style={{ fontSize: 30, marginTop: spacing.xl }}>
            Bienvenue 👋
          </Txt>
          <Txt variant="muted" style={{ marginTop: 4 }}>
            Crée ton profil pour réserver, jouer et suivre tes résultats.
          </Txt>
        </LinearGradient>

        <View style={styles.body}>
          {/* Photo optionnelle */}
          <View style={{ alignItems: 'center' }}>
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
          <Field label="Numéro de téléphone" value={phone} onChangeText={setPhone} placeholder="+225 07 00 00 00 00" keyboardType="phone-pad" />

          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <Button label="Créer mon profil" icon="checkmark" onPress={create} disabled={!ready} full />
            <Button label="Découvrir en démo" icon="play" variant="secondary" onPress={demo} full />
          </View>

          <Pressable onPress={() => router.push('/legal')} style={{ marginTop: spacing.lg }}>
            <Txt variant="small" color={colors.textFaint} style={{ textAlign: 'center' }}>
              En continuant, tu acceptes nos <Txt variant="small" color={colors.gold}>CGU & confidentialité</Txt>.
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
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
