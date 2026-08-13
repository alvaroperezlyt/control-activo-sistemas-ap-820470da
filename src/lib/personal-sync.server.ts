/** Lógica compartida de sincronización del padrón de personal (manual y programada). */
import { leerPersonal } from "./sheets.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function sincronizarPersonalEnBase() {
  const personal = await leerPersonal();
  if (personal.length === 0) return { total: 0, desvinculados: 0 };

  // Una misma persona puede repetirse en la hoja: se conserva la última fila.
  const unicos = new Map(personal.map((p) => [p.codigo, p]));

  // Códigos ya existentes en la base, para detectar altas nuevas.
  const { data: existentes, error: errorExistentes } = await supabaseAdmin
    .from("personal")
    .select("codigo");
  if (errorExistentes) throw new Error(errorExistentes.message);
  const conocidos = new Set((existentes ?? []).map((p) => p.codigo));

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

  // Avisos por personal nuevo en estado ACTIVO (para prever la asignación de equipos).
  const nuevos = [...unicos.values()].filter((p) => p.estado === "ACTIVO" && !conocidos.has(p.codigo));
  if (nuevos.length > 0) {
    await supabaseAdmin.from("notificaciones").upsert(
      nuevos.map((p) => ({
        tipo: "NUEVO_PERSONAL",
        personal_codigo: p.codigo,
        personal_nombre: p.nombre,
        titulo: `Nuevo personal activo: ${p.nombre}${p.puesto ? ` · ${p.puesto}` : ""}`,
        mensaje: `${p.nombre} (${p.codigo})${p.puesto ? ` · ${p.puesto}` : ""} figura como ACTIVO en la lista de RRHH. Prevé la posible asignación de equipos informáticos.`,
      })),
      { onConflict: "tipo,personal_codigo", ignoreDuplicates: true },
    );
  }

  return {
    total: unicos.size,
    desvinculados: [...unicos.values()].filter((p) => p.estado === "DESVINCULADO").length,
    nuevos: nuevos.length,
  };
}
