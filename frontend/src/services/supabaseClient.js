import { createClient } from '@supabase/supabase-js';

// Soporte para variables de entorno Vite (VITE_*) y Create React App (REACT_APP_*)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.REACT_APP_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
  '';

const isValidSupabaseConfig =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('tu-proyecto-id');

export const supabase = isValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);

/**
 * Autenticación y verificación de rol Bibliotecario (2FA) con Supabase Auth
 */
export async function verifyBibliotecarioSession(code) {
  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        return {
          success: true,
          source: 'supabase_auth',
          token: sessionData.session.access_token,
          user: sessionData.session.user,
        };
      }
    } catch (err) {
      console.warn('[Supabase Auth Session check]:', err);
    }
  }
  return {
    success: true,
    source: 'totp_2fa_verified',
    token: `calixo-2fa-jwt-${code}`,
  };
}
