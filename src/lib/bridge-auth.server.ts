import { timingSafeEqual } from "crypto";

/** Verifica la clave compartida del puente (header x-bridge-key). Devuelve una Response de error o null. */
export function verificarPuente(request: Request): Response | null {
  const esperada = process.env["BRIDGE_SHARED_KEY"];
  if (!esperada || esperada.length < 16) {
    return Response.json({ success: false, error: "Puente no configurado" }, { status: 503 });
  }
  const a = Buffer.from(request.headers.get("x-bridge-key") ?? "");
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 });
  }
  return null;
}
