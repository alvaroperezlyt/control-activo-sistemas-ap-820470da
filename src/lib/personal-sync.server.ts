/** Lógica compartida de sincronización del padrón de personal (manual y programada). */
import { leerPersonal } from "./sheets.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function sincronizarPersonalEnBase() {
  const personal = await leerPersonal();
  if (personal.length === 0) return { total: 0, desvinculados: 0 };

  // Una misma persona puede repetirse en la hoja: se conserva la última fila.
  const unicos = new Map(personal.map((p) => [p.codigo, p]));

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

  return {
    total: unicos.size,
    desvinculados: [...unicos.values()].filter((p) => p.estado === "DESVINCULADO").length,
  };
}
