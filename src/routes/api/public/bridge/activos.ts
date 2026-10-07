import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const celda = z.string().max(5000);
const esquema = z.object({
  equipos: z.array(z.array(celda).max(10)).max(10000),
  lineas: z.array(z.array(celda).max(4)).max(10000),
});

/** Puente: escribe las filas ya preparadas en las hojas "equipos" y "lineas" del Sheets de activos. */
export const Route = createFileRoute("/api/public/bridge/activos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;

        let cuerpo: unknown;
        try {
          cuerpo = await request.json();
        } catch {
          return Response.json({ success: false, error: "JSON inválido" }, { status: 400 });
        }
        const r = esquema.safeParse(cuerpo);
        if (!r.success) {
          return Response.json({ success: false, error: r.error.issues }, { status: 400 });
        }
        try {
          const { escribirActivosEnSheets } = await import("@/lib/activos-sync.server");
          const res = await escribirActivosEnSheets(r.data.equipos, r.data.lineas);
          return Response.json({ success: true, ...res });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          console.error("Puente activos falló:", error);
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
