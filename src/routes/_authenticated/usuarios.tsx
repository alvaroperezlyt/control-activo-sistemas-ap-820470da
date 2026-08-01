import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEsAdmin } from "@/hooks/useEsAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Rol = "admin" | "tecnico";

type Autorizado = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios y roles | Activos TI" },
      {
        name: "description",
        content: "Autoriza correos, define roles y controla quién puede acceder al control de activos.",
      },
      { property: "og:title", content: "Usuarios y roles | Activos TI" },
      {
        property: "og:description",
        content: "Administración de accesos: registra nombre, correo y rol de cada usuario del sistema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Usuarios,
});

const ROLES: { valor: Rol; etiqueta: string; detalle: string }[] = [
  { valor: "admin", etiqueta: "Administrador", detalle: "Acceso total, puede eliminar y administrar usuarios" },
  { valor: "tecnico", etiqueta: "Técnico", detalle: "Registra y edita equipos, asignaciones y recepciones" },
];

function Usuarios() {
  const queryClient = useQueryClient();
  const { esAdmin, cargando } = useEsAdmin();
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Autorizado | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", rol: "tecnico" as Rol });

  const { data: autorizados = [] } = useQuery({
    queryKey: ["usuarios-autorizados"],
    enabled: esAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios_autorizados")
        .select("id, email, nombre, rol, created_at")
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as Autorizado[];
    },
  });

  const { data: cuentas = [] } = useQuery({
    queryKey: ["cuentas-registradas"],
    enabled: esAdmin,
    queryFn: async () => {
      const [{ data: perfiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("id, email, nombre"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return (perfiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Rol),
      }));
    },
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const nombre = form.nombre.trim();
      const email = form.email.trim().toLowerCase();
      if (!nombre) throw new Error("El nombre es obligatorio");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo no válido");
      if (editando) {
        const { error } = await supabase
          .from("usuarios_autorizados")
          .update({ nombre, email, rol: form.rol })
          .eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("usuarios_autorizados")
          .insert({ nombre, email, rol: form.rol });
        if (error) throw error;
      }
      // Si la persona ya tiene cuenta creada, aplicar el rol de inmediato
      const cuenta = cuentas.find((c) => (c.email ?? "").toLowerCase() === email);
      if (cuenta) {
        await supabase.from("user_roles").delete().eq("user_id", cuenta.id);
        const { error } = await supabase.from("user_roles").insert({ user_id: cuenta.id, role: form.rol });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios-autorizados"] });
      queryClient.invalidateQueries({ queryKey: ["cuentas-registradas"] });
      setAbierto(false);
      toast.success(editando ? "Usuario actualizado" : "Usuario autorizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (fila: Autorizado) => {
      const { error } = await supabase.from("usuarios_autorizados").delete().eq("id", fila.id);
      if (error) throw error;
      const cuenta = cuentas.find((c) => (c.email ?? "").toLowerCase() === fila.email.toLowerCase());
      if (cuenta) await supabase.from("user_roles").delete().eq("user_id", cuenta.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios-autorizados"] });
      queryClient.invalidateQueries({ queryKey: ["cuentas-registradas"] });
      toast.success("Autorización revocada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    if (!q) return autorizados;
    return autorizados.filter((a) => `${a.nombre} ${a.email} ${a.rol}`.toLowerCase().includes(q));
  }, [autorizados, texto]);

  function abrirNuevo() {
    setEditando(null);
    setForm({ nombre: "", email: "", rol: "tecnico" });
    setAbierto(true);
  }

  function abrirEditar(fila: Autorizado) {
    setEditando(fila);
    setForm({ nombre: fila.nombre, email: fila.email, rol: fila.rol });
    setAbierto(true);
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  if (!esAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Solo los administradores pueden gestionar usuarios</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicita a un administrador que te asigne el rol correspondiente.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Usuarios y roles"
        descripcion="Registra el nombre, correo y rol de las personas que pueden acceder al sistema. Un correo que no esté en esta lista podrá crear cuenta pero no verá ningún dato."
      >
        <Button onClick={abrirNuevo}>
          <Plus className="size-4" />
          Autorizar usuario
        </Button>
      </PageHeader>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre, correo o rol"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Cuenta</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((fila) => {
              const cuenta = cuentas.find((c) => (c.email ?? "").toLowerCase() === fila.email.toLowerCase());
              return (
                <tr key={fila.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{fila.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fila.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {fila.rol === "admin" ? "Administrador" : "Técnico"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {cuenta ? "Registrada" : "Pendiente de registro"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(fila)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`¿Revocar el acceso de ${fila.nombre}?`)) eliminar.mutate(fila);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Aún no hay usuarios autorizados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Cuentas registradas</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Roles asignados</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.nombre ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="px-4 py-3">
                  {c.roles.length ? c.roles.join(", ") : <span className="text-muted-foreground">Sin acceso</span>}
                </td>
              </tr>
            ))}
            {cuentas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  Sin cuentas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuario" : "Autorizar usuario"}</DialogTitle>
            <DialogDescription>
              El rol se aplica automáticamente cuando la persona cree su cuenta con este correo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v as Rol })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.valor} value={r.valor}>
                      {r.etiqueta} — {r.detalle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
