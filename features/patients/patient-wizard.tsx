"use client";

import { useState, type ElementType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  MapPin,
  PartyPopper,
  Phone,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import {
  patientSchema,
  emptyPatientValues,
  STEP_FIELDS,
  type PatientFormValues,
} from "./patient-schema";
import {
  createPatient,
  createPublicPatient,
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
import { SearchableSelect } from "@/components/ui/searchable-select";
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

export type PatientWizardMode = "admin" | "public";

export interface PatientWizardProps {
  options: CatalogOptions;
  initialValues?: PatientFormValues;
  patientId?: string;
  /**
   * "admin" (default): authenticated operators; on save the wizard navigates to
   * the protected patient detail. "public": unauthenticated external patients;
   * on save the wizard shows an in-place confirmation and exposes NO links into
   * protected areas.
   */
  mode?: PatientWizardMode;
}

export function PatientWizard({
  options,
  initialValues,
  patientId,
  mode = "admin",
}: PatientWizardProps) {
  const router = useRouter();
  const isPublic = mode === "public";
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
    clearErrors,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const noEmail = useWatch({ control, name: "noEmail" });
  const birthDate = useWatch({ control, name: "birthDate" });
  const cityValue = useWatch({ control, name: "cityCatalogValueId" });
  const nationalityValue = useWatch({ control, name: "nationalityCatalogValueId" });

  // The "Otro" options reveal a free-text field. They are identified by their
  // catalog code (city = "OTRO", nationality = "OT"), not a hardcoded id.
  const cityOtherId = options.city.find((o) => o.code === "OTRO")?.id;
  const nationalityOtherId = options.nationality.find((o) => o.code === "OT")?.id;
  const showCityOther = !!cityOtherId && cityValue === cityOtherId;
  const showNationalityOther =
    !!nationalityOtherId && nationalityValue === nationalityOtherId;

  /**
   * Conditional-required validation for the "Otro" free-text fields. The zod
   * schema can't express this (it only sees opaque catalog ids), so the wizard
   * and the server action enforce it explicitly.
   */
  function validateOtherFields(): boolean {
    let ok = true;
    if (showCityOther && !(getValues("cityOther") ?? "").trim()) {
      setError("cityOther", { message: "Especifique la ciudad." });
      ok = false;
    }
    if (showNationalityOther && !(getValues("nationalityOther") ?? "").trim()) {
      setError("nationalityOther", { message: "Especifique la nacionalidad." });
      ok = false;
    }
    return ok;
  }

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
      let ok = fields ? await trigger(fields) : true;
      // Step 3 (Location) owns the conditional "Otro" free-text fields.
      if (i === 3 && !validateOtherFields()) ok = false;
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
      // Guard the conditional "Otro" fields before hitting the server.
      if (!validateOtherFields()) {
        setStep(3);
        return;
      }
      setSubmitting(true);
      setServerError(null);
      try {
        const result = patientId
          ? await updatePatient(patientId, values)
          : isPublic
            ? await createPublicPatient(values)
            : await createPatient(values);
        if (result.ok) {
          if (isPublic) {
            // Public patients have no access to the protected detail page; show
            // an in-place confirmation instead of navigating anywhere private.
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            router.push(`/patients/${result.id}`);
            router.refresh();
          }
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

  function registerAnother() {
    form.reset(emptyPatientValues);
    setStep(0);
    setSubmitted(false);
    setServerError(null);
  }

  if (submitted && isPublic) {
    return <PublicConfirmation onRegisterAnother={registerAnother} />;
  }

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
                {isPublic ? "Tus datos, protegidos" : "Registro seguro"}
              </span>
              <div>
                <p className="text-3xl font-black tracking-tight">{STEPS[step]}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Paso {step + 1} de {STEPS.length}.{" "}
                  {isPublic
                    ? "Validamos cada sección para que tu información quede correcta y completa."
                    : "La información se valida antes de registrarse."}
                </p>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:block">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="size-4 text-brand" />
                {isPublic ? "¿Qué pasa al terminar?" : "Flujo de confianza"}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {isPublic
                  ? "Verás una confirmación de que recibimos tu registro. No necesitas imprimir ni enviar nada más."
                  : "Al finalizar verás una confirmación del registro. Las herramientas administrativas quedan fuera de este flujo."}
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
                icon={FileCheck2}
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
              <Section title="Identificación del paciente" icon={User}>
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
              <Section title="Contacto" icon={Phone}>
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
              <Section title="Ubicación" icon={MapPin}>
                <Field label="Dirección" error={errors.address?.message}>
                  <Input {...register("address")} placeholder="Cra 15 # 93-47" />
                </Field>
                <ControlledSearchableSelect
                  control={control}
                  name="cityCatalogValueId"
                  label="Ciudad"
                  required
                  options={options.city}
                  error={errors.cityCatalogValueId?.message}
                  onAfterChange={(v) => {
                    if (v !== cityOtherId) {
                      setValue("cityOther", "");
                      clearErrors("cityOther");
                    }
                  }}
                />
                {showCityOther && (
                  <Field
                    label="Especifique la ciudad"
                    required
                    error={errors.cityOther?.message}
                  >
                    <Input
                      {...register("cityOther")}
                      placeholder="Nombre del municipio"
                    />
                  </Field>
                )}
                <ControlledSelect
                  control={control}
                  name="residentialZoneCatalogValueId"
                  label="Zona residencial"
                  required
                  options={options.residentialZone}
                  error={errors.residentialZoneCatalogValueId?.message}
                />
                <ControlledSearchableSelect
                  control={control}
                  name="nationalityCatalogValueId"
                  label="Nacionalidad"
                  required
                  options={options.nationality}
                  error={errors.nationalityCatalogValueId?.message}
                  onAfterChange={(v) => {
                    if (v !== nationalityOtherId) {
                      setValue("nationalityOther", "");
                      clearErrors("nationalityOther");
                    }
                  }}
                />
                {showNationalityOther && (
                  <Field
                    label="Especifique la nacionalidad"
                    required
                    error={errors.nationalityOther?.message}
                  >
                    <Input
                      {...register("nationalityOther")}
                      placeholder="Nacionalidad"
                    />
                  </Field>
                )}
              </Section>
            )}

            {step === 4 && (
              <Section title="Datos administrativos" icon={Building2}>
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
                <ControlledSearchableSelect
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
                icon={ScrollText}
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
                icon={ClipboardCheck}
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

/** Polished success screen for the public intake flow. Exposes NO navigation
 * into protected areas and NO export controls — only a thank-you message and an
 * option to register another patient. */
function PublicConfirmation({
  onRegisterAnother,
}: {
  onRegisterAnother: () => void;
}) {
  const steps = [
    "Recibimos tu información de forma segura.",
    "Nuestro equipo la validará para tu atención.",
    "No necesitas hacer nada más por ahora.",
  ];

  return (
    <div className="animate-fade-up mx-auto flex max-w-xl flex-col items-center text-center">
      <div className="relative overflow-hidden rounded-card border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(251,253,255,0.85))] p-8 shadow-premium ring-1 ring-border/50 sm:p-10">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative mx-auto grid size-20 place-items-center">
          <span className="sheen-ring absolute inset-0 rounded-full opacity-70 blur-[2px]" />
          <span className="relative grid size-16 place-items-center rounded-full bg-[linear-gradient(180deg,#1aa172,#0f766e)] text-white shadow-lg shadow-accent/30">
            <Check className="size-8" strokeWidth={3} />
          </span>
        </div>

        <span className="relative mt-6 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-success">
          <PartyPopper className="size-3.5" />
          Registro enviado
        </span>

        <h2 className="relative mt-4 text-3xl font-black tracking-tight text-ink">
          ¡Gracias! Tu registro fue enviado
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-base leading-7 text-ink-soft">
          Tus datos quedaron guardados correctamente. No necesitas imprimir ni
          enviar nada más.
        </p>

        <ul className="relative mt-7 space-y-3 text-left">
          {steps.map((label) => (
            <li
              key={label}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface/80 px-4 py-3 text-sm text-ink-soft shadow-sm"
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="relative mt-8">
          <Button type="button" variant="outline" onClick={onRegisterAnother}>
            <RotateCcw className="size-4" /> Registrar otro paciente
          </Button>
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
        <Sparkles className="size-3.5 text-brand" />
        ABAD Laboratorio · Atención centrada en el paciente
      </p>
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
  const progress = Math.round((step / (STEPS.length - 1)) * 100);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(251,253,255,0.82))] p-3 shadow-soft ring-1 ring-border/50 backdrop-blur">
      <div className="flex items-center gap-3 px-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/70">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand),var(--color-brand-strong))] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progress, 6)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-bold tabular-nums text-brand-strong">
          {step + 1}/{STEPS.length}
        </span>
      </div>
      <ol className="flex gap-2 overflow-x-auto lg:flex-wrap">
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
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ElementType;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/10">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div>
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          ) : null}
        </div>
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

function ControlledSearchableSelect({
  control,
  name,
  label,
  options,
  required,
  error,
  onAfterChange,
}: {
  control: ReturnType<typeof useForm<PatientFormValues>>["control"];
  name: FieldName;
  label: string;
  options: CatalogOption[];
  required?: boolean;
  error?: string;
  onAfterChange?: (value: string) => void;
}) {
  return (
    <Field label={label} required={required} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <SearchableSelect
            aria-label={label}
            value={(field.value as string) || undefined}
            onValueChange={(v) => {
              field.onChange(v);
              onAfterChange?.(v);
            }}
            options={options.map((o) => ({ value: o.id, label: o.label }))}
          />
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
        [
          "Ciudad",
          options.city.find((o) => o.id === values.cityCatalogValueId)?.code ===
          "OTRO"
            ? values.cityOther || "Otro"
            : labelFor(options.city, values.cityCatalogValueId),
        ],
        ["Zona residencial", labelFor(options.residentialZone, values.residentialZoneCatalogValueId)],
        [
          "Nacionalidad",
          options.nationality.find(
            (o) => o.id === values.nationalityCatalogValueId,
          )?.code === "OT"
            ? values.nationalityOther || "Otra"
            : labelFor(options.nationality, values.nationalityCatalogValueId),
        ],
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
