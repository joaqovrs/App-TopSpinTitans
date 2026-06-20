// Contexto de autenticacion: expone la sesion actual y las acciones de auth a
// toda la app. Escucha los cambios de sesion de Supabase para mantenerse al dia.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { unregisterPushToken } from '@/lib/notifications';

type AuthState = {
  session: Session | null;
  /** true mientras se resuelve la sesion inicial guardada. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Registra la cuenta. Devuelve si quedo pendiente de verificar el email. */
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, displayName: string) {
    // El nombre de usuario viaja en los metadatos; el trigger handle_new_user
    // lo usa como display_name del perfil.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    // Si no hay sesion, el proyecto pide confirmar el email (codigo).
    return { needsVerification: data.session === null };
  }

  async function signOut() {
    // Dar de baja el token ANTES de cerrar sesion (la RPC exige auth.uid()).
    // Si falla, no bloqueamos el logout.
    try {
      await unregisterPushToken();
    } catch (e) {
      console.warn('No se pudo dar de baja el token de push:', e);
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async function verifyEmail(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
  }

  async function resendCode(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, signIn, signUp, signOut, resetPassword, verifyEmail, resendCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return ctx;
}
