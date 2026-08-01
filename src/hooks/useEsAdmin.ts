import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEsAdmin() {
  const { data: esAdmin = false, isLoading } = useQuery({
    queryKey: ["rol", "es-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const id = userData.user?.id;
      if (!id) return false;
      const { data, error } = await supabase.rpc("has_role", { _user_id: id, _role: "admin" });
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 5 * 60_000,
  });

  return { esAdmin, cargando: isLoading };
}
