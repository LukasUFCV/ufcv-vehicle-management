import { test, expect } from "@playwright/test";

test("connexion et affichage du tableau de bord", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("admin@ufcv.local");
  await page.getByLabel("Mot de passe").fill("Admin123!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
});
