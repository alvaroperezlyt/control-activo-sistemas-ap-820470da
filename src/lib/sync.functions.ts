import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Sincroniza la hoja "Personal" (lista oficial de RRHH) hacia la base del sistema. */
export const sincronizarPersonal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { leerPersonal } = await import("./sheets.server");
    const personal = await leerPersonal();
    if (personal.length === 0) return { total: 0, desvinculados: 0 };

    const { error } = await context.supabase.from("personal").upsert(
      personal.map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        puesto: p.puesto,
        estado: p.estado,
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "codigo" },
    );
    if (error) throw new Error(error.message);

    return {
      total: personal.length,
      desvinculados: personal.filter((p) => p.estado === "DESVINCULADO").length,
    };
  });

/** Importa el relevamiento de Computadoras, Teléfonos y Líneas del Google Sheets. */
export const importarEquiposDesdeSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { leerComputadoras, leerTelefonos, leerLineas } = await import("./sheets.server");
    const [computadoras, telefonos, lineas] = await Promise.all([
      leerComputadoras(),
      leerTelefonos(),
      leerLineas(),
    ]);
    const equipos = [...computadoras, ...telefonos, ...lineas];

    const { data: personal, error: errPersonal } = await context.supabase
      .from("personal")
      .select("codigo, nombre");
    if (errPersonal) throw new Error(errPersonal.message);

    const porNombre = new Map<string, string>();
    for (const p of personal ?? []) porNombre.set(p.nombre, p.codigo);

    const sinPersona: string[] = [];
    const filas = equipos.map((e) => {
      const codigoPersona = e.asignado_nombre ? porNombre.get(e.asignado_nombre) ?? null : null;
      if (e.asignado_nombre && !codigoPersona) sinPersona.push(e.asignado_nombre);
      const asignado = Boolean(codigoPersona);
      const dadoDeBaja = ["BAJA", "DADO DE BAJA", "DESECHADO"].includes(e.estado_hoja);
      return {
        tipo: e.tipo,
        codigo_interno: e.codigo_interno,
        estado_asignacion: dadoDeBaja ? "BAJA" : asignado ? "ASIGNADO" : "LIBRE",
        personal_codigo: codigoPersona,
        lugar: e.lugar,
        marca: e.marca,
        modelo: e.modelo,
        serie: e.serie,
        fecha_compra: e.fecha_compra,
        costo: e.costo,
        color: e.color,
        observaciones: e.observaciones,
        datos: e.datos,
      };
    });

    const { data: guardados, error } = await context.supabase
      .from("equipos")
      .upsert(filas, { onConflict: "codigo_interno" })
      .select("id, codigo_interno, personal_codigo, estado_asignacion");
    if (error) throw new Error(error.message);

    // Abre la asignación vigente de cada equipo asignado que aún no tenga historial abierto.
    const asignados = (guardados ?? []).filter(
      (g) => g.estado_asignacion === "ASIGNADO" && g.personal_codigo,
    );
    if (asignados.length > 0) {
      const { data: abiertas } = await context.supabase
        .from("asignaciones")
        .select("equipo_id")
        .is("fecha_retorno", null);
      const conHistorial = new Set((abiertas ?? []).map((a) => a.equipo_id));
      const nuevas = asignados
        .filter((g) => !conHistorial.has(g.id))
        .map((g) => ({
          equipo_id: g.id,
          personal_codigo: g.personal_codigo,
          personal_nombre:
            (personal ?? []).find((p) => p.codigo === g.personal_codigo)?.nombre ?? "—",
          observaciones: "Asignación registrada desde el relevamiento de Google Sheets",
        }));
      if (nuevas.length > 0) {
        const { error: errAsig } = await context.supabase.from("asignaciones").insert(nuevas);
        if (errAsig) throw new Error(errAsig.message);
      }
    }

    return {
      total: filas.length,
      computadoras: computadoras.length,
      telefonos: telefonos.length,
      lineas: lineas.length,
      sinCoincidencia: [...new Set(sinPersona)].slice(0, 25),
    };
  });
