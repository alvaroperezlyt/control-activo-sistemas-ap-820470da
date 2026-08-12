import { createFileRoute, redirect, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Laptop,
  UserCheck,
  Inbox,
  Wrench,
  Building,
  CalendarCheck,
  FileBarChart,
  Info,


  Users,
  Bell,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEsAdmin } from "@/hooks/useEsAdmin";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

const enlaces = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/equipos", label: "Equipos", icon: Laptop },
  { to: "/asignaciones", label: "Asignaciones", icon: UserCheck },
  { to: "/recepciones", label: "Recepciones", icon: Inbox },
  { to: "/fallas", label: "Fallas y reparaciones", icon: Wrench },
  { to: "/sucursales", label: "Sucursales / Líneas de Negocio", icon: Building },
  { to: "/planes", label: "Planes y mantenimiento", icon: CalendarCheck },
  { to: "/personal", label: "Personal (RRHH)", icon: Users },
  { to: "/informes", label: "Informes", icon: FileBarChart },
] as const;

function Shell() {
  const { esAdmin } = useEsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pendientes = 0 } = useQuery({
    queryKey: ["notificaciones", "no-leidas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("leida", false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  async function salir() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="font-display text-lg font-semibold leading-tight">Activos TI</p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/60">Registro y control</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {enlaces.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          {esAdmin && (
            <Link
              to="/usuarios"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm" }}
            >
              <ShieldCheck className="size-4" />
              Usuarios y roles
            </Link>
          )}
          <Link
            to="/notificaciones"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm" }}
          >
            <Bell className="size-4" />
            Notificaciones
            {pendientes > 0 && (
              <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
                {pendientes}
              </span>
            )}
          </Link>
          <Link
            to="/acerca-de"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm" }}
          >
            <Info className="size-4" />
            Acerca de
          </Link>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            onClick={salir}
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden">
          {[
            ...enlaces,
            ...(esAdmin ? [{ to: "/usuarios", label: "Usuarios", icon: ShieldCheck } as const] : []),
            { to: "/notificaciones", label: "Avisos", icon: Bell } as const,
          ].map(
            ({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn("whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground")}
                activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
              >
                {label}
              </Link>
            ),
          )}
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
