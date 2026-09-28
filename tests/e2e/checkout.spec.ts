import { expect, test } from "@playwright/test";

test("authenticated shopper completes verified mock eSewa checkout", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("suraj@demo.chauk.local");
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD ?? "demo-password-for-tests");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/cart");
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("Recipient name").fill("Suraj Shrestha");
  await page.getByLabel("Nepal mobile number").fill("9841234567");
  await page.getByLabel("Province").fill("Bagmati");
  await page.getByLabel("District").fill("Kathmandu");
  await page.getByLabel("Municipality").fill("Kathmandu Metropolitan City");
  await page.getByLabel("Ward").fill("10");
  await page.getByLabel("Street address").fill("New Baneshwor");
  await page.getByRole("button", { name: "Reserve and continue to eSewa" }).click();
  await expect(page.getByRole("heading", { name: "Inventory reserved." })).toBeVisible();
  await page.getByRole("button", { name: "Continue to eSewa" }).click();
  await expect(page).toHaveURL(/\/orders\/.+payment=success/);
  await expect(page.getByRole("heading", { name: "PAID" })).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});
