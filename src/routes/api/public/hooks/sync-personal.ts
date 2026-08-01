import { createFileRoute } from "@tanstack/react-router";

/** Endpoint programado (cada 4 horas) que sincroniza el padrón de personal de RRHH. */
export const Route = createFileRoute("/api/public/hooks/sync-personal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        if (!apikey || apikey !== process.env["SUPABASE_ANON_KEY"]) {
          return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { sincronizarPersonalEnBase } = await import("@/lib/personal-sync.server");
          const resultado = await sincronizarPersonalEnBase();
          return new Response(JSON.stringify({ success: true, ...resultado }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          const mensaje = e instanceof Error ? e.message : "Error desconocido";
          console.error("Sincronización programada falló:", mensaje);
          return new Response(JSON.stringify({ success: false, error: mensaje }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
