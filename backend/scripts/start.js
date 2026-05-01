"use strict";

/**
 * Production: runs prisma migrate deploy then server.
 * Local troubleshooting: set SKIP_MIGRATE=1 to start without migrating (DB must already match schema).
 */
const { spawnSync } = require("child_process");
const path = require("path");

const backendRoot = path.join(__dirname, "..");
const skipMigrate =
    process.env.SKIP_MIGRATE === "1" ||
    process.env.SKIP_PRISMA_MIGRATE === "1" ||
    process.env.STATIC_ONLY === "1";

if (!skipMigrate) {
    const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
        cwd: backendRoot,
        stdio: "inherit",
        shell: true,
    });
    if (result.status !== 0) {
        console.error(
            "\n[start] prisma migrate deploy failed. Fix DATABASE_URL / Postgres, run migrations manually,",
            "\n       or:  SKIP_MIGRATE=1  npm start   |   UI without DB:  STATIC_ONLY=1  npm start",
            "\n       (PowerShell:  $env:SKIP_MIGRATE=\"1\"; npm start )\n",
        );
        process.exit(result.status ?? 1);
    }
}

require(path.join(backendRoot, "server.js"));
