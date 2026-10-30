import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  rango: z.string().trim().min(1).max(200).regex(/^('[^']{1,100}'|[^!']{1,100})(![A-Za-z0-9:$]{1,40})?$/),
});

/** Puente: lee un rango de cualquier hoja del libro de RRHH. */
export const Route = createFileRoute("/api/public/bridge/leer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;
        let rango: string;
        try {
          rango = Body.parse(await request.json()).rango;
        } catch {
          return Response.json({ success: false, error: 'Cuerpo inválido. Ej: {"rango":"Hoja!A1:Z1000"}' }, { status: 400 });
        }
        try {
          const { leerRangoPersonal } = await import("@/lib/sheets.server");
          const valores = await leerRangoPersonal(rango);
          return Response.json({ success: true, rango, total: valores.length, valores });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
