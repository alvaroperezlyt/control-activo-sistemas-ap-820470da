import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setCargando(false);
    });
    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, usuario: session?.user ?? null, cargando };
}
