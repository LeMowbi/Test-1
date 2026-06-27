import { SaveFormat, manipulateAsync, type Action } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Ouvre la galerie puis OPTIMISE l'image avant stockage : recadrage carré centré
// (avatars), redimensionnement et compression JPEG ≈ 0.8. Renvoie un data-URI
// base64 compact — l'état persisté reste léger (localStorage du prototype ≈ 5 Mo,
// une photo de téléphone brute peut le faire exploser) et l'image survit aux
// redémarrages sur tous les supports (web et natif).
export async function pickImage(opts: { square?: boolean } = {}): Promise<string | null> {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (res.canceled) return null; // annulation : aucun changement, aucune erreur
    const asset = res.assets?.[0];
    if (!asset?.uri) return null;
    return await shrink(asset, opts.square === true);
  } catch {
    return null;
  }
}

// Avatar : carré centré 512×512 max. Photo de club : 1280 de large max.
async function shrink(asset: { uri: string; width?: number; height?: number }, square: boolean): Promise<string | null> {
  const MAX = square ? 512 : 1280;
  try {
    const actions: Action[] = [];
    const w = asset.width ?? 0;
    const h = asset.height ?? 0;
    if (square && w > 0 && h > 0) {
      const side = Math.min(w, h);
      actions.push({
        crop: {
          originX: Math.floor((w - side) / 2),
          originY: Math.floor((h - side) / 2),
          width: side,
          height: side,
        },
      });
      if (side > MAX) actions.push({ resize: { width: MAX, height: MAX } });
    } else if (w > MAX) {
      // Jamais d'agrandissement : on ne réduit que si l'original est plus large.
      actions.push({ resize: { width: MAX } });
    }
    const out = await manipulateAsync(asset.uri, actions, {
      compress: 0.8,
      format: SaveFormat.JPEG,
      base64: true,
    });
    return out.base64 ? `data:image/jpeg;base64,${out.base64}` : out.uri;
  } catch {
    return asset.uri; // au pire : l'image d'origine (comportement d'avant)
  }
}
