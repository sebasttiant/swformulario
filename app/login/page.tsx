import { redirect } from "next/navigation";
import { AbadLogo } from "@/components/brand/abad-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { isAuthenticated } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <AbadLogo className="scale-125" />
          <p className="text-sm text-muted">
            Registro de pacientes · Exportación a Athenea
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acceso interno</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted">
          Acceso restringido al personal autorizado de ABAD Laboratorio.
        </p>
      </div>
    </div>
  );
}
