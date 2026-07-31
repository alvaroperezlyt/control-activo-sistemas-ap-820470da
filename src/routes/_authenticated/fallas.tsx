import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatearFecha } from "@/lib/tipos";
import { PageHeader, EstadoBadge } from "@/components/PageHeader";
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

const ESTADOS_FALLA = ["PENDIENTE", "EN REPARACION", "REPARADO", "SIN SOLUCION"];

export const Route = createFileRoute("/_authenticated/fallas")({
  head: () => ({
    meta: [
      { title: "Fallas y reparaciones | Activos TI" },
      {
        name: "description",
        content: "Registro de fallas de equipos y sus reparaciones con proveedor, costo y factura.",
      },
      { property: "og:title", content: "Fallas y reparaciones | Activos TI" },
      { property: "og:description", content: "Controla fallas, proveedores, costos y facturas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fallas,
});

function Fallas() {
  const queryClient = useQueryClient();
  const [nuevaFalla, setNuevaFalla] = useState(false);
  const [fallaReparar, setFallaReparar] = useState<string | null>(null);

  const [equipoId, setEquipoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [reportadoPor, setReportadoPor] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  const [repDescripcion, setRepDescripcion] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [costo, setCosto] = useState("");
  const [factura, setFactura] = useState("");
  const [repFecha, setRepFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [nuevoEstado, setNuevoEstado] = useState("REPARADO");

  const { data: equipos = [] } = useQuery({
    queryKey: ["equipos", "selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select("id, codigo_interno, marca, modelo")
        .order("codigo_interno");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fallas = [] } = useQuery({
    queryKey: ["fallas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fallas")
        .select(
          "id, fecha, descripcion, estado, reportado_por, equipos(id, codigo_interno), reparaciones(id, fecha, descripcion, proveedor, costo, factura)",
        )
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const crearFalla = useMutation({
    mutationFn: async () => {
      if (!equipoId) throw new Error("Selecciona el equipo.");
      if (!descripcion.trim()) throw new Error("Describe la falla.");
      const { error } = await supabase.from("fallas").insert({
        equipo_id: equipoId,
        descripcion: descripcion.trim(),
        reportado_por: reportadoPor.trim() || "—",
        fecha,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fallas"] });
      toast.success("Falla registrada");
      setNuevaFalla(false);
      setDescripcion("");
      setEquipoId("");
      setReportadoPor("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const crearReparacion = useMutation({
    mutationFn: async () => {
      if (!fallaReparar) throw new Error("Falla no seleccionada.");
      if (!repDescripcion.trim()) throw new Error("Describe la reparación.");
      const { error } = await supabase.from("reparaciones").insert({
        falla_id: fallaReparar,
        descripcion: repDescripcion.trim(),
        proveedor: proveedor.trim() || null,
        costo: costo === "" ? null : Number(costo),
        factura: factura.trim() || null,
        fecha: repFecha,
      });
      if (error) throw error;
      const { error: errFalla } = await supabase
        .from("fallas")
        .update({ estado: nuevoEstado })
        .eq("id", fallaReparar);
      if (errFalla) throw errFalla;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fallas"] });
      toast.success("Reparación registrada");
      setFallaReparar(null);
      setRepDescripcion("");
      setProveedor("");
      setCosto("");
      setFactura("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader titulo="Fallas y reparaciones" descripcion="Historial técnico de cada activo.">
        <Button onClick={() => setNuevaFalla(true)}>
          <Plus className="size-4" />
          Registrar falla
        </Button>
      </PageHeader>

      <div className="space-y-4">
        {fallas.length === 0 && <p className="text-sm text-muted-foreground">Sin fallas registradas.</p>}
        {fallas.map((f) => (
          <div key={f.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label-mono">
                  {formatearFecha(f.fecha)} ·{" "}
                  {f.equipos ? (
                    <Link to="/equipos/$id" params={{ id: f.equipos.id }} className="hover:underline">
                      {f.equipos.codigo_interno}
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="mt-1 font-medium">{f.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">Reportado por {f.reportado_por}</p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoBadge estado={f.estado} />
                <Button variant="outline" size="sm" onClick={() => setFallaReparar(f.id)}>
                  <Wrench className="size-4" />
                  Reparación
                </Button>
              </div>
            </div>

            {f.reparaciones.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                {f.reparaciones.map((r) => (
                  <li key={r.id} className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-mono text-muted-foreground">{formatearFecha(r.fecha)}</span>
                    <span className="flex-1">{r.descripcion}</span>
                    <span className="text-muted-foreground">{r.proveedor ?? "sin proveedor"}</span>
                    <span className="font-mono">{r.costo != null ? `Bs ${r.costo}` : "—"}</span>
                    <span className="text-muted-foreground">{r.factura ? `Fact. ${r.factura}` : "sin factura"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <Dialog open={nuevaFalla} onOpenChange={setNuevaFalla}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar falla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select value={equipoId} onValueChange={setEquipoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo…" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo_interno} · {[e.marca, e.modelo].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descripción de la falla</Label>
              <Textarea
                id="desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rep">Reportado por</Label>
                <Input id="rep" value={reportadoPor} onChange={(e) => setReportadoPor(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ffecha">Fecha</Label>
                <Input id="ffecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevaFalla(false)}>
              Cancelar
            </Button>
            <Button onClick={() => crearFalla.mutate()} disabled={crearFalla.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fallaReparar !== null} onOpenChange={(v) => !v && setFallaReparar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar reparación</DialogTitle>
            <DialogDescription>Datos del proveedor, costo y factura de la intervención.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rdesc">Trabajo realizado</Label>
              <Textarea
                id="rdesc"
                value={repDescripcion}
                onChange={(e) => setRepDescripcion(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prov">Proveedor</Label>
                <Input id="prov" value={proveedor} onChange={(e) => setProveedor(e.target.value)} maxLength={160} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo">Costo</Label>
                <Input id="costo" type="number" min="0" value={costo} onChange={(e) => setCosto(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fact">N.º de factura</Label>
                <Input id="fact" value={factura} onChange={(e) => setFactura(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfecha">Fecha</Label>
                <Input id="rfecha" type="date" value={repFecha} onChange={(e) => setRepFecha(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nuevo estado de la falla</Label>
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_FALLA.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFallaReparar(null)}>
              Cancelar
            </Button>
            <Button onClick={() => crearReparacion.mutate()} disabled={crearReparacion.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
