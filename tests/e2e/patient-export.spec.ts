import { test, expect } from "@playwright/test";

// Defaults match the seed-admin internal default super admin (a known install
// default, documented in the README), so the suite runs against a clean install.
const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? "admin@ilasesorias.com";
const ADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "Infoseg.00*2026*";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  // Assert a DASHBOARD-unique element. The "Registro de pacientes ABAD" heading
  // also appears on the /login brand panel, so it cannot prove a successful
  // login on its own — "Panel interno" only renders on the authenticated home.
  await expect(page.getByText("Panel interno")).toBeVisible({ timeout: 15000 });
}

test("admin can reach the wizard and the export center", async ({ page }) => {
  await login(page);

  // Open the patient wizard and verify step 0 is shown.
  await page.goto("/patients/new");
  await expect(
    page.getByRole("heading", { name: /Verificación de documento/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Siguiente/i }),
  ).toBeVisible();

  // The export center exposes export controls over the seeded patients.
  await page.goto("/exports");
  await expect(
    page.getByRole("heading", { name: /Exportar a Athenea/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /JSON lote/i }),
  ).toBeVisible();
});

test("export REST endpoint requires authentication", async ({ request }) => {
  const res = await request.get("/api/athenea/patients", {
    headers: { cookie: "" },
  });
  expect(res.status()).toBe(401);
});
