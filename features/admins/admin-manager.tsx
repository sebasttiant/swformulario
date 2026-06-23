"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldAlert,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { AdminListItem } from "./admin-data";
import {
  createAdmin,
  resetAdminPassword,
  setAdminActive,
  setAdminRole,
  type AdminActionResult,
} from "./admin-actions";
import type { AdminRole } from "@prisma/client";

type Flash = { kind: "ok" | "err"; text: string } | null;

export function AdminManager({
  admins,
  currentUserId,
}: {
  admins: AdminListItem[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<Flash>(null);

  // Create form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");

  // Per-row reset password state
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState("");

  function run(fn: () => Promise<AdminActionResult>, onOk?: () => void) {
    setFlash(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setFlash({ kind: "ok", text: res.message ?? "Listo." });
        onOk?.();
      } else {
        setFlash({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {flash ? (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-soft",
            flash.kind === "ok"
              ? "border-success/30 bg-success-soft text-success"
              : "border-danger/30 bg-brand-soft text-danger",
          )}
        >
          {flash.kind === "ok" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ShieldAlert className="size-4" />
          )}
          {flash.text}
        </div>
      ) : null}

      {/* Create admin */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/10">
              <UserPlus className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ink">Crear administrador</h2>
              <p className="text-sm text-muted">
                Se crea con una contraseña temporal. El nuevo admin debería
                cambiarla luego.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-email">Correo</Label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@correo.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-pass">Contraseña temporal</Label>
              <Input
                id="new-pass"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 8 caracteres"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger aria-label="Rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                disabled={pending}
                className="w-full"
                onClick={() =>
                  run(
                    () => createAdmin({ email, password, role }),
                    () => {
                      setEmail("");
                      setPassword("");
                      setRole("ADMIN");
                    },
                  )
                }
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Crear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin list */}
      <div className="overflow-x-auto rounded-2xl border border-white/70 bg-surface/95 shadow-soft ring-1 ring-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
              <th className="px-4 py-3.5">Administrador</th>
              <th className="px-4 py-3.5">Rol</th>
              <th className="px-4 py-3.5">Estado</th>
              <th className="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === currentUserId;
              return (
                <tr
                  key={a.id}
                  className="border-b border-border/70 align-top transition-colors last:border-0 hover:bg-brand-faint"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold uppercase text-brand-strong ring-1 ring-brand/10">
                        {a.email.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {a.email}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-medium text-muted">
                              (tú)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          Desde {a.createdAt.toLocaleDateString("es-CO")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={a.role}
                      onValueChange={(v) =>
                        run(() => setAdminRole(a.id, v as AdminRole))
                      }
                    >
                      <SelectTrigger aria-label={`Rol de ${a.email}`} className="h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        a.active
                          ? "bg-success-soft text-success"
                          : "bg-warning-soft text-warning",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          a.active ? "bg-success" : "bg-warning",
                        )}
                      />
                      {a.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={a.active ? "outline" : "default"}
                          disabled={pending || (isSelf && a.active)}
                          onClick={() => run(() => setAdminActive(a.id, !a.active))}
                        >
                          {a.active ? (
                            <>
                              <XCircle className="size-4" /> Desactivar
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-4" /> Activar
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            setResetFor(resetFor === a.id ? null : a.id);
                            setResetValue("");
                          }}
                        >
                          <KeyRound className="size-4" /> Contraseña
                        </Button>
                      </div>
                      {resetFor === a.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={resetValue}
                            onChange={(e) => setResetValue(e.target.value)}
                            placeholder="Nueva (mín. 8)"
                            className="h-9 w-44"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(
                                () => resetAdminPassword(a.id, resetValue),
                                () => {
                                  setResetFor(null);
                                  setResetValue("");
                                },
                              )
                            }
                          >
                            Guardar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
