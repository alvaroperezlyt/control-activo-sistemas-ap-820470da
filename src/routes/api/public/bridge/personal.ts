import { createFileRoute } from "@tanstack/react-router";

/** Puente: lee la hoja "Personal" de RRHH con la conexión gestionada de Google Sheets. */
export const Route = createFileRoute("/api/public/bridge/personal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;
        try {
          const { leerPersonal } = await import("@/lib/sheets.server");
          const personal = await leerPersonal();
          return Response.json({ success: true, total: personal.length, personal });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          console.error("Puente personal falló:", error);
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
