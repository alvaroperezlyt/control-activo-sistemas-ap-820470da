import { createFileRoute } from "@tanstack/react-router";

/** Puente: lista las hojas del libro de RRHH. */
export const Route = createFileRoute("/api/public/bridge/hojas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;
        try {
          const { listarHojasPersonal } = await import("@/lib/sheets.server");
          return Response.json({ success: true, ...(await listarHojasPersonal()) });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
