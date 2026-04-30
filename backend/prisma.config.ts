import dotenv from "dotenv";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const require = createRequire(import.meta.url);
const { resolveDatabaseUrl } = require("./resolve-database-url.cjs");

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, ".env");

// Local dev: load `.env`. Production (Railway): env is injected — link Postgres vars to your web service.
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
}

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is not available. In Railway: select your Postgres service → use “Variable Reference” to expose DATABASE_PUBLIC_URL or DATABASE_URL to your web service (or paste DATABASE_URL under the web app Variables tab).",
    );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
