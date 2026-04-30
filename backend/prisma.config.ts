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

const resolvedDb = resolveDatabaseUrl();

// Allow `prisma generate` / `validate` without a live DB URL (fresh clone, Docker build npm postinstall).
// `migrate deploy`, server boot, studio, seed still require a REAL `DATABASE_URL` (handled below).
const cliText = process.argv.join(" ");
const lifecycle = process.env.npm_lifecycle_event || "";
const allowDatasourceStub =
    lifecycle === "postinstall" ||
    /\bgenerate\b/.test(cliText) ||
    /\bvalidate\b/.test(cliText) ||
    /\bformat\b/.test(cliText);

const STUB_DATABASE_URL =
    "postgresql://prisma:stub@127.0.0.1:5432/__prisma_client_generation_only__";

let databaseUrl = resolvedDb ?? null;
if (!databaseUrl && allowDatasourceStub) {
    databaseUrl = STUB_DATABASE_URL;
}

if (!databaseUrl) {
    const postgresRelatedKeys = Object.keys(process.env)
        .filter(
            (k) =>
                /^(DATABASE|PG|POSTGRES|NEON|SQLPOOL)/i.test(k) ||
                (k.includes("PRISMA") && k.includes("URL")),
        )
        .sort();
    const suffix =
        postgresRelatedKeys.length > 0
            ? ` This container does have some DB-related keys: ${postgresRelatedKeys.join(", ")}.`
            : " This container has no DATABASE_URL / PG* / POSTGRES* keys — Postgres is not wired to THIS service.";
    throw new Error(
        `DATABASE_URL missing on your WEB service.${suffix} In Railway Web service Variables, add DATABASE_URL as a Reference to Postgres (repo file railway-web-vars.txt has an example line).`,
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
