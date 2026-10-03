import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { sincronizarActivos } from "@/lib/sync.functions";
import { FORMULARIOS, formularioParaEquipo, type FormularioId } from "@/lib/checklists";
import { copiarTexto, textoRecepcion } from "@/lib/texto-rrhh";
import { PersonalSelect, type PersonaRow } from "@/components/PersonalSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Vigente = {
  id: string;
  equipo_id: string;
  equipos: {
    codigo_interno: string;
    tipo: string;
    marca: string | null;
    modelo: string | null;
    datos: unknown;
  } | null;
};

const OTRO = "__OTRO__";

export function RecepcionDialog({
  abierto,
  onOpenChange,
}: {
  abierto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [revisor, setRevisor] = useState("");
  const [persona, setPersona] = useState<PersonaRow | null>(null);
  const [asignacionId, setAsignacionId] = useState<string>("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [otros, setOtros] = useState<Record<string, string>>({});
  const [archivos, setArchivos] = useState<Record<string, File | null>>({});
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (abierto) return;
    setPersona(null);
    setAsignacionId("");
    setRespuestas({});
    setOtros({});
    setArchivos({});
    setObservaciones("");
  }, [abierto]);

  const { data: vigentes = [] } = useQuery({
    queryKey: ["asignaciones", "vigentes", persona?.codigo],
    enabled: Boolean(persona),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones")
        .select("id, equipo_id, equipos(codigo_interno, tipo, marca, modelo, datos)")
        .eq("personal_codigo", persona!.codigo)
        .is("fecha_retorno", null);
      if (error) throw error;
      return (data ?? []) as Vigente[];
    },
  });

  const seleccionada = useMemo(
    () => vigentes.find((v) => v.id === asignacionId) ?? null,
    [vigentes, asignacionId],
  );

  const formularioId: FormularioId | null = seleccionada
    ? formularioParaEquipo(
        seleccionada.equipos?.tipo,
        (seleccionada.equipos?.datos ?? null) as Record<string, string | null> | null,
      )
    : null;
  const formulario = formularioId ? FORMULARIOS[formularioId] : null;

  const syncActivos = useServerFn(sincronizarActivos);
  const registrar = useMutation({
    mutationFn: async () => {
      if (!revisor.trim()) throw new Error("Indica el nombre del revisor.");
      if (!persona) throw new Error("Selecciona el nombre del colaborador.");
      if (!seleccionada || !formulario) throw new Error("Selecciona el activo que se está recibiendo.");

      const faltante = formulario.preguntas.find((p) => !respuestas[p.key]);
      if (faltante) throw new Error(`Responde: ${faltante.label}`);

      const detalle: Record<string, string> = {};
      for (const p of formulario.preguntas) {
        const valor = respuestas[p.key]!;
        detalle[p.label] = valor === OTRO ? `Otro: ${(otros[p.key] ?? "").trim()}` : valor;
      }

      const carpeta = crypto.randomUUID();
      const fotos: { key: string; label: string; path: string }[] = [];
      for (const foto of formulario.fotos) {
        const file = archivos[foto.key];
        if (!file) continue;
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${carpeta}/${foto.key}.${ext}`;
        const { error: errUp } = await supabase.storage.from("recepciones").upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });
        if (errUp) throw errUp;
        fotos.push({ key: foto.key, label: foto.label, path });
      }

      const { data: recepcion, error } = await supabase
        .from("recepciones")
        .insert({
          tipo: seleccionada.equipos?.tipo ?? "OTRO",
          formulario: formulario.id,
          revisor: revisor.trim(),
          fecha,
          personal_codigo: persona.codigo,
          personal_nombre: persona.nombre,
          recibido_por: revisor.trim(),
          estado_fisico: respuestas["cuerpo"] ?? respuestas["estado_fisico"] ?? respuestas["cpu"] ?? null,
          observaciones: observaciones.trim() || null,
          respuestas: detalle,
          fotos,
          accesorios: [],
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: errAsig } = await supabase
        .from("asignaciones")
        .update({ fecha_retorno: fecha, recepcion_id: recepcion.id })
        .eq("id", seleccionada.id);
      if (errAsig) throw errAsig;

      const { error: errEquipo } = await supabase
        .from("equipos")
        .update({ estado_asignacion: "LIBRE", personal_codigo: null })
        .eq("id", seleccionada.equipo_id);
      if (errEquipo) throw errEquipo;
      return textoRecepcion(
        [
          {
            fecha,
            formulario: formulario.id,
            tipo: seleccionada.equipos?.tipo ?? "OTRO",
            revisor: revisor.trim(),
            personal_nombre: persona.nombre,
            personal_codigo: persona.codigo,
            observaciones: observaciones.trim() || null,
            respuestas: detalle,
            codigo_interno: seleccionada.equipos?.codigo_interno ?? null,
          },
        ],
        { CELULAR: "Celular", LINEA: "Línea corporativa", LAPTOP: "Laptop", ESCRITORIO: "Escritorio", GENERICO: "Equipo" },
      );
    },
    onSuccess: async (texto) => {
      queryClient.invalidateQueries();
      try {
        await copiarTexto(texto);
        toast.success("Recepción registrada · respuesta RRHH copiada");
      } catch {
        toast.success("Recepción registrada");
      }
      onOpenChange(false);
      syncActivos().catch((e: Error) => toast.error(`Sheets de activos: ${e.message}`));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{formulario ? formulario.titulo : "Nueva recepción"}</DialogTitle>
          <DialogDescription>
            {formulario
              ? formulario.descripcion
              : "Selecciona el colaborador y el activo devuelto; el formulario se ajusta al tipo registrado."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="revisor">Nombre del revisor *</Label>
              <Input id="revisor" value={revisor} onChange={(e) => setRevisor(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre del colaborador *</Label>
            <PersonalSelect
              value={persona?.codigo ?? null}
              onChange={(_, p) => {
                setPersona(p);
                setAsignacionId("");
                setRespuestas({});
                setOtros({});
                setArchivos({});
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Activo que se recibe *</Label>
            {!persona && <p className="text-sm text-muted-foreground">Selecciona un colaborador primero.</p>}
            {persona && vigentes.length === 0 && (
              <p className="text-sm text-muted-foreground">Este colaborador no tiene activos vigentes.</p>
            )}
            <RadioGroup
              value={asignacionId}
              onValueChange={(v) => {
                setAsignacionId(v);
                setRespuestas({});
                setOtros({});
                setArchivos({});
              }}
              className="space-y-2"
            >
              {vigentes.map((v) => {
                const fid = formularioParaEquipo(
                  v.equipos?.tipo,
                  (v.equipos?.datos ?? null) as Record<string, string | null> | null,
                );
                return (
                  <label
                    key={v.id}
                    className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"
                  >
                    <RadioGroupItem value={v.id} />
                    <span className="font-mono">{v.equipos?.codigo_interno}</span>
                    <span className="text-muted-foreground">
                      {[v.equipos?.marca, v.equipos?.modelo].filter(Boolean).join(" ")}
                    </span>
                    <span className="ml-auto rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {FORMULARIOS[fid].titulo.replace("Recepción de ", "")}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {formulario && seleccionada && (
            <>
              <div className="space-y-2">
                <Label>{formulario.codigoLabel}</Label>
                <Input value={seleccionada.equipos?.codigo_interno ?? ""} readOnly className="font-mono" />
              </div>

              {formulario.preguntas.map((p) => (
                <div key={p.key} className="space-y-2 rounded-md border border-border p-3">
                  <Label>{p.label} *</Label>
                  <RadioGroup
                    value={respuestas[p.key] ?? ""}
                    onValueChange={(v) => setRespuestas((r) => ({ ...r, [p.key]: v }))}
                    className="space-y-1"
                  >
                    {p.opciones.map((o) => (
                      <label key={o} className="flex items-start gap-2 text-sm">
                        <RadioGroupItem value={o} className="mt-0.5" />
                        <span>{o}</span>
                      </label>
                    ))}
                    {p.otro && (
                      <label className="flex items-start gap-2 text-sm">
                        <RadioGroupItem value={OTRO} className="mt-0.5" />
                        <span>Otro</span>
                      </label>
                    )}
                  </RadioGroup>
                  {respuestas[p.key] === OTRO && (
                    <Input
                      placeholder="Especifica…"
                      value={otros[p.key] ?? ""}
                      onChange={(e) => setOtros((o) => ({ ...o, [p.key]: e.target.value }))}
                      maxLength={300}
                    />
                  )}
                </div>
              ))}

              {formulario.fotos.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <Label>Fotografías</Label>
                    <p className="text-xs text-muted-foreground">
                      Cargue las fotografías en calidad estándar (puede configurar la cámara en 2 megapíxeles).
                    </p>
                  </div>
                  {formulario.fotos.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label htmlFor={`foto-${f.key}`} className="text-sm font-normal">
                        {f.label}
                      </Label>
                      <Input
                        id={`foto-${f.key}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setArchivos((a) => ({ ...a, [f.key]: e.target.files?.[0] ?? null }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea
                  id="obs"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  maxLength={1000}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => registrar.mutate()} disabled={registrar.isPending}>
            {registrar.isPending ? "Guardando…" : "Registrar recepción"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
