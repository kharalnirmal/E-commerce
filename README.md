# CHOWK

**A full-stack commerce platform for independent makers in Nepal and beyond.**

[View the live store](https://e-commerce-brown-nu-98.vercel.app) | [Source code](https://github.com/kharalnirmal/E-commerce)

CHOWK combines an editorial storefront with catalog discovery, account-based shopping, inventory-aware checkout, eSewa payments, order tracking, and a protected administration workspace. It is built with Next.js App Router, React, PostgreSQL, Prisma ORM, and Better Auth.

## Features

### Storefront

- Responsive editorial home page with featured, recent, trending, and recommended products
- Product catalog with search, category filtering, sorting, and empty states
- Global product search with live suggestions and keyboard-friendly navigation
- Product detail pages with image galleries and availability information
- Light and dark themes with reduced-motion support

### Commerce

- Email and password authentication through Better Auth
- Account-scoped cart and quick-add flows
- Nepal-focused delivery address collection
- Server-calculated NPR totals and delivery fees
- Inventory reservations during payment to prevent overselling
- eSewa mock, UAT, and production gateway modes
- Signed callback validation and server-side payment status verification
- Customer order history, payment retry, and order timelines

### Administration

- Role-protected admin workspace
- Product and category creation, editing, archiving, and merchandising
- Product galleries, featured placement, and low-stock thresholds
- Auditable inventory adjustments
- Order search, status filtering, fulfillment, and refund workflows
- Payment audit history and order status timelines

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 and application-level CSS tokens |
| Database | PostgreSQL |
| ORM | Prisma ORM 7 with the PostgreSQL driver adapter |
| Authentication | Better Auth with Prisma adapter |
| Payments | eSewa ePay |
| Testing | Vitest and Playwright |
| Deployment | Vercel |

## Architecture

```text
Browser
  |
  v
Next.js App Router
  |-- Server Components and Server Actions
  |-- Route Handlers for auth, search, images, and payment callbacks
  |-- Better Auth session and role checks
  |
  v
Prisma ORM + PostgreSQL
  |-- Catalog and inventory
  |-- Carts, orders, and reservations
  |-- Payments and audit timelines
  |
  v
eSewa hosted checkout
```

Payment success is not trusted from the browser alone. CHOWK verifies callback identity, amount, merchant code, transaction status, and signature before fulfilling an order. Inventory is reserved for ten minutes while payment is pending.

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL
- eSewa merchant credentials for hosted UAT or production payments

## Local Setup

1. Clone the repository.

   ```bash
   git clone https://github.com/kharalnirmal/E-commerce.git
   cd E-commerce
   ```

2. Install exact dependency versions.

   ```bash
   npm ci
   ```

3. Create a `.env` file in the project root.

   ```dotenv
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chowk"
   BETTER_AUTH_SECRET="replace-with-a-random-secret-at-least-32-characters"
   BETTER_AUTH_URL="http://localhost:3000"
   APP_URL="http://localhost:3000"
   ESEWA_GATEWAY_MODE="mock"
   DEMO_MODE="false"
   ```

4. Apply the database migrations and generate Prisma Client.

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Seed the catalog.

   ```bash
   npm run seed
   ```

6. Start the development server.

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL used by Prisma and the application |
| `BETTER_AUTH_SECRET` | Yes | Random secret of at least 32 characters used by Better Auth |
| `BETTER_AUTH_URL` | Yes | Public application origin used by Better Auth |
| `APP_URL` | Yes | Application origin used to build payment callback URLs |
| `ESEWA_GATEWAY_MODE` | Yes | Payment mode: `mock`, `uat`, or `production` |
| `ESEWA_PRODUCT_CODE` | Hosted modes | Merchant product code issued by eSewa |
| `ESEWA_SECRET` | Hosted modes | eSewa signing secret; never expose it to the browser |
| `ESEWA_PAYMENT_URL` | Hosted modes | Hosted eSewa payment endpoint |
| `ESEWA_STATUS_URL` | Hosted modes | eSewa transaction status endpoint |
| `DEMO_MODE` | No | Enables seeded demo identities and the demo control panel when set to `true` |
| `DEMO_PASSWORD` | Demo only | Shared demo password; must contain at least eight characters |
| `TEST_DATABASE_URL` | Database tests | Isolated PostgreSQL database or schema ending in `_test` |

Generate a production authentication secret with a cryptographically secure tool, for example:

```bash
openssl rand -base64 32
```

Never commit `.env` files or production credentials.

## Payment Modes

### Mock

`ESEWA_GATEWAY_MODE=mock` uses the internal deterministic payment route. It makes no external gateway requests and is intended only for local development and automated tests.

### UAT

`ESEWA_GATEWAY_MODE=uat` uses eSewa's hosted sandbox. Configure sandbox credentials, the current UAT payment and status endpoints, and a public HTTPS `APP_URL` that eSewa can reach.

### Production

`ESEWA_GATEWAY_MODE=production` requires production merchant credentials, production eSewa endpoints, and a public HTTPS application URL. The application rejects endpoint hosts that do not match the selected gateway environment.

Use the current values issued in the official eSewa merchant documentation. Do not reuse sandbox credentials in production.

## Demo Mode

Demo mode provides three seeded personas: one administrator and two shoppers. To enable it locally:

```dotenv
DEMO_MODE="true"
DEMO_PASSWORD="a-demo-password-with-at-least-eight-characters"
```

Run `npm run seed` after enabling demo mode. Leave `DEMO_MODE` unset or set it to `false` in a normal production deployment.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma Client and create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the Vitest server test suite |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:db:prepare` | Reset, migrate, and seed the isolated test database |
| `npm run seed` | Seed the catalog and optional demo data |

## Testing

Run the fast checks:

```bash
npm run lint
npm run typecheck
npm test
```

Install Playwright's Chromium browser once, then run the browser suite:

```bash
npx playwright install chromium
npm run test:e2e
```

Database integration and browser tests must use an isolated database. Start from `.env.test.example`, export those values in the test environment, and run:

```bash
npm run test:db:prepare
```

`test:db:prepare` destroys and recreates its target. As a safeguard, it refuses any database or schema whose name does not end in `_test`. Never point `TEST_DATABASE_URL` at development or production data.

## Production Deployment

The reference deployment runs on [Vercel](https://vercel.com), but the application can run on any Node.js platform with PostgreSQL and HTTPS.

1. Provision a production PostgreSQL database.
2. Configure all required environment variables in the hosting platform.
3. Set `APP_URL` and `BETTER_AUTH_URL` to the final HTTPS origin.
4. Set `DEMO_MODE=false` unless the deployment is intentionally public demo data.
5. Apply migrations as a release step:

   ```bash
   npx prisma migrate deploy
   ```

6. Build and start the application:

   ```bash
   npm run build
   npm run start
   ```

For Vercel, `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are automatically included as trusted authentication origins. Add the production domain to the repository website field and ensure eSewa callback URLs use the same canonical origin.

## Project Structure

```text
app/                 Routes, layouts, components, actions, and API handlers
generated/prisma/    Generated Prisma Client output; not committed
lib/                 Auth, catalog, checkout, inventory, orders, and payments
prisma/              Database schema, migrations, and seed data
scripts/             Test database preparation
tests/e2e/           Playwright storefront and checkout scenarios
tests/server/        Vitest unit and database integration tests
```

## Security Notes

- Admin routes require an authenticated user with the `ADMIN` role.
- Prices, delivery fees, stock, and order totals are calculated on the server.
- Inventory changes and order transitions are recorded for auditability.
- Payment fulfillment requires server-side eSewa verification.
- Stored remote HTTP catalog images are served through a restricted same-origin proxy.
- Secrets and database URLs must remain server-only and must never use a `NEXT_PUBLIC_` prefix.

## Repository

- Live application: [e-commerce-brown-nu-98.vercel.app](https://e-commerce-brown-nu-98.vercel.app)
- Source: [github.com/kharalnirmal/E-commerce](https://github.com/kharalnirmal/E-commerce)
- Default branch: `master`
