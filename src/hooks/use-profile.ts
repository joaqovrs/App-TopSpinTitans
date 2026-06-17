// Trae el perfil propio desde Supabase y lo recarga al enfocar la pantalla.
// Lo usan Inicio y Perfil.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, membership_status, role')
        .eq('id', session.user.id)
        .single();
      if (queryError) throw queryError;
      setProfile(data as Profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { profile, loading, error, reload };
}
