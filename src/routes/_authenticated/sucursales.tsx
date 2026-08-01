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

export const Route = createFileRoute("/_authenticated/almacenes")({
  head: () => ({
    meta: [
      { title: "Almacenes | Activos TI" },
      { name: "description", content: "Creación y consulta de almacenes con nombre y lugar." },
      { property: "og:title", content: "Almacenes | Activos TI" },
      { property: "og:description", content: "Administra los almacenes donde se resguardan los equipos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Almacenes,
});

function Almacenes() {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [lugar, setLugar] = useState("");

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes", "detalle"],
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
      queryClient.invalidateQueries({ queryKey: ["almacenes"] });
      toast.success("Almacén creado");
      setNombre("");
      setLugar("");
      setAbierto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader titulo="Almacenes" descripcion="Ubicaciones donde se resguardan los equipos libres o de baja.">
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" />
          Nuevo almacén
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {almacenes.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay almacenes registrados.</p>
        )}
        {almacenes.map((a) => (
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
            <DialogTitle>Nuevo almacén</DialogTitle>
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
