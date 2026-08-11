import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS, TIPOS_LISTA, type TipoEquipo, ESTADOS_ASIGNACION } from "@/lib/tipos";
import { PageHeader, EstadoBadge } from "@/components/PageHeader";
import { EquipoDialog, type EquipoRow } from "@/components/EquipoDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Busqueda = { tipo?: TipoEquipo; almacen?: string };

export const Route = createFileRoute("/_authenticated/equipos/")({
  validateSearch: (search: Record<string, unknown>): Busqueda => {
    const tipo = search["tipo"];
    const almacen = search["almacen"];
    const out: Busqueda = {};
    if (typeof tipo === "string" && TIPOS_LISTA.includes(tipo as TipoEquipo)) out.tipo = tipo as TipoEquipo;
    if (typeof almacen === "string" && almacen) out.almacen = almacen;
    return out;
  },

  head: () => ({
    meta: [
      { title: "Equipos | Activos TI" },
      {
        name: "description",
        content: "Inventario de computadoras, teléfonos, impresoras, líneas y dispositivos de red.",
      },
      { property: "og:title", content: "Equipos | Activos TI" },
      { property: "og:description", content: "Inventario completo de activos informáticos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Equipos,
});

function Equipos() {
  const { tipo: tipoFiltro, almacen: almacenFiltro } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<string>("TODOS");
  const [nuevoTipo, setNuevoTipo] = useState<TipoEquipo>(tipoFiltro ?? "COMPUTADORA");
  const [dialogo, setDialogo] = useState(false);
  const [editar, setEditar] = useState<EquipoRow | null>(null);

  const { data: equipos = [], isLoading } = useQuery({
    queryKey: ["equipos", "detalle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select(
          "id, tipo, codigo_interno, estado_asignacion, personal_codigo, almacen_id, lugar, marca, modelo, serie, fecha_compra, costo, color, observaciones, datos, personal(nombre), almacenes(nombre)",
        )
        .order("codigo_interno");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sucursales = [] } = useQuery({
    queryKey: ["sucursales", "lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("almacenes").select("id, nombre, lugar").order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const esLineas = tipoFiltro === "LINEA";

  const corto = (e: { datos?: unknown }) => {
    const d = (e.datos ?? {}) as Record<string, string | null>;
    return d["corto"] ?? "";
  };

  const filtrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    const lista = equipos.filter((e) => {
      if (tipoFiltro && e.tipo !== tipoFiltro) return false;
      if (almacenFiltro && e.almacen_id !== almacenFiltro) return false;
      if (estado !== "TODOS" && e.estado_asignacion !== estado) return false;
      if (!q) return true;
      return [e.codigo_interno, e.marca, e.modelo, e.serie, e.personal?.nombre, e.lugar, corto(e)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    if (!esLineas) return lista;
    return [...lista].sort((a, b) => {
      const na = Number(String(corto(a)).replace(/\D/g, ""));
      const nb = Number(String(corto(b)).replace(/\D/g, ""));
      const va = Number.isFinite(na) && String(corto(a)).trim() ? na : Number.POSITIVE_INFINITY;
      const vb = Number.isFinite(nb) && String(corto(b)).trim() ? nb : Number.POSITIVE_INFINITY;
      if (va !== vb) return va - vb;
      return String(a.codigo_interno).localeCompare(String(b.codigo_interno));
    });
  }, [equipos, texto, estado, tipoFiltro, almacenFiltro, esLineas]);


  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader titulo="Equipos" descripcion="Registro de nuevos ingresos y control del inventario.">
        <Select value={nuevoTipo} onValueChange={(v) => setNuevoTipo(v as TipoEquipo)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_LISTA.map((t) => (
              <SelectItem key={t} value={t}>
                {TIPOS[t].labelSingular}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditar(null);
            setDialogo(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo ingreso
        </Button>
      </PageHeader>

      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar código, marca, serie o persona…"
              className="pl-9"
            />
          </div>
          <Select
            value={tipoFiltro ?? "TODOS"}
            onValueChange={(v) =>
              navigate({
                search: (prev: Busqueda) => ({ ...prev, tipo: v === "TODOS" ? undefined : (v as TipoEquipo) }),
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              {TIPOS_LISTA.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIPOS[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={almacenFiltro ?? "TODOS"}
            onValueChange={(v) =>
              navigate({ search: (prev: Busqueda) => ({ ...prev, almacen: v === "TODOS" ? undefined : v }) })
            }
          >
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas las Sucursales/Líneas de Negocio</SelectItem>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre} ({s.lugar})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {ESTADOS_ASIGNACION.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">Código</th>
                <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
                <th className="pb-2 font-medium text-muted-foreground">Marca / Modelo</th>
                <th className="pb-2 font-medium text-muted-foreground">Asignado a</th>
                <th className="pb-2 font-medium text-muted-foreground">Sucursal/Línea de Negocio</th>
                <th className="pb-2 font-medium text-muted-foreground">Estado</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-6 text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading && filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-muted-foreground">
                    Sin equipos que coincidan con el filtro.
                  </td>
                </tr>
              )}
              {filtrados.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 font-mono">
                    <Link to="/equipos/$id" params={{ id: e.id }} className="hover:underline">
                      {e.codigo_interno}
                    </Link>
                  </td>
                  <td className="py-2">{TIPOS[e.tipo as TipoEquipo]?.labelSingular ?? e.tipo}</td>
                  <td className="py-2">{[e.marca, e.modelo].filter(Boolean).join(" ") || "—"}</td>
                  <td className="py-2">{e.personal?.nombre ?? "—"}</td>
                  <td className="py-2">{e.almacenes?.nombre ?? "—"}</td>
                  <td className="py-2">
                    <EstadoBadge estado={e.estado_asignacion} />
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditar({
                          ...e,
                          tipo: e.tipo as TipoEquipo,
                          datos: (e.datos ?? {}) as Record<string, string | null>,
                        });
                        setNuevoTipo(e.tipo as TipoEquipo);
                        setDialogo(true);
                      }}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{filtrados.length} equipos listados</p>
      </div>

      <EquipoDialog
        tipo={editar ? editar.tipo : nuevoTipo}
        equipo={editar}
        abierto={dialogo}
        onOpenChange={(v) => {
          setDialogo(v);
          if (!v) setEditar(null);
        }}
      />
    </div>
  );
}
