// Modal "Editar perfil": cambia el nombre de usuario y la foto. La foto se
// elige con expo-image-picker, se sube a Storage al guardar y el nombre/URL se
// persisten via la RPC update_my_profile. Diseño: hoja inferior (como ScoreModal).
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/avatar';
import { updateMyProfile, uploadAvatar } from '@/lib/profile';
import { colors, fonts } from '@/lib/theme';

type Props = {
  visible: boolean;
  uid: string;
  currentName: string;
  currentAvatarUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
};

type Picked = { uri: string; base64: string; ext: string };

export function EditProfileModal({
  visible,
  uid,
  currentName,
  currentAvatarUrl,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(currentName);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre, arranca desde los valores actuales del perfil.
  function reset() {
    setName(currentName);
    setPicked(null);
    setSaving(false);
    setError(null);
  }

  function close() {
    if (saving) return;
    reset();
    onClose();
  }

  async function pickImage() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setError('No se pudo leer la imagen, intenta con otra.');
      return;
    }
    const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
    setPicked({ uri: asset.uri, base64: asset.base64, ext });
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let avatarUrl: string | undefined;
      if (picked) {
        avatarUrl = await uploadAvatar(uid, picked.base64, picked.ext);
      }
      await updateMyProfile(trimmed, avatarUrl);
      reset();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      setSaving(false);
    }
  }

  const previewUri = picked?.uri ?? currentAvatarUrl;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Editar perfil</Text>
            <Pressable hitSlop={8} onPress={close} disabled={saving}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.avatarWrap}>
              <Avatar name={name || '?'} size={104} ringColor={colors.primary} uri={previewUri} />
              <Pressable style={styles.cameraBtn} onPress={pickImage} disabled={saving}>
                <Ionicons name="camera" size={18} color="#fff" />
              </Pressable>
            </View>
            <Pressable onPress={pickImage} disabled={saving}>
              <Text style={styles.changePhoto}>Cambiar foto</Text>
            </Pressable>

            <View style={styles.field}>
              <Text style={styles.label}>Nombre de usuario</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={colors.mutedForeground}
                maxLength={40}
                editable={!saving}
                autoCapitalize="words"
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <Pressable style={styles.secondaryBtn} onPress={close} disabled={saving}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, saving && styles.btnDisabled]}
                onPress={save}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 18 },
  body: { paddingTop: 18, gap: 14, alignItems: 'center' },

  avatarWrap: { position: 'relative' },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  changePhoto: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14 },

  field: { alignSelf: 'stretch', gap: 8, marginTop: 4 },
  label: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 13 },
  input: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 16,
  },

  error: { color: colors.destructive, fontFamily: fonts.regular, fontSize: 13, alignSelf: 'stretch' },

  actions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch', marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});
