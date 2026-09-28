import { expect, test } from "@playwright/test";

async function dismissOpening(page: import("@playwright/test").Page) {
  const opening = page.getByRole("dialog", { name: "CHOWK opening" });
  if (await opening.isVisible()) await opening.getByRole("button", { name: "Skip" }).click();
}

test("desktop and mobile navigation expose storefront destinations", async ({ page }) => {
  await page.goto("/");
  await dismissOpening(page);
  const desktopNavigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(desktopNavigation.getByRole("link", { name: "Shop" })).toBeVisible();
  await expect(desktopNavigation.getByRole("link", { name: "Featured" })).toBeVisible();
  await expect(desktopNavigation.getByRole("link", { name: "Collections" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" }).first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Cart" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Account" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /objects worth meeting/i })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Main menu" });
  await expect(menu).toBeVisible();
  for (const destination of ["Shop", "Featured", "Collections", "Search", "Cart", "Account"]) {
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
  await expect(page.getByRole("heading", { name: /objects worth meeting/i })).toBeVisible();
  await expect(page.getByTestId("opening-sequence")).not.toBeVisible();
  await context.close();
});

test("explicit theme choice persists across navigation and reload", async ({ page }) => {
  await page.goto("/");
  await dismissOpening(page);
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
  await expect(page.getByRole("img", { name: /Kathmandu Carry-All, view 1/ })).toBeVisible();
  await page.getByRole("button", { name: "Show Kathmandu Carry-All view 1" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("img", { name: /Kathmandu Carry-All, view 2/ })).toBeVisible();
  await expect(page.getByText(/NPR|रू/)).toBeVisible();

  await page.goto("/products/tempo-everyday-tee");
  await expect(page.getByText(/Sold out · unavailable to purchase/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Out of stock" })).toBeDisabled();
});

test("unknown product slugs render the not-found experience", async ({ page }) => {
  const response = await page.goto("/products/not-a-real-product");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "NOT AT THIS CHOWK." })).toBeVisible();
});

test("opening sequence runs only for a direct first homepage entry", async ({ browser }) => {
  const directContext = await browser.newContext();
  const directPage = await directContext.newPage();
  await directPage.goto("/", { waitUntil: "domcontentloaded" });
  await expect(directPage.getByRole("dialog", { name: "CHOWK opening" })).toBeVisible();
  await directPage.getByRole("button", { name: "Skip" }).click();
  await directPage.goto("/products");
  await directPage.getByRole("link", { name: "CHOWK home" }).click();
  await expect(directPage.getByRole("dialog", { name: "CHOWK opening" })).toHaveCount(0);
  await directContext.close();

  const catalogContext = await browser.newContext();
  const catalogPage = await catalogContext.newPage();
  await catalogPage.goto("/products");
  await catalogPage.getByRole("link", { name: "CHOWK home" }).click();
  await expect(catalogPage.getByRole("dialog", { name: "CHOWK opening" })).toHaveCount(0);
  await catalogContext.close();
});

test("global search manages focus and reaches complete results", async ({ page }) => {
  await page.goto("/products");
  const trigger = page.getByRole("button", { name: "Search" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Search products" });
  const input = dialog.getByRole("searchbox", { name: "Search products" });
  await expect(input).toBeFocused();
  await input.fill("lamp");
  await expect(dialog.getByRole("link", { name: /Thimi Clay Lamp/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await input.fill("canvas");
  await dialog.getByRole("link", { name: "View all results" }).click();
  await expect(page).toHaveURL(/\/products\?q=canvas/);
  await expect(page.getByText(/objects?$/).first()).toBeVisible();
});

test("Quick Add reports authentication, success, and sold-out outcomes", async ({ page }) => {
  await page.goto("/products");
  const carryAll = page.locator("article").filter({ hasText: "Kathmandu Carry-All" });
  await carryAll.getByRole("button", { name: "Quick add Kathmandu Carry-All to cart" }).click();
  await expect(carryAll.getByRole("status")).toHaveText("Sign in to add this item.");

  const soldOut = page.locator("article").filter({ hasText: "Tempo Everyday Tee" });
  await expect(soldOut.getByRole("button", { name: "Tempo Everyday Tee is sold out" })).toBeDisabled();

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Quick Add Shopper");
  await page.getByLabel("Email").fill(`quick-add-${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("safe-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/products");
  const authenticatedCard = page.locator("article").filter({ hasText: "Kathmandu Carry-All" });
  await authenticatedCard.getByRole("button", { name: "Quick add Kathmandu Carry-All to cart" }).click();
  await expect(authenticatedCard.getByRole("status")).toHaveText("Added to cart.");
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Kathmandu Carry-All" })).toBeVisible();
});
