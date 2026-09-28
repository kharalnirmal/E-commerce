This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### School demo mode

Set `DEMO_MODE=true` and provide a `DEMO_PASSWORD` of at least eight characters to enable the bottom-right DevUI and shared Nirmal, Suraj, and Aadarsh identities. Leave `DEMO_MODE` unset or set it to any value other than `true` to remove all demo login and reset behavior. Run `npm run seed` after enabling demo mode to create the canonical personas and activity.

### eSewa checkout

Set `ESEWA_GATEWAY_MODE` explicitly to `mock`, `uat`, or `production`.

- `mock` posts to CHOWK's internal deterministic test route and performs no gateway network calls. Use it for automated tests only.
- `uat` submits to eSewa's genuine hosted UAT form and status endpoints.
- `production` submits to eSewa's production form and status endpoints and rejects UAT endpoint hosts.

Hosted modes require `APP_URL`, `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET`, `ESEWA_PAYMENT_URL`, and `ESEWA_STATUS_URL`. `APP_URL` must be the public HTTPS origin that eSewa can return to. Use eSewa's current merchant documentation for issued credentials and endpoint values; do not reuse UAT credentials in production.

#### Manual UAT acceptance

Run this pass locally through a public HTTPS tunnel and repeat it against the deployed demo:

1. Configure `ESEWA_GATEWAY_MODE=uat`, the sandbox product code and secret, eSewa's hosted UAT form/status URLs, and the public `APP_URL`.
2. Add an in-stock product, complete checkout, and confirm the handoff shows the order, amount, reservation deadline, and `eSewa UAT` destination.
3. Select **Continue to eSewa** and confirm the browser opens eSewa's hosted test interface, not a CHOWK imitation or the internal mock route.
4. Complete a sandbox payment and confirm the return shows a verified paid order, decrements stock once, clears the purchaser's unchanged cart items, and records one payment timeline event.
5. Repeat with a cancelled or pending sandbox attempt. Confirm the order remains pending until eSewa reports a terminal result, and use **Check payment status** from the owned order page.
6. Tamper with a copied callback amount or signature and confirm CHOWK shows verification-failure guidance without fulfilling the order.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
