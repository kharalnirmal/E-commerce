import { expect, test } from "@playwright/test";

test("desktop and mobile navigation expose storefront destinations", async ({ page }) => {
  await page.goto("/");
  const desktopNavigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(desktopNavigation.getByRole("link", { name: "Shop" })).toBeVisible();
  await expect(desktopNavigation.getByRole("link", { name: "Edit" })).toBeVisible();
  await expect(desktopNavigation.getByRole("link", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Account" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /goods meet here/i })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Main menu" });
  await expect(menu).toBeVisible();
  for (const destination of ["Shop", "Edit", "Categories", "Search", "Cart", "Account"]) {
    await expect(menu.getByRole("link", { name: new RegExp(destination) })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
});

test("system dark mode and reduced motion are honored", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const duration = await page.getByTestId("kinetic-hero").locator(".hero-word").first().evaluate(
    (element) => getComputedStyle(element).animationDuration,
  );
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);
  await context.close();
});

test("explicit theme choice persists across navigation and reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/products");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("catalog controls create shareable URL state", async ({ page }) => {
  await page.goto("/products");
  await page.getByLabel("Search the market").fill("lamp");
  await page.getByLabel("Category").selectOption("home");
  await page.getByLabel("Sort").selectOption("price-asc");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/q=lamp&category=home&sort=price-asc/);
  await expect(page.getByRole("link", { name: /Thimi Clay Lamp/ })).toBeVisible();
});

test("product details and stock state are observable", async ({ page }) => {
  await page.goto("/products/kathmandu-carry-all");
  await expect(page.getByRole("heading", { name: "Kathmandu Carry-All" })).toBeVisible();
  await expect(page.getByText("Himali Studio", { exact: true })).toBeVisible();
  await expect(page.getByText("Lalitpur, Nepal", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Style" })).toBeVisible();
  await expect(page.getByText(/hard-wearing cotton canvas/i)).toBeVisible();
  await expect(page.getByRole("img", { name: "Kathmandu Carry-All" })).toBeVisible();
  await expect(page.getByText(/NPR|रू/)).toBeVisible();

  await page.goto("/products/tempo-everyday-tee");
  await expect(page.getByText(/Sold out · unavailable to purchase/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Out of stock" })).toBeDisabled();
});

test("unknown product slugs render the not-found experience", async ({ page }) => {
  const response = await page.goto("/products/not-a-real-product");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "NOT AT THIS CHAUK." })).toBeVisible();
});
