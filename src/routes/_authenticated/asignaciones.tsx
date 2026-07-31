import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS, formatearFecha, type TipoEquipo } from "@/lib/tipos";
import { PageHeader, EstadoBadge } from "@/components/PageHeader";
import { PersonalSelect, type PersonaRow } from "@/components/PersonalSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/asignaciones")({
  head: () => ({
    meta: [
      { title: "Asignaciones | Activos TI" },
      { name: "description", content: "Asignación de equipos al personal y control de entregas vigentes." },
      { property: "og:title", content: "Asignaciones | Activos TI" },
      { property: "og:description", content: "Entrega equipos al personal y consulta el historial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Asignaciones,
});

function Asignaciones() {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [persona, setPersona] = useState<PersonaRow | null>(null);
  const [equipoId, setEquipoId] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const [filtroPersona, setFiltroPersona] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string; entrega: string; retorno: string } | null>(null);

  const { data: libres = [] } = useQuery({
    queryKey: ["equipos", "libres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select("id, codigo_interno, tipo, marca, modelo")
        .eq("estado_asignacion", "LIBRE")
        .order("codigo_interno");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: asignaciones = [] } = useQuery({
    queryKey: ["asignaciones", "lista", filtroPersona],
    queryFn: async () => {
      let q = supabase
        .from("asignaciones")
        .select(
          "id, fecha_entrega, fecha_retorno, personal_codigo, personal_nombre, observaciones, equipos(id, codigo_interno, tipo)",
        )
        .order("fecha_entrega", { ascending: false });
      if (filtroPersona) q = q.eq("personal_codigo", filtroPersona);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const guardarFechas = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      if (!editando.entrega) throw new Error("La fecha de entrega es obligatoria.");
      if (editando.retorno && editando.retorno < editando.entrega)
        throw new Error("La devolución no puede ser anterior a la entrega.");
      const { error } = await supabase
        .from("asignaciones")
        .update({
          fecha_entrega: editando.entrega,
          fecha_retorno: editando.retorno || null,
        })
        .eq("id", editando.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Fechas actualizadas");
      setEditando(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const asignar = useMutation({
    mutationFn: async () => {
      if (!persona || !equipoId) throw new Error("Selecciona persona y equipo.");
      const { error } = await supabase.from("asignaciones").insert({
        equipo_id: equipoId,
        personal_codigo: persona.codigo,
        personal_nombre: persona.nombre,
        fecha_entrega: fecha,
        observaciones: observaciones.trim() || null,
      });
      if (error) throw error;
      const { error: errEquipo } = await supabase
        .from("equipos")
        .update({ estado_asignacion: "ASIGNADO", personal_codigo: persona.codigo })
        .eq("id", equipoId);
      if (errEquipo) throw errEquipo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Equipo asignado");
      setAbierto(false);
      setPersona(null);
      setEquipoId("");
      setObservaciones("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader titulo="Asignaciones" descripcion="Entrega de equipos al personal activo.">
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" />
          Asignar equipo
        </Button>
      </PageHeader>

      <div className="panel mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-64 flex-1 space-y-2">
          <Label>Filtrar por persona</Label>
          <PersonalSelect
            value={filtroPersona}
            onChange={(codigo) => setFiltroPersona(codigo)}
            placeholder="Todas las personas…"
          />
        </div>
        {filtroPersona && (
          <Button variant="outline" onClick={() => setFiltroPersona(null)}>
            Limpiar filtro
          </Button>
        )}
      </div>

      <div className="panel overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-medium text-muted-foreground">Equipo</th>
              <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
              <th className="pb-2 font-medium text-muted-foreground">Persona</th>
              <th className="pb-2 font-medium text-muted-foreground">Entrega</th>
              <th className="pb-2 font-medium text-muted-foreground">Devolución</th>
              <th className="pb-2 font-medium text-muted-foreground">Estado</th>
              <th className="pb-2 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-muted-foreground">
                  Sin asignaciones registradas.
                </td>
              </tr>
            )}
            {asignaciones.map((a) => (
              <tr key={a.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 font-mono">
                  {a.equipos ? (
                    <Link to="/equipos/$id" params={{ id: a.equipos.id }} className="hover:underline">
                      {a.equipos.codigo_interno}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2">
                  {a.equipos ? (TIPOS[a.equipos.tipo as TipoEquipo]?.labelSingular ?? a.equipos.tipo) : "—"}
                </td>
                <td className="py-2">{a.personal_nombre}</td>
                <td className="py-2">{formatearFecha(a.fecha_entrega)}</td>
                <td className="py-2">{formatearFecha(a.fecha_retorno)}</td>
                <td className="py-2">
                  <EstadoBadge estado={a.fecha_retorno ? "DEVUELTO" : "ASIGNADO"} />
                </td>
                <td className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditando({
                        id: a.id,
                        entrega: a.fecha_entrega,
                        retorno: a.fecha_retorno ?? "",
                      })
                    }
                  >
                    <Pencil className="size-4" />
                    Editar fechas
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fechas de la asignación</DialogTitle>
            <DialogDescription>Corrige la fecha de entrega o de devolución.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-entrega">Fecha de entrega</Label>
              <Input
                id="edit-entrega"
                type="date"
                value={editando?.entrega ?? ""}
                onChange={(e) => setEditando((prev) => (prev ? { ...prev, entrega: e.target.value } : prev))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-retorno">Fecha de devolución (opcional)</Label>
              <Input
                id="edit-retorno"
                type="date"
                value={editando?.retorno ?? ""}
                onChange={(e) => setEditando((prev) => (prev ? { ...prev, retorno: e.target.value } : prev))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => guardarFechas.mutate()} disabled={guardarFechas.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar equipo</DialogTitle>
            <DialogDescription>Solo se listan equipos con estado LIBRE.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Persona</Label>
              <PersonalSelect
                value={persona?.codigo ?? null}
                soloActivos
                onChange={(_, p) => setPersona(p)}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select value={equipoId} onValueChange={setEquipoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo libre…" />
                </SelectTrigger>
                <SelectContent>
                  {libres.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo_interno} · {[e.marca, e.modelo].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de entrega</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observaciones</Label>
              <Textarea
                id="obs"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => asignar.mutate()} disabled={asignar.isPending}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
