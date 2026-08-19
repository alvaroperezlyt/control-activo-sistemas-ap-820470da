/** Lógica compartida de sincronización del padrón de personal (manual y programada). */
import { leerPersonal } from "./sheets.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function sincronizarPersonalEnBase() {
  const personal = await leerPersonal();
  if (personal.length === 0) return { total: 0, desvinculados: 0 };

  // Una misma persona puede repetirse en la hoja: se conserva la última fila.
  const unicos = new Map(personal.map((p) => [p.codigo, p]));

  // Estado previo en la base, para detectar altas nuevas y reactivaciones.
  const { data: existentes, error: errorExistentes } = await supabaseAdmin
    .from("personal")
    .select("codigo, estado");
  if (errorExistentes) throw new Error(errorExistentes.message);
  const previos = new Map((existentes ?? []).map((p) => [p.codigo, p.estado]));

  const { error } = await supabaseAdmin.from("personal").upsert(
    [...unicos.values()].map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      puesto: p.puesto,
      estado: p.estado,
      synced_at: new Date().toISOString(),
    })),
    { onConflict: "codigo" },
  );
  if (error) throw new Error(error.message);

  // Avisos por personal que pasa a ACTIVO: altas nuevas y reingresos/reactivaciones.
  const activos = [...unicos.values()].filter((p) => p.estado === "ACTIVO");
  const nuevos = activos.filter((p) => !previos.has(p.codigo));
  const reactivados = activos.filter((p) => previos.get(p.codigo) === "DESVINCULADO");

  const avisos = [
    ...nuevos.map((p) => ({
      tipo: "NUEVO_PERSONAL",
      personal_codigo: p.codigo,
      personal_nombre: p.nombre,
      leida: false,
      titulo: `Nuevo personal activo: ${p.nombre}${p.puesto ? ` · ${p.puesto}` : ""}`,
      mensaje: `${p.nombre} (${p.codigo})${p.puesto ? ` · ${p.puesto}` : ""} figura como ACTIVO en la lista de RRHH. Prevé la posible asignación de equipos informáticos.`,
      updated_at: new Date().toISOString(),
    })),
    ...reactivados.map((p) => ({
      tipo: "NUEVO_PERSONAL",
      personal_codigo: p.codigo,
      personal_nombre: p.nombre,
      leida: false,
      titulo: `Personal reincorporado: ${p.nombre}${p.puesto ? ` · ${p.puesto}` : ""}`,
      mensaje: `${p.nombre} (${p.codigo})${p.puesto ? ` · ${p.puesto}` : ""} volvió a figurar como ACTIVO en la lista de RRHH (antes estaba DESVINCULADO). Prevé la posible asignación de equipos informáticos.`,
      updated_at: new Date().toISOString(),
    })),
  ];

  if (avisos.length > 0) {
    const { error: errorAvisos } = await supabaseAdmin
      .from("notificaciones")
      .upsert(avisos, { onConflict: "tipo,personal_codigo" });
    if (errorAvisos) throw new Error(errorAvisos.message);
  }

  // Quien vuelve a estar ACTIVO ya no debe conservar el aviso de desvinculación.
  if (reactivados.length > 0) {
    await supabaseAdmin
      .from("notificaciones")
      .delete()
      .eq("tipo", "DESVINCULACION")
      .in("personal_codigo", reactivados.map((p) => p.codigo));
  }


  return {
    total: unicos.size,
    desvinculados: [...unicos.values()].filter((p) => p.estado === "DESVINCULADO").length,
    nuevos: nuevos.length,
    reactivados: reactivados.length,
  };
}
