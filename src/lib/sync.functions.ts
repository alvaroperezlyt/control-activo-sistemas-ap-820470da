import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Sincroniza la hoja "Personal" (lista oficial de RRHH) hacia la base del sistema. */
export const sincronizarPersonal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // El usuario ya quedó verificado por el middleware; la tabla "personal" es de solo
    // lectura para la app, así que la escritura de la sincronización usa el cliente del servidor.
    if (!context.userId) throw new Error("Sesión no válida.");
    const { sincronizarPersonalEnBase } = await import("./personal-sync.server");
    return await sincronizarPersonalEnBase();
  });

/** Publica equipos y líneas (asignados y libres) en el Google Sheets de activos. */
export const sincronizarActivos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Sesión no válida.");
    const { sincronizarActivosEnSheets } = await import("./activos-sync.server");
    return await sincronizarActivosEnSheets();
  });
