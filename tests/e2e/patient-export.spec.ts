import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "abad-admin";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Contraseña de administración").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(
    page.getByRole("heading", { name: /Registro de pacientes ABAD/i }),
  ).toBeVisible();
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
