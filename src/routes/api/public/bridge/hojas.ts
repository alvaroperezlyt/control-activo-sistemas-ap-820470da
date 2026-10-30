import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  /** Libro a listar: "personal" (por defecto) o "activos". */
  libro: z.string().trim().max(30).optional(),
});

/** Puente: lista las hojas (pestañas) de un libro gestionado (personal o activos). */
export const Route = createFileRoute("/api/public/bridge/hojas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;
        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          parsed = {};
        }
        try {
          const { listarHojasPersonal, configLibro } = await import("@/lib/sheets.server");
          const res = await listarHojasPersonal(parsed.libro);
          return Response.json({ success: true, libro: configLibro(parsed.libro).libro, ...res, titulo: res.libro });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
