import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEsAdmin() {
  const { data: esAdmin = false, isLoading } = useQuery({
    queryKey: ["rol", "es-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const id = userData.user?.id;
      if (!id) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 5 * 60_000,
  });

  return { esAdmin, cargando: isLoading };
}
