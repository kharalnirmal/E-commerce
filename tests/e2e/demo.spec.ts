import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function switchIdentity(page: import("@playwright/test").Page, name: string) {
  await page.getByRole("button", { name: "Open DevUI" }).click();
  await page.getByRole("dialog", { name: "Demo identities" }).getByRole("button", { name: new RegExp(name) }).click();
}

test("demo identities are real, distinct sessions", async ({ page }) => {
  await page.goto("/");
  await switchIdentity(page, "Suraj Shrestha");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Kathmandu Carry-All" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trail Flask" })).toBeVisible();
  await page.getByRole("button", { name: "Open DevUI" }).click();
  await expect(page.getByRole("button", { name: "Close DevUI" })).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Demo identities" }).getByLabel("Type RESET to restore demo")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open DevUI" })).toBeFocused();

  await switchIdentity(page, "Aadarsh Rai");
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();

  await switchIdentity(page, "Nirmal Kharal");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "MARKET / DESK" })).toBeVisible();
});

test("weekly edit limit and canonical reset are enforced", async ({ page }) => {
  const visitorEmail = `preserved-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Preserved Visitor");
  await page.getByLabel("Email").fill(visitorEmail);
  await page.getByLabel("Password").fill("safe-test-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await switchIdentity(page, "Nirmal Kharal");
  await page.goto("/admin/products");

  const monsoon = page.getByRole("listitem").filter({ hasText: "Monsoon Overshirt" });
  await monsoon.getByRole("button", { name: "Feature product" }).click();
  await expect(monsoon.getByRole("status")).toHaveText("The weekly edit already has six products.");

  const carryAll = page.getByRole("listitem").filter({ hasText: "Kathmandu Carry-All" });
  await carryAll.getByRole("button", { name: "Remove from edit" }).click();
  await expect(carryAll.getByRole("status")).toHaveText("Weekly edit updated.");

  const competingPage = await page.context().newPage();
  await competingPage.goto("/admin/products");
  const cityLoom = competingPage.getByRole("listitem").filter({ hasText: "City Loom Scarf" });
  await Promise.all([
    monsoon.getByRole("button", { name: "Feature product" }).click(),
    cityLoom.getByRole("button", { name: "Feature product" }).click(),
  ]);
  const results = await Promise.all([
    monsoon.getByRole("status").textContent(),
    cityLoom.getByRole("status").textContent(),
  ]);
  expect(results.sort()).toEqual([
    "The weekly edit already has six products.",
    "Weekly edit updated.",
  ]);
  await competingPage.close();

  await page.getByRole("button", { name: "Open DevUI" }).click();
  const dialog = page.getByRole("dialog", { name: "Demo identities" });
  await dialog.getByLabel("Type RESET to restore demo").fill("reset");
  await dialog.getByRole("button", { name: "Restore canonical snapshot" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Type RESET exactly to continue.");
  await dialog.getByLabel("Type RESET to restore demo").fill("RESET");
  await dialog.getByRole("button", { name: "Restore canonical snapshot" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Canonical demo restored.", { timeout: 20_000 });

  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(visitorEmail);
  await page.getByLabel("Password").fill("safe-test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Namaste, Preserved Visitor." })).toBeVisible();
});

test("cart additions accumulate and stock failures are announced", async ({ page }) => {
  await page.goto("/");
  await switchIdentity(page, "Suraj Shrestha");
  const competingPage = await page.context().newPage();
  await Promise.all([
    page.goto("/products/kathmandu-carry-all"),
    competingPage.goto("/products/kathmandu-carry-all"),
  ]);
  await Promise.all([
    page.getByRole("button", { name: "Add to cart" }).click(),
    competingPage.getByRole("button", { name: "Add to cart" }).click(),
  ]);
  await expect(page.getByRole("status")).toHaveText("Added to cart.");
  await expect(competingPage.getByRole("status")).toHaveText("Added to cart.");
  await competingPage.close();

  await page.goto("/cart");
  const carryAll = page.getByRole("listitem").filter({ hasText: "Kathmandu Carry-All" });
  await expect(carryAll.getByLabel("Quantity")).toHaveValue("3");
  await carryAll.getByLabel("Quantity").fill("12");
  await carryAll.getByRole("button", { name: "Update" }).click();
  await expect(carryAll.getByRole("status")).toHaveText("Quantity updated.");
  await carryAll.getByLabel("Quantity").evaluate((input: HTMLInputElement) => {
    input.max = "99";
  });
  await carryAll.getByLabel("Quantity").fill("13");
  await carryAll.getByRole("button", { name: "Update" }).click();
  await expect(carryAll.getByRole("status")).toContainText("not enough stock");
});
