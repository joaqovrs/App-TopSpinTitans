// Suscribe a cambios (INSERT/UPDATE/DELETE) de las tablas dadas y llama onChange
// cuando algo cambia, para que la pantalla se actualice sola (tiempo real).
//
// onChange se guarda en un ref: la suscripcion no se recrea aunque cambie la
// funcion en cada render (solo se recrea si cambia la lista de tablas).
import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';

export function useRealtime(tables: string[], onChange: () => void) {
  const cb = useRef(onChange);
  cb.current = onChange;

  const key = tables.join(',');

  useEffect(() => {
    const channel = supabase.channel(`rt:${key}:${Math.random().toString(36).slice(2)}`);
    for (const table of key.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => cb.current());
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [key]);
}
