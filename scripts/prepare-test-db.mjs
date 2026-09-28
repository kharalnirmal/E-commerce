import { spawnSync } from "node:child_process";

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is required.");
}

const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.slice(1).toLowerCase();
const schemaName = parsedUrl.searchParams.get("schema")?.toLowerCase();
const isExplicitTestTarget =
  databaseName.endsWith("_test") || schemaName?.endsWith("_test");

if (!isExplicitTestTarget) {
  throw new Error("Refusing to reset a non-isolated database.");
}

for (const args of [
  ["prisma", "migrate", "reset", "--force"],
  ["prisma", "db", "seed"],
]) {
  const result = spawnSync("npx", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}
