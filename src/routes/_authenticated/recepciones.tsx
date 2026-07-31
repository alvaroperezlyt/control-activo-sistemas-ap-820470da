import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatearFecha } from "@/lib/tipos";
import { PageHeader } from "@/components/PageHeader";
import { PersonalSelect, type PersonaRow } from "@/components/PersonalSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACCESORIOS = [
  "Cargador",
  "Mochila / Maletín",
  "Mouse",
  "Teclado",
  "Base / Dock",
  "Cable de red",
  "Audífonos",
  "Chip / SIM",
  "Caja original",
];

const ESTADOS_FISICOS = ["BUENO", "REGULAR", "MALO", "CON DAÑOS", "NO ENCIENDE"];

export const Route = createFileRoute("/_authenticated/recepciones")({
  head: () => ({
    meta: [
      { title: "Recepciones | Activos TI" },
      { name: "description", content: "Formularios de recepción y devolución de equipos entregados al personal." },
      { property: "og:title", content: "Recepciones | Activos TI" },
      { property: "og:description", content: "Registra devoluciones con accesorios y estado físico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recepciones,
});

function Recepciones() {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [persona, setPersona] = useState<PersonaRow | null>(null);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [accesorios, setAccesorios] = useState<string[]>([]);
  const [estadoFisico, setEstadoFisico] = useState("BUENO");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [recibidoPor, setRecibidoPor] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { data: vigentes = [] } = useQuery({
    queryKey: ["asignaciones", "vigentes", persona?.codigo],
    enabled: Boolean(persona),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones")
        .select("id, equipo_id, equipos(codigo_interno, tipo, marca, modelo)")
        .eq("personal_codigo", persona!.codigo)
        .is("fecha_retorno", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: recepciones = [] } = useQuery({
    queryKey: ["recepciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recepciones")
        .select("id, fecha, tipo, personal_nombre, estado_fisico, recibido_por, observaciones, accesorios")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const registrar = useMutation({
    mutationFn: async () => {
      if (!persona) throw new Error("Selecciona la persona que devuelve el equipo.");
      if (seleccion.length === 0) throw new Error("Selecciona al menos un equipo a recibir.");

      const tipos = [
        ...new Set(
          vigentes
            .filter((v) => seleccion.includes(v.id))
            .map((v) => v.equipos?.tipo ?? "OTRO"),
        ),
      ];

      const { data: recepcion, error } = await supabase
        .from("recepciones")
        .insert({
          tipo: tipos.length === 1 ? tipos[0]! : "MIXTA",
          fecha,
          personal_codigo: persona.codigo,
          personal_nombre: persona.nombre,
          estado_fisico: estadoFisico,
          recibido_por: recibidoPor.trim() || null,
          observaciones: observaciones.trim() || null,
          accesorios,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: errAsig } = await supabase
        .from("asignaciones")
        .update({ fecha_retorno: fecha, recepcion_id: recepcion.id })
        .in("id", seleccion);
      if (errAsig) throw errAsig;

      const equipoIds = vigentes.filter((v) => seleccion.includes(v.id)).map((v) => v.equipo_id);
      const { error: errEquipos } = await supabase
        .from("equipos")
        .update({ estado_asignacion: "LIBRE", personal_codigo: null })
        .in("id", equipoIds);
      if (errEquipos) throw errEquipos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Recepción registrada");
      setAbierto(false);
      setPersona(null);
      setSeleccion([]);
      setAccesorios([]);
      setObservaciones("");
      setRecibidoPor("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        titulo="Recepciones"
        descripcion="Formulario de devolución: libera el equipo y cierra la asignación vigente."
      >
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" />
          Nueva recepción
        </Button>
      </PageHeader>

      <div className="panel overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-medium text-muted-foreground">Fecha</th>
              <th className="pb-2 font-medium text-muted-foreground">Persona</th>
              <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
              <th className="pb-2 font-medium text-muted-foreground">Estado físico</th>
              <th className="pb-2 font-medium text-muted-foreground">Accesorios</th>
              <th className="pb-2 font-medium text-muted-foreground">Recibido por</th>
            </tr>
          </thead>
          <tbody>
            {recepciones.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-muted-foreground">
                  Sin recepciones registradas.
                </td>
              </tr>
            )}
            {recepciones.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="py-2">{formatearFecha(r.fecha)}</td>
                <td className="py-2">{r.personal_nombre ?? "—"}</td>
                <td className="py-2">{r.tipo}</td>
                <td className="py-2">{r.estado_fisico ?? "—"}</td>
                <td className="py-2 text-muted-foreground">
                  {Array.isArray(r.accesorios) && r.accesorios.length > 0
                    ? (r.accesorios as string[]).join(", ")
                    : "—"}
                </td>
                <td className="py-2">{r.recibido_por ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Formulario de recepción</DialogTitle>
            <DialogDescription>
              Marca los equipos devueltos y los accesorios que llegaron con ellos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Persona que devuelve</Label>
              <PersonalSelect
                value={persona?.codigo ?? null}
                onChange={(_, p) => {
                  setPersona(p);
                  setSeleccion([]);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Equipos asignados</Label>
              {!persona && <p className="text-sm text-muted-foreground">Selecciona una persona primero.</p>}
              {persona && vigentes.length === 0 && (
                <p className="text-sm text-muted-foreground">Esta persona no tiene equipos vigentes.</p>
              )}
              <div className="space-y-2">
                {vigentes.map((v) => (
                  <label key={v.id} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                    <Checkbox
                      checked={seleccion.includes(v.id)}
                      onCheckedChange={(c) =>
                        setSeleccion((s) => (c ? [...s, v.id] : s.filter((x) => x !== v.id)))
                      }
                    />
                    <span className="font-mono">{v.equipos?.codigo_interno}</span>
                    <span className="text-muted-foreground">
                      {[v.equipos?.marca, v.equipos?.modelo].filter(Boolean).join(" ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accesorios recibidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESORIOS.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={accesorios.includes(a)}
                      onCheckedChange={(c) =>
                        setAccesorios((s) => (c ? [...s, a] : s.filter((x) => x !== a)))
                      }
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estado físico</Label>
                <Select value={estadoFisico} onValueChange={setEstadoFisico}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_FISICOS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recibido">Recibido por</Label>
              <Input
                id="recibido"
                value={recibidoPor}
                onChange={(e) => setRecibidoPor(e.target.value)}
                maxLength={120}
              />
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
            <Button onClick={() => registrar.mutate()} disabled={registrar.isPending}>
              Registrar recepción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
