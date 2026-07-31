import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type PersonaRow = { codigo: string; nombre: string; puesto: string | null; estado: string };

export function usePersonal(soloActivos = false) {
  return useQuery({
    queryKey: ["personal", soloActivos],
    queryFn: async () => {
      let q = supabase.from("personal").select("codigo, nombre, puesto, estado").order("nombre");
      if (soloActivos) q = q.eq("estado", "ACTIVO");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PersonaRow[];
    },
  });
}

export function PersonalSelect({
  value,
  onChange,
  soloActivos = false,
  placeholder = "Seleccionar persona…",
}: {
  value: string | null;
  onChange: (codigo: string | null, persona: PersonaRow | null) => void;
  soloActivos?: boolean;
  placeholder?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const { data: personal = [] } = usePersonal(soloActivos);
  const seleccion = useMemo(() => personal.find((p) => p.codigo === value) ?? null, [personal, value]);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate">{seleccion ? seleccion.nombre : placeholder}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(28rem,90vw)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre o código…" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            {personal.map((p) => (
              <CommandItem
                key={p.codigo}
                value={`${p.nombre} ${p.codigo}`}
                onSelect={() => {
                  onChange(p.codigo, p);
                  setAbierto(false);
                }}
              >
                <Check className={cn("size-4", value === p.codigo ? "opacity-100" : "opacity-0")} />
                <span className="flex-1 truncate">{p.nombre}</span>
                <span
                  className={cn(
                    "text-xs",
                    p.estado === "DESVINCULADO" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {p.estado === "DESVINCULADO" ? "DESVINCULADO" : p.codigo}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
