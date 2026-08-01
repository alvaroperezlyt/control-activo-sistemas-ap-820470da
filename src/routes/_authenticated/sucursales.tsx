import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
      { title: "Sucursales / Líneas de Negocio | Activos TI" },
      {
        name: "description",
        content: "Creación, edición y consulta de sucursales o líneas de negocio con nombre y lugar.",
      },
      { property: "og:title", content: "Sucursales / Líneas de Negocio | Activos TI" },
      {
        property: "og:description",
        content: "Administra las sucursales o líneas de negocio donde se ubican los equipos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sucursales,
});

function Sucursales() {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
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

  const cerrar = () => {
    setAbierto(false);
    setEditandoId(null);
    setNombre("");
    setLugar("");
  };

  const guardar = useMutation({
    mutationFn: async () => {
      const valores = { nombre: nombre.trim(), lugar: lugar.trim() };
      if (editandoId) {
        const { error } = await supabase.from("almacenes").update(valores).eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("almacenes").insert(valores);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast.success(editandoId ? "Sucursal/Línea de Negocio actualizada" : "Sucursal/Línea de Negocio creada");
      cerrar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        titulo="Sucursales / Líneas de Negocio"
        descripcion="Ubicaciones o líneas de negocio donde se encuentran los equipos."
      >
        <Button
          onClick={() => {
            setEditandoId(null);
            setNombre("");
            setLugar("");
            setAbierto(true);
          }}
        >
          <Plus className="size-4" />
          Nueva Sucursal/Línea de Negocio
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {sucursales.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no hay sucursales / líneas de negocio registradas.
          </p>
        )}
        {sucursales.map((a) => (
          <div key={a.id} className="panel relative p-5">
            <Link
              to="/equipos"
              search={{ almacen: a.id }}
              className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="label-mono">{a.lugar}</p>
              <h2 className="mt-1 font-semibold hover:underline">{a.nombre}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {a.equipos?.[0]?.count ?? 0} equipos registrados · ver equipos
              </p>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3"
              aria-label={`Editar ${a.nombre}`}
              onClick={() => {
                setEditandoId(a.id);
                setNombre(a.nombre);
                setLugar(a.lugar);
                setAbierto(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={abierto} onOpenChange={(v) => (v ? setAbierto(true) : cerrar())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar Sucursal/Línea de Negocio" : "Nueva Sucursal/Línea de Negocio"}
            </DialogTitle>
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
            <Button variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!nombre.trim() || !lugar.trim()) {
                  toast.error("Nombre y lugar son obligatorios.");
                  return;
                }
                guardar.mutate();
              }}
              disabled={guardar.isPending}
            >
              {editandoId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
