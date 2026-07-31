import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso | Activos TI" },
      {
        name: "description",
        content: "Inicia sesión para administrar el registro y control de activos informáticos.",
      },
      { property: "og:title", content: "Acceso | Activos TI" },
      { property: "og:description", content: "Inicia sesión para gestionar los activos informáticos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { nombre } },
    });
    setCargando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No se pudo iniciar sesión con Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-sidebar-foreground">
          <ShieldCheck className="mx-auto size-8 text-sidebar-primary" />
          <h1 className="mt-3 text-2xl font-semibold">Activos Informáticos</h1>
          <p className="mt-1 text-sm text-sidebar-foreground/70">
            Registro, asignación y control del parque tecnológico
          </p>
        </div>

        <div className="panel p-6">
          <Tabs defaultValue="ingresar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingresar">Ingresar</TabsTrigger>
              <TabsTrigger value="registrar">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="ingresar">
              <form onSubmit={ingresar} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={cargando}>
                  Ingresar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="registrar">
              <form onSubmit={registrar} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Correo</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Contraseña</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={cargando}>
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            Continuar con Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-sidebar-foreground/60">
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
