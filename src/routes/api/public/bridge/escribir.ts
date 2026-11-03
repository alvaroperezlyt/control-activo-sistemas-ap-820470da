import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
/** Hojas oficiales que el puente genérico no puede modificar. */
const PROTEGIDAS = ["personal", "equipos", "lineas"];

const Body = z.object({
  libro: z.literal("activos"),
  rango: z.string().trim().min(1).max(200).regex(/^('[^']{1,100}'|[^!']{1,100})(![A-Za-z0-9:$]{1,40})?$/),
  modo: z.enum(["reemplazar", "agregar"]).default("reemplazar"),
  valores: z.array(z.array(z.union([z.string().max(5000), z.number(), z.boolean(), z.null()])).max(100)).max(10000),
});

function nombreHoja(rango: string) {
  const hoja = rango.split("!")[0];
  return hoja.replace(/^'|'$/g, "").trim().toLowerCase();
}

/** Puente: escribe filas en cualquier hoja no protegida del libro de activos. */
export const Route = createFileRoute("/api/public/bridge/escribir")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verificarPuente } = await import("@/lib/bridge-auth.server");
        const denegado = verificarPuente(request);
        if (denegado) return denegado;

        let p;
        try {
          p = Body.parse(await request.json());
        } catch (e) {
          const detalle = e instanceof z.ZodError ? e.issues : "JSON inválido";
          return Response.json({ success: false, error: detalle }, { status: 400 });
        }
        if (PROTEGIDAS.includes(nombreHoja(p.rango))) {
          return Response.json({ success: false, error: "Hoja protegida: no se puede escribir en ella" }, { status: 403 });
        }

        const lovableKey = process.env["LOVABLE_API_KEY"];
        const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
        if (!lovableKey || !sheetsKey) {
          return Response.json({ success: false, error: "Conexión con Google Sheets no configurada" }, { status: 503 });
        }
        const { idHoja, configLibro } = await import("@/lib/sheets.server");
        const cfg = configLibro("activos");
        const id = await idHoja(cfg.clave, cfg.defecto);
        const rangoUrl = encodeURI(p.rango).replace(/%3A/gi, ":");
        const headers = {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": sheetsKey,
          "Content-Type": "application/json",
        };
        const valores = p.valores.map((f) => f.map((c) => (c === null ? "" : c)));

        try {
          if (p.modo === "reemplazar") {
            const c = await fetch(`${GATEWAY}/spreadsheets/${id}/values/${rangoUrl}:clear`, { method: "POST", headers });
            if (!c.ok) throw new Error(`Google Sheets [${c.status}]: ${await c.text()}`);
            if (valores.length === 0) return Response.json({ success: true, modo: p.modo, rango: p.rango, filas: 0 });
            const u = await fetch(`${GATEWAY}/spreadsheets/${id}/values/${rangoUrl}?valueInputOption=RAW`, {
              method: "PUT",
              headers,
              body: JSON.stringify({ values: valores }),
            });
            if (!u.ok) throw new Error(`Google Sheets [${u.status}]: ${await u.text()}`);
          } else {
            if (valores.length === 0) return Response.json({ success: true, modo: p.modo, rango: p.rango, filas: 0 });
            const a = await fetch(
              `${GATEWAY}/spreadsheets/${id}/values/${rangoUrl}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
              { method: "POST", headers, body: JSON.stringify({ values: valores }) },
            );
            if (!a.ok) throw new Error(`Google Sheets [${a.status}]: ${await a.text()}`);
          }
          return Response.json({ success: true, modo: p.modo, rango: p.rango, filas: valores.length });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Error desconocido";
          console.error("Puente escribir falló:", error);
          return Response.json({ success: false, error }, { status: 502 });
        }
      },
    },
  },
});
