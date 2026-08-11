import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sincronizarPersonal } from "@/lib/sync.functions";
import { PageHeader, EstadoBadge } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/personal")({
  head: () => ({
    meta: [
      { title: "Personal | Activos TI" },
      { name: "description", content: "Padrón de personal sincronizado desde la hoja oficial de RRHH." },
      { property: "og:title", content: "Personal | Activos TI" },
      { property: "og:description", content: "Consulta el personal activo y desvinculado con sus equipos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Personal,
});

function Personal() {
  const queryClient = useQueryClient();
  const sincronizar = useServerFn(sincronizarPersonal);
  const [texto, setTexto] = useState("");

  const { data: personal = [] } = useQuery({
    queryKey: ["personal", "detalle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal")
        .select("codigo, nombre, puesto, estado, synced_at, equipos(count)")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const sync = useMutation({
    mutationFn: () => sincronizar(),
    onSuccess: (r) => {
      queryClient.invalidateQueries();
      toast.success(`${r.total} registros sincronizados · ${r.desvinculados} desvinculados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    if (!q) return personal;
    return personal.filter((p) =>
      [p.nombre, p.codigo, p.puesto].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [personal, texto]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader titulo="Personal" descripcion="Padrón oficial de RRHH sincronizado desde Google Sheets.">
        <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
          <RefreshCw className={sync.isPending ? "size-4 animate-spin" : "size-4"} />
          Sincronizar ahora
        </Button>
      </PageHeader>

      <div className="panel p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar nombre, código o puesto…"
            className="pl-9"
          />
        </div>

        <div className="mt-4 tabla-scroll">
          <table className="w-full text-sm tabla-anclada">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">Código</th>
                <th className="pb-2 font-medium text-muted-foreground">Nombre</th>
                <th className="pb-2 font-medium text-muted-foreground">Puesto</th>
                <th className="pb-2 font-medium text-muted-foreground">Equipos</th>
                <th className="pb-2 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-muted-foreground">
                    No hay personal cargado. Usa “Sincronizar ahora”.
                  </td>
                </tr>
              )}
              {filtrados.map((p) => (
                <tr key={p.codigo} className="border-b border-border/60 last:border-0">
                  <td className="py-2 font-mono">{p.codigo}</td>
                  <td className="py-2">{p.nombre}</td>
                  <td className="py-2 text-muted-foreground">{p.puesto ?? "—"}</td>
                  <td className="py-2 font-mono">{p.equipos?.[0]?.count ?? 0}</td>
                  <td className="py-2">
                    <EstadoBadge estado={p.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{filtrados.length} personas</p>
      </div>
    </div>
  );
}
