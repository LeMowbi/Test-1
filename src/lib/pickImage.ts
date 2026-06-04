import * as ImagePicker from 'expo-image-picker';

// Ouvre la galerie et renvoie l'URI de l'image choisie (ou null si annulé).
export async function pickImage(): Promise<string | null> {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (res.canceled) return null;
    return res.assets?.[0]?.uri ?? null;
  } catch {
    return null;
  }
}
