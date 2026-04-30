"use strict";

/**
 * Railway/Docker inject database settings as env vars. If `DATABASE_URL` is not on the web
 * service (common when Postgres is not referenced), fall back to `DATABASE_PUBLIC_URL` or
 * standard `PG*` / `POSTGRES_*` vars.
 */
function resolveDatabaseUrl() {
    const direct =
        process.env.DATABASE_URL ||
        process.env.DATABASE_PUBLIC_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_DATABASE_URL ||
        process.env.NEON_DATABASE_URL ||
        process.env.SHADOW_DATABASE_URL;
    if (direct && direct.trim()) {
        return direct.trim();
    }

    const host =
        process.env.PGHOST ||
        process.env.POSTGRES_HOSTNAME ||
        process.env.POSTGRES_HOST ||
        "";

    const user =
        process.env.PGUSER ||
        process.env.POSTGRES_USER ||
        "";
    const password =
        process.env.PGPASSWORD !== undefined ? process.env.PGPASSWORD :
        process.env.POSTGRES_PASSWORD !== undefined ? process.env.POSTGRES_PASSWORD :
        "";
    const database =
        process.env.PGDATABASE ||
        process.env.POSTGRES_DB ||
        process.env.POSTGRES_DATABASE ||
        "";

    const port =
        process.env.PGPORT ||
        process.env.POSTGRES_PORT ||
        "5432";

    if (host && user && database) {
        return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(String(password))}@${host}:${port}/${database}`;
    }

    return null;
}

module.exports = { resolveDatabaseUrl };
