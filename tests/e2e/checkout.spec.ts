import { expect, test, type Page } from "@playwright/test";
import { signEsewaMessage } from "../../lib/esewa";

test.describe.configure({ mode: "serial" });
test.setTimeout(300_000);

async function prepareCheckout(page: Page) {
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("Recipient name").fill("Suraj Shrestha");
  await page.getByLabel("Nepal mobile number").fill("9841234567");
  await page.getByLabel("Province").fill("Bagmati");
  await page.getByLabel("District").fill("Kathmandu");
  await page.getByLabel("Municipality").fill("Kathmandu Metropolitan City");
  await page.getByLabel("Ward").fill("10");
  await page.getByLabel("Street address").fill("New Baneshwor");
}

async function fillCheckout(page: Page) {
  await prepareCheckout(page);
  await page.getByRole("button", { name: "Reserve and continue to eSewa" }).click();
  await expect(page.getByRole("heading", { name: "Inventory reserved." })).toBeVisible({ timeout: 30_000 });
  const context = (await page.getByText(/Order CHK-\d{4}-\d+/).textContent())!;
  return context.match(/CHK-\d{4}-\d+/)?.[0] ?? "";
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD ?? "demo-password-for-tests");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

async function switchIdentity(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name: "Browse the demo" });
  if (!(await dialog.isVisible())) await page.getByRole("button", { name: "Demo", exact: true }).click();
  const switched = page.waitForResponse((response) => response.url().includes("/api/demo/session") && response.request().method() === "POST");
  await dialog.getByRole("button", { name: new RegExp(name) }).click();
  expect((await switched).ok()).toBe(true);
}

async function restoreCanonicalDemo(page: Page) {
  await page.goto("/");
  await switchIdentity(page, "Nirmal");
  const response = await page.request.post("/api/demo/reset", {
    data: { confirmation: "RESET" },
  });
  expect(response.ok()).toBe(true);
}

async function failCurrentPayment(page: Page) {
  const transactionUuid = await page.locator('input[name="transaction_uuid"]').inputValue();
  const totalAmount = await page.locator('input[name="total_amount"]').inputValue();
  const successUrl = await page.locator('input[name="success_url"]').inputValue();
  const failureUrl = await page.locator('input[name="failure_url"]').inputValue();
  const payload = {
    transaction_code: "MOCK-DECLINED",
    status: "PENDING",
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: "EPAYTEST",
    signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
  };
  const message = payload.signed_field_names.split(",").map((field) => `${field}=${payload[field as keyof typeof payload]}`).join(",");
  const data = Buffer.from(JSON.stringify({ ...payload, signature: signEsewaMessage(message, "test-only-esewa-secret") })).toString("base64");
  const callbackUrl = new URL(successUrl);
  callbackUrl.searchParams.set("data", data);
  await page.goto(callbackUrl.toString());
  return failureUrl;
}

