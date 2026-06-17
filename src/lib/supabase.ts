// Cliente de Supabase para la app movil.
//
// SDK 56: la persistencia de sesion usa un localStorage respaldado por
// expo-sqlite (no @react-native-async-storage/async-storage). El import de
// abajo instala el global `localStorage` antes de crear el cliente.
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. Revisa el archivo .env.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // La app movil no maneja sesiones desde una URL (eso es cosa de la web).
    detectSessionInUrl: false,
  },
});
