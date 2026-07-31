export function PageHeader({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    ASIGNADO: "bg-primary/10 text-primary",
    LIBRE: "bg-success/15 text-success",
    BAJA: "bg-destructive/10 text-destructive",
    ACTIVO: "bg-success/15 text-success",
    DESVINCULADO: "bg-destructive/10 text-destructive",
    PENDIENTE: "bg-warning/20 text-warning-foreground",
    "EN REPARACION": "bg-accent/20 text-accent-foreground",
    REPARADO: "bg-success/15 text-success",
    "SIN SOLUCION": "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        estilos[estado] ?? "bg-secondary text-secondary-foreground"
      }`}
    >
      {estado}
    </span>
  );
}