test("customer cancellation and administrator refund workflows remain auditable", async ({ page }) => {
  await restoreCanonicalDemo(page);
  await switchIdentity(page, "Suraj");

  await page.goto("/cart");
  await fillCheckout(page);
  const failureUrl = await failCurrentPayment(page);
  await expect(page.getByRole("heading", { name: "Pending", exact: true })).toBeVisible();
  await expect(page.getByText("eSewa has not confirmed the payment yet.")).toBeVisible();
  await page.getByRole("button", { name: "Check payment status" }).click();
  await expect(page).toHaveURL(/payment=pending/);
  await page.goto(failureUrl);
  await expect(page.getByRole("heading", { name: "Pending", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/payment=pending/);
  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByRole("heading", { name: "Cancelled", exact: true })).toBeVisible();
  await expect(page.getByText("Customer cancelled the unpaid order.")).toBeVisible();

  await page.goto("/cart");
  const paidNumber = await fillCheckout(page);
  await page.getByRole("button", { name: "Continue to eSewa" }).click();
  await expect(page).toHaveURL(/\/orders\/.+payment=success/);
  await expect(page.getByRole("heading", { name: "Paid", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Request cancellation" }).click();
  await expect(page.getByRole("status").filter({ hasText: "manual refund is pending" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Refund pending", exact: true })).toBeVisible();

  await switchIdentity(page, "Nirmal");
  await page.goto("/admin/orders");
  await page.getByLabel("Order or customer").fill(paidNumber);
  await page.getByLabel("Fulfillment status").selectOption("REFUND_PENDING");
  await page.getByRole("button", { name: "Find orders" }).click();
  await expect(page.getByRole("cell", { name: paidNumber })).toBeVisible();
  await page.getByRole("link", { name: "Open" }).click();
  await page.getByRole("button", { name: "Confirm manual refund" }).click();
  await expect(page.getByRole("heading", { name: "Refunded", exact: true })).toBeVisible();
  await expect(page.getByText("Administrator confirmed the manual refund and restored inventory.")).toBeVisible();

  await switchIdentity(page, "Suraj");
  await page.goto("/orders");
  const refundedOrder = page.getByRole("listitem").filter({ hasText: paidNumber });
  await expect(refundedOrder).toContainText("Refunded");
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("competing shoppers cannot reserve the final unit and the winner can be fulfilled", async ({ page, browser }) => {
  await restoreCanonicalDemo(page);
  await page.goto("/admin/products");
  const carryAll = page.getByRole("listitem").filter({ hasText: "Kathmandu Carry-All" });
  await carryAll.getByRole("link", { name: "Edit & inventory" }).click();
  await page.getByLabel("Signed amount").fill("-11");
  await page.getByLabel("Reason").fill("Final-stock browser competition");
  await page.getByRole("button", { name: "Adjust stock" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Stock adjusted" })).toHaveText("Stock adjusted to 1.");

  const surajContext = await browser.newContext();
  const aadarshContext = await browser.newContext();
  const suraj = await surajContext.newPage();
  const aadarsh = await aadarshContext.newPage();
  await Promise.all([signIn(suraj, "suraj@demo.chauk.local"), signIn(aadarsh, "aadarsh@demo.chauk.local")]);
  await suraj.goto("/cart");
  const flask = suraj.getByRole("listitem").filter({ hasText: "Trail Flask" });
  await flask.getByRole("button", { name: "Remove" }).click();
  await aadarsh.goto("/products/kathmandu-carry-all");
  await aadarsh.getByRole("button", { name: "Add to cart" }).click();
  await Promise.all([suraj.goto("/cart"), aadarsh.goto("/cart")]);
  await Promise.all([prepareCheckout(suraj), prepareCheckout(aadarsh)]);
  await Promise.all([
    suraj.getByRole("button", { name: "Reserve and continue to eSewa" }).click(),
    aadarsh.getByRole("button", { name: "Reserve and continue to eSewa" }).click(),
  ]);
  await expect.poll(() => [suraj.url(), aadarsh.url()].filter((url) => url.includes("/checkout/pay/")).length).toBe(1);
  const winner = suraj.url().includes("/checkout/pay/") ? suraj : aadarsh;
  const loser = winner === suraj ? aadarsh : suraj;
  await expect(winner.getByRole("heading", { name: "Inventory reserved." })).toBeVisible();
  await expect(loser.getByRole("status")).toContainText("not enough available stock");
  const orderNumber = (await winner.getByText(/^CHK-\d{4}-\d+$/).textContent())!;
  await winner.getByRole("button", { name: "Continue to eSewa" }).click();
  await expect(winner.getByRole("heading", { name: "Paid", exact: true })).toBeVisible();

  await page.goto(`/admin/orders?q=${encodeURIComponent(orderNumber)}`);
  await page.getByRole("link", { name: "Open" }).click();
  await page.getByRole("button", { name: "Mark shipped" }).click();
  await expect(page.getByRole("heading", { name: "Shipped", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark delivered" }).click();
  await expect(page.getByRole("heading", { name: "Delivered", exact: true })).toBeVisible();
  await expect(page.getByText("No administrative transition is available.")).toBeVisible();
  await surajContext.close();
  await aadarshContext.close();
});
