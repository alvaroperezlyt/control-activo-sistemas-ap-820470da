import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ObservacionesPrivadas({ children, resetKey }: { children: ReactNode; resetKey: string | boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [resetKey]);

  return (
    <section className="space-y-2" aria-label="Observaciones privadas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Observaciones</span>
        <Button type="button" variant="outline" size="sm" aria-expanded={visible} onClick={() => setVisible((actual) => !actual)}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {visible ? "Ocultar" : "Mostrar"}
        </Button>
      </div>
      {visible ? children : <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">Observaciones ocultas</p>}
    </section>
  );
}