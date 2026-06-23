import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppShell, getAppShellNavItems } from "@/components/layout/app-shell";

describe("AppShell patient variant", () => {
  it("does not expose export or admin navigation", () => {
    const patientNav = getAppShellNavItems("patient");

    expect(patientNav.map((item) => item.href)).not.toContain("/exports");
    expect(patientNav.map((item) => item.href)).not.toContain("/admin");
    expect(patientNav.map((item) => item.label).join(" ")).not.toMatch(/export|administración/i);
  });

  it("does not render export wording or links for patient flows", () => {
    const html = renderToStaticMarkup(
      createElement(AppShell, { variant: "patient" }, createElement("main", null, "Patient flow")),
    );

    expect(html).not.toContain('/exports');
    expect(html).not.toMatch(/export/i);
    expect(html).not.toContain('/admin');
    expect(html).not.toMatch(/administración/i);
  });
});
