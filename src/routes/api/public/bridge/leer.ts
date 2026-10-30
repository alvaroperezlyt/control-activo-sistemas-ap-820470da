import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  rango: z.string().trim().min(1).max(200).regex(/^('[^']{1,100}'|[^!']{1,100})(![A-Za-z0-9:$]{1,40})?$/),
  /** Libro a leer: "personal" (por defecto) o "activos". */
  libro: z.string().trim().max(30).optional(),
});

/** Puente: lee un rango de cualquier hoja de un libro gestionado (personal o activos). */
export const Route = createFileRoute("/api/public/bridge/leer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return Response.json(
            { success: false, error: 'Cuerpo inválido. Ej: {"rango":"Hoja!A1:Z1000","libro":"personal"}' },
            { status: 400 },
          );
        }
        try {
          const { leerRangoPersonal, configLibro } = await import("@/lib/sheets.server");
          const valores = await leerRangoPersonal(parsed.rango, parsed.libro);
          const cfg = configLibro(parsed.libro);
          return Response.json({ success: true, libro: cfg.libro, rango: parsed.rango, total: valores.length, valores });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
