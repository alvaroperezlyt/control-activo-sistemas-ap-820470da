import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/sucursales")({
  head: () => ({
    meta: [
      { title: "Sucursales | Activos TI" },
      { name: "description", content: "Creación y consulta de sucursales con nombre y lugar." },
      { property: "og:title", content: "Sucursales | Activos TI" },
      { property: "og:description", content: "Administra las sucursales donde se ubican los equipos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sucursales,
});

function Sucursales() {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [lugar, setLugar] = useState("");

  const { data: sucursales = [] } = useQuery({
    queryKey: ["sucursales", "detalle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("almacenes")
        .select("id, nombre, lugar, equipos(count)")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("almacenes")
        .insert({ nombre: nombre.trim(), lugar: lugar.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      toast.success("Sucursal creada");
      setNombre("");
      setLugar("");
      setAbierto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader titulo="Sucursales" descripcion="Ubicaciones donde se ubican los equipos libres o de baja.">
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" />
          Nueva sucursal
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {sucursales.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay sucursales registradas.</p>
        )}
        {sucursales.map((a) => (
          <div key={a.id} className="panel p-5">
            <p className="label-mono">{a.lugar}</p>
            <h2 className="mt-1 font-semibold">{a.nombre}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {a.equipos?.[0]?.count ?? 0} equipos registrados
            </p>
          </div>
        ))}
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva sucursal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lugar">Lugar</Label>
              <Input
                id="lugar"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Ciudad, oficina o dirección"
                maxLength={160}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!nombre.trim() || !lugar.trim()) {
                  toast.error("Nombre y lugar son obligatorios.");
                  return;
                }
                crear.mutate();
              }}
              disabled={crear.isPending}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
