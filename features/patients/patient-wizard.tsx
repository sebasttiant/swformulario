"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  patientSchema,
  emptyPatientValues,
  STEP_FIELDS,
  type PatientFormValues,
} from "./patient-schema";
import {
  createPatient,
  updatePatient,
  type PatientActionResult,
} from "./patient-actions";
import type { CatalogOptions, CatalogOption } from "@/features/catalogs/catalog-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  "Verificación",
  "Identificación",
  "Contacto",
  "Ubicación",
  "Administrativo",
  "Habeas Data",
  "Resumen",
];

export function getVisibleStepNumber(index: number): number {
  return index + 1;
}

type FieldName = keyof PatientFormValues;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-danger" role="alert">
      {message}
    </p>
  );
}

function computeAge(birthDate: string): string {
  if (!birthDate) return "—";
  const d = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  let years = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) years--;
  if (years < 0) return "—";
  return `${years} año${years === 1 ? "" : "s"}`;
}

export interface PatientWizardProps {
  options: CatalogOptions;
  initialValues?: PatientFormValues;
  patientId?: string;
}

export function PatientWizard({
  options,
  initialValues,
  patientId,
}: PatientWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialValues ?? emptyPatientValues,
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors },
  } = form;

  const noEmail = useWatch({ control, name: "noEmail" });
  const birthDate = useWatch({ control, name: "birthDate" });

  function labelFor(list: CatalogOption[], id?: string): string {
    if (!id) return "—";
    return list.find((o) => o.id === id)?.label ?? "—";
  }

  /** Index of the first step that owns one of the given field names. */
  function stepOfFields(fields: string[]): number {
    for (let i = 0; i < STEP_FIELDS.length; i++) {
      if ((STEP_FIELDS[i] as string[]).some((f) => fields.includes(f))) return i;
    }
    return STEPS.length - 1;
  }

  async function goNext() {
    await goToStep(step + 1);
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  /** Going back is free; jumping forward validates every step in between so the
   * user can never skip past hidden validation errors. */
  async function goToStep(target: number) {
    const clamped = Math.min(Math.max(target, 0), STEPS.length - 1);
    if (clamped <= step) {
      setStep(clamped);
      return;
    }
    for (let i = step; i < clamped; i++) {
      const fields = STEP_FIELDS[i] as FieldName[] | undefined;
      const ok = fields ? await trigger(fields) : true;
      if (!ok) {
        setStep(i);
        return;
      }
    }
    setStep(clamped);
  }

  function applyServerErrors(result: Extract<PatientActionResult, { ok: false }>) {
    setServerError(result.error);
    if (result.fieldErrors) {
      const erroredFields = Object.keys(result.fieldErrors);
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.[0]) {
          setError(field as FieldName, { message: messages[0] });
        }
      }
      if (erroredFields.length) setStep(stepOfFields(erroredFields));
    }
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setSubmitting(true);
      setServerError(null);
      try {
        const result = patientId
          ? await updatePatient(patientId, values)
          : await createPatient(values);
        if (result.ok) {
          router.push(`/patients/${result.id}`);
          router.refresh();
        } else {
          applyServerErrors(result);
        }
      } finally {
        setSubmitting(false);
      }
    },
    (formErrors) => {
      // Client validation blocked submit — jump to the first step with an error.
      setStep(stepOfFields(Object.keys(formErrors)));
    },
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <Stepper step={step} onSelect={goToStep} />

      <div className="grid gap-5 lg:grid-cols-[0.32fr_0.68fr]">
        <aside className="relative order-last overflow-hidden rounded-card border border-white/10 bg-ink p-5 text-white shadow-premium sm:p-6 lg:order-none lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-brand/25" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/75">
                <ShieldCheck className="size-3.5 text-brand" />
                Registro seguro
              </span>
              <div>
                <p className="text-3xl font-black tracking-tight">{STEPS[step]}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Paso {step + 1} de {STEPS.length}. La información se valida antes de guardarse en la base de datos.
                </p>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:block">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="size-4 text-brand" />
                Flujo de confianza
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Al finalizar verás una confirmación del registro. Las herramientas administrativas quedan fuera de este flujo.
              </p>
            </div>
          </div>
        </aside>

      <Card className="overflow-hidden shadow-premium">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {step === 0 && (
              <Section
                title="Verificación de documento"
                description="Validación de formato local. No consulta Athenea en esta etapa."
              >
                <ControlledSelect
                  control={control}
                  name="documentTypeId"
                  label="Tipo de identificación"
                  required
                  options={options.documentType}
                  error={errors.documentTypeId?.message}
                />
                <Field label="Número de identificación" required error={errors.documentNumber?.message}>
                  <Input
                    {...register("documentNumber")}
                    inputMode="numeric"
                    placeholder="Ej: 1018456789"
                  />
                </Field>
              </Section>
            )}

            {step === 1 && (
              <Section title="Identificación del paciente">
                <Field label="Primer nombre" required error={errors.firstName?.message}>
                  <Input {...register("firstName")} />
                </Field>
                <Field label="Segundo nombre" error={errors.secondName?.message}>
                  <Input {...register("secondName")} />
                </Field>
                <Field label="Primer apellido" required error={errors.firstSurname?.message}>
                  <Input {...register("firstSurname")} />
                </Field>
                <Field label="Segundo apellido" error={errors.secondSurname?.message}>
                  <Input {...register("secondSurname")} />
                </Field>
                <Field label="Fecha de nacimiento" required error={errors.birthDate?.message}>
                  <Input type="date" {...register("birthDate")} />
                  <p className="text-xs text-muted">Edad: {computeAge(birthDate ?? "")}</p>
                </Field>
                <ControlledSelect
                  control={control}
                  name="sexCatalogValueId"
                  label="Sexo"
                  required
                  options={options.sex}
                  error={errors.sexCatalogValueId?.message}
                />
                <ControlledCheckbox
                  control={control}
                  name="active"
                  label="Paciente activo"
                />
              </Section>
            )}

            {step === 2 && (
              <Section title="Contacto">
                <Field label="Teléfono fijo" error={errors.fixedPhone?.message}>
                  <Input {...register("fixedPhone")} inputMode="tel" />
                </Field>
                <Field label="Teléfono móvil" required error={errors.mobilePhone?.message}>
                  <Input
                    {...register("mobilePhone")}
                    inputMode="tel"
                    placeholder="3001234567"
                  />
                </Field>
                <ControlledCheckbox
                  control={control}
                  name="noEmail"
                  label="Sin correo electrónico"
                />
                <Field label="Correo electrónico" required={!noEmail} error={errors.email?.message}>
                  <Input
                    type="email"
                    {...register("email")}
                    disabled={Boolean(noEmail)}
                    placeholder="paciente@correo.com"
                  />
                </Field>
              </Section>
            )}

            {step === 3 && (
              <Section title="Ubicación">
                <Field label="Dirección" error={errors.address?.message}>
                  <Input {...register("address")} placeholder="Cra 15 # 93-47" />
                </Field>
                <ControlledSelect
                  control={control}
                  name="cityCatalogValueId"
                  label="Ciudad"
                  required
                  options={options.city}
                  error={errors.cityCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="residentialZoneCatalogValueId"
                  label="Zona residencial"
                  required
                  options={options.residentialZone}
                  error={errors.residentialZoneCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="nationalityCatalogValueId"
                  label="Nacionalidad"
                  required
                  options={options.nationality}
                  error={errors.nationalityCatalogValueId?.message}
                />
              </Section>
            )}

            {step === 4 && (
              <Section title="Datos administrativos">
                <ControlledSelect
                  control={control}
                  name="userTypeCatalogValueId"
                  label="Tipo de usuario"
                  required
                  options={options.userType}
                  error={errors.userTypeCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="insurerCatalogValueId"
                  label="Aseguradora"
                  required
                  options={options.insurer}
                  error={errors.insurerCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="patientOriginCatalogValueId"
                  label="Origen del paciente"
                  required
                  options={options.patientOrigin}
                  error={errors.patientOriginCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="treatmentCatalogValueId"
                  label="Tratamiento"
                  options={options.treatment}
                  error={errors.treatmentCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="documentExpeditionCityCatalogValueId"
                  label="Ciudad de expedición del documento"
                  required
                  options={options.documentExpeditionCity}
                  error={errors.documentExpeditionCityCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="entityCatalogValueId"
                  label="Entidad"
                  options={options.entity}
                  error={errors.entityCatalogValueId?.message}
                />
                <ControlledSelect
                  control={control}
                  name="planCatalogValueId"
                  label="Plan"
                  options={options.plan}
                  error={errors.planCatalogValueId?.message}
                />
              </Section>
            )}

            {step === 5 && (
              <Section
                title="Autorización de datos (Habeas Data)"
                description="Requerido para continuar."
              >
                <div className="rounded-lg border border-border bg-canvas p-4 text-sm text-ink-soft">
                  Autorizo de manera libre, previa y expresa a ABAD Laboratorio
                  para recolectar, almacenar y tratar mis datos personales con
                  fines clínicos y administrativos, conforme a la Ley 1581 de 2012.
                </div>
                <Controller
                  control={control}
                  name="habeasDataAccepted"
                  render={({ field }) => (
                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(c === true)}
                      />
                      <span className="text-sm text-ink">
                        Autorizo el tratamiento de mis datos personales.
                      </span>
                    </label>
                  )}
                />
                <FieldError message={errors.habeasDataAccepted?.message} />
              </Section>
            )}

            {step === 6 && (
              <Section
                title="Resumen"
                description="Revisa y confirma. Puedes volver a cualquier sección para editar."
              >
                <Summary
                  values={form.getValues()}
                  options={options}
                  labelFor={labelFor}
                  onEdit={setStep}
                  age={computeAge(birthDate ?? "")}
                />
              </Section>
            )}

            {serverError ? (
              <p className="text-sm text-danger" role="alert">
                {serverError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-surface-raised px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
              <Button
                type="button"
                variant="ghost"
                onClick={goPrev}
                disabled={step === 0}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="size-4" /> Atrás
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext} className="w-full sm:w-auto">
                  Siguiente <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {patientId ? "Guardar cambios" : "Confirmar y guardar"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function Stepper({
  step,
  onSelect,
}: {
  step: number;
  onSelect: (s: number) => void;
}) {
  return (
    <ol className="flex gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-surface/95 p-2 shadow-soft ring-1 ring-border/60 backdrop-blur lg:flex-wrap">
      {STEPS.map((label, index) => {
        const state =
          index === step ? "current" : index < step ? "done" : "todo";
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "flex min-w-max items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                state === "current" &&
                  "border-brand bg-brand text-brand-foreground shadow-lg shadow-brand/20",
                state === "done" && "border-brand/30 bg-brand-soft text-brand-strong shadow-sm",
                state === "todo" && "border-border bg-surface text-muted",
              )}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-[0.65rem]">
                {state === "done" ? <Check className="size-3" /> : getVisibleStepNumber(index)}
              </span>
              {label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label required={required}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function ControlledSelect({
  control,
  name,
  label,
  options,
  required,
  error,
}: {
  control: ReturnType<typeof useForm<PatientFormValues>>["control"];
  name: FieldName;
  label: string;
  options: CatalogOption[];
  required?: boolean;
  error?: string;
}) {
  return (
    <Field label={label} required={required} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={(field.value as string) || undefined}
            onValueChange={field.onChange}
          >
            <SelectTrigger aria-label={label}>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}

function ControlledCheckbox({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<PatientFormValues>>["control"];
  name: FieldName;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-3 self-end pb-2">
          <Checkbox
            checked={Boolean(field.value)}
            onCheckedChange={(c) => field.onChange(c === true)}
          />
          <span className="text-sm text-ink">{label}</span>
        </label>
      )}
    />
  );
}

function Summary({
  values,
  options,
  labelFor,
  onEdit,
  age,
}: {
  values: PatientFormValues;
  options: CatalogOptions;
  labelFor: (list: CatalogOption[], id?: string) => string;
  onEdit: (step: number) => void;
  age: string;
}) {
  const sections: Array<{
    step: number;
    title: string;
    rows: Array<[string, string]>;
  }> = [
    {
      // Document type/number live in step 0 (Verificación), so edit jumps there.
      step: 0,
      title: "Documento",
      rows: [
        ["Tipo de documento", labelFor(options.documentType, values.documentTypeId)],
        ["Número", values.documentNumber || "—"],
      ],
    },
    {
      step: 1,
      title: "Identificación",
      rows: [
        [
          "Nombre",
          [values.firstName, values.secondName, values.firstSurname, values.secondSurname]
            .filter(Boolean)
            .join(" ") || "—",
        ],
        ["Fecha de nacimiento", values.birthDate || "—"],
        ["Edad", age],
        ["Sexo", labelFor(options.sex, values.sexCatalogValueId)],
        ["Activo", values.active ? "Sí" : "No"],
      ],
    },
    {
      step: 2,
      title: "Contacto",
      rows: [
        ["Teléfono fijo", values.fixedPhone || "—"],
        ["Teléfono móvil", values.mobilePhone || "—"],
        ["Correo", values.noEmail ? "Sin correo" : values.email || "—"],
      ],
    },
    {
      step: 3,
      title: "Ubicación",
      rows: [
        ["Dirección", values.address || "—"],
        ["Ciudad", labelFor(options.city, values.cityCatalogValueId)],
        ["Zona residencial", labelFor(options.residentialZone, values.residentialZoneCatalogValueId)],
        ["Nacionalidad", labelFor(options.nationality, values.nationalityCatalogValueId)],
      ],
    },
    {
      step: 4,
      title: "Administrativo",
      rows: [
        ["Tipo de usuario", labelFor(options.userType, values.userTypeCatalogValueId)],
        ["Aseguradora", labelFor(options.insurer, values.insurerCatalogValueId)],
        ["Origen", labelFor(options.patientOrigin, values.patientOriginCatalogValueId)],
        ["Tratamiento", labelFor(options.treatment, values.treatmentCatalogValueId)],
        ["Ciudad expedición", labelFor(options.documentExpeditionCity, values.documentExpeditionCityCatalogValueId)],
        ["Entidad", labelFor(options.entity, values.entityCatalogValueId)],
        ["Plan", labelFor(options.plan, values.planCatalogValueId)],
      ],
    },
    {
      step: 5,
      title: "Habeas Data",
      rows: [["Autorización", values.habeasDataAccepted ? "Autorizado" : "Pendiente"]],
    },
  ];

  return (
    <div className="col-span-full flex flex-col gap-4">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-border bg-surface-raised p-4 shadow-soft"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">{section.title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(section.step)}
            >
              Editar
            </Button>
          </div>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {section.rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
