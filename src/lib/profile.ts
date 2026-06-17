// Acciones sobre el perfil propio: subir la foto a Storage y guardar los
// cambios (nombre / avatar) via la RPC update_my_profile. La app nunca escribe
// directo: la foto va al bucket 'avatars' y el nombre/URL pasan por la RPC.
import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';

// Decodifica base64 a bytes sin dependencias extra (atob es global en RN/Hermes).
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sube una foto (en base64, como la entrega expo-image-picker) al bucket de
 * avatares, dentro de la carpeta del usuario, y devuelve su URL publica.
 * Usa un nombre unico por subida para evitar problemas de cache del CDN.
 */
export async function uploadAvatar(
  uid: string,
  base64: string,
  ext = 'jpg'
): Promise<string> {
  const path = `${uid}/${Date.now()}.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, base64ToBytes(base64), { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Guarda los cambios del perfil propio. `avatarUrl` es opcional: si no se pasa
 * (undefined/null), el backend conserva la foto actual y solo cambia el nombre.
 */
export async function updateMyProfile(
  displayName: string,
  avatarUrl?: string | null
): Promise<void> {
  const { error } = await supabase.rpc('update_my_profile', {
    p_display_name: displayName,
    p_avatar_url: avatarUrl ?? null,
  });
  if (error) throw error;
}
