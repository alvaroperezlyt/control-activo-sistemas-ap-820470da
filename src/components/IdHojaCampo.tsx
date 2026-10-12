import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LockOpen, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Props = { clave: string; titulo: string; defecto: string; esAdmin: boolean };

export function IdHojaCampo({ clave, titulo, defecto, esAdmin }: Props) {
  const qc = useQueryClient();
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [texto, setTexto] = useState("");

  const { data: valor = defecto } = useQuery({
    queryKey: ["ajustes", clave],
    queryFn: async () => {
      const { data, error } = await supabase.from("ajustes").select("valor").eq("clave", clave).maybeSingle();
      if (error) throw error;
      return data?.valor?.trim() || defecto;
    },
  });

  useEffect(() => setTexto(valor), [valor]);

  const guardar = useMutation({
    mutationFn: async () => {
      const limpio = texto.trim();
      if (!/^[A-Za-z0-9_-]{20,}$/.test(limpio)) throw new Error("El ID de la hoja no es válido.");
      const { error } = await supabase.from("ajustes").upsert({ clave, valor: limpio }, { onConflict: "clave" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ID de la hoja guardado");
      setDesbloqueado(false);
      qc.invalidateQueries({ queryKey: ["ajustes", clave] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <label className="label-mono">{titulo}</label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Input
          className="min-w-0 flex-1 font-mono text-xs"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={!desbloqueado}
        />
        {esAdmin &&
          (desbloqueado ? (
            <>
              <Button size="sm" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                <Save className="size-4" /> Guardar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTexto(valor);
                  setDesbloqueado(false);
                }}
              >
                <X className="size-4" /> Cancelar
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setDesbloqueado(true)}>
              <LockOpen className="size-4" /> Desbloquear
            </Button>
          ))}
        {!esAdmin && <Lock className="size-4 text-muted-foreground" />}
      </div>
    </div>
  );
}
