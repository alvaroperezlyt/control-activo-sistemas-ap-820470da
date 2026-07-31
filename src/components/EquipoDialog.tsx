import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { TIPOS, type TipoEquipo } from "@/lib/tipos";
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

export type EquipoRow = {
  id: string;
  tipo: TipoEquipo;
  codigo_interno: string;
  estado_asignacion: string;
  personal_codigo: string | null;
  almacen_id: string | null;
  lugar: string | null;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fecha_compra: string | null;
  costo: number | null;
  color: string | null;
  observaciones: string | null;
  datos: Record<string, string | null> | null;
};

const camposColumna = new Set([
  "lugar",
  "marca",
  "modelo",
  "serie",
  "fecha_compra",
  "costo",
  "color",
]);

export function EquipoDialog({
  tipo,
  equipo,
  abierto,
  onOpenChange,
}: {
  tipo: TipoEquipo;
  equipo?: EquipoRow | null;
  abierto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const config = TIPOS[tipo];
  const queryClient = useQueryClient();
  const [codigo, setCodigo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [almacenId, setAlmacenId] = useState<string>("");
  const [valores, setValores] = useState<Record<string, string>>({});

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("almacenes").select("id, nombre, lugar").order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!abierto) return;
    setCodigo(equipo?.codigo_interno ?? "");
    setObservaciones(equipo?.observaciones ?? "");
    setAlmacenId(equipo?.almacen_id ?? "");
    const iniciales: Record<string, string> = {};
    for (const campo of config.campos) {
      const valor = campo.base
        ? ((equipo?.[campo.key as keyof EquipoRow] as string | number | null) ?? "")
        : (equipo?.datos?.[campo.key] ?? "");
      iniciales[campo.key] = valor === null ? "" : String(valor);
    }
    setValores(iniciales);
  }, [abierto, equipo, config]);

  const guardar = useMutation({
    mutationFn: async () => {
      const fila: Record<string, unknown> & { tipo: TipoEquipo } = {
        tipo,
        codigo_interno: codigo.trim().toUpperCase(),
        observaciones: observaciones.trim() || null,
        almacen_id: almacenId || null,
        datos: {},
      };
      const datos: Record<string, string | null> = {};
      for (const campo of config.campos) {
        const valor = (valores[campo.key] ?? "").trim();
        if (campo.base && camposColumna.has(campo.key)) {
          fila[campo.key] = valor === "" ? null : campo.tipo === "number" ? Number(valor) : valor;
        } else {
          datos[campo.key] = valor === "" ? null : valor;
        }
      }
      fila["datos"] = datos;

      if (equipo) {
        const { error } = await supabase
          .from("equipos")
          .update(fila as Database["public"]["Tables"]["equipos"]["Update"])
          .eq("id", equipo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("equipos")
          .insert(fila as Database["public"]["Tables"]["equipos"]["Insert"]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast.success(equipo ? "Equipo actualizado" : "Equipo registrado");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {equipo ? "Editar" : "Nuevo ingreso"} · {config.labelSingular}
          </DialogTitle>
          <DialogDescription>
            Completa los datos del equipo. Los campos vacíos quedan sin registrar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="codigo">{config.codigoLabel}</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder={tipo === "LINEA" ? "77775795" : "AP1-00301"}
              maxLength={60}
            />
          </div>

          {config.campos.map((campo) => (
            <div
              key={campo.key}
              className={`space-y-2 ${campo.ancho === "full" || campo.tipo === "textarea" ? "sm:col-span-2" : ""}`}
            >
              <Label htmlFor={campo.key}>{campo.label}</Label>
              {campo.tipo === "textarea" ? (
                <Textarea
                  id={campo.key}
                  value={valores[campo.key] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [campo.key]: e.target.value }))}
                  maxLength={1000}
                />
              ) : campo.tipo === "select" ? (
                <Select
                  value={valores[campo.key] ?? ""}
                  onValueChange={(v) => setValores((prev) => ({ ...prev, [campo.key]: v }))}
                >
                  <SelectTrigger id={campo.key}>
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campo.opciones ?? []).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={campo.key}
                  type={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"}
                  value={valores[campo.key] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [campo.key]: e.target.value }))}
                  maxLength={200}
                />
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="almacen">Almacén</Label>
            <Select value={almacenId} onValueChange={setAlmacenId}>
              <SelectTrigger id="almacen">
                <SelectValue placeholder="Sin almacén" />
              </SelectTrigger>
              <SelectContent>
                {almacenes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre} — {a.lugar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!codigo.trim()) {
                toast.error(`${config.codigoLabel} es obligatorio.`);
                return;
              }
              guardar.mutate();
            }}
            disabled={guardar.isPending}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
