import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, ".env");

// Local dev: load `.env`. Production (Railway, Docker): only `process.env` — no `.env` file.
let databaseUrl = process.env.DATABASE_URL;
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    const envFromFile = dotenv.parse(fs.readFileSync(envPath));
    databaseUrl = envFromFile.DATABASE_URL || process.env.DATABASE_URL;
}

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is missing. Attach PostgreSQL in Railway or set DATABASE_URL.",
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
