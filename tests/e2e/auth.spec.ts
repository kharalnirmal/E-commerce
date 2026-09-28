import { expect, test } from "@playwright/test";

test("a visitor can create an account and reach the authenticated account page", async ({ page }) => {
  const email = `shopper-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Test Shopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("safe-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Namaste, Test Shopper." })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("safe-test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Namaste, Test Shopper." })).toBeVisible();
});
