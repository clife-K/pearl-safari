const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { resolveDatabaseUrl } = require("./resolve-database-url.cjs");

dotenv.config();

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
}
process.env.DATABASE_URL = databaseUrl;

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function createAdmin() {
    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: "admin@pearlsafari.ug" },
        });

        if (existingAdmin) {
            console.log("✅ Admin user already exists");
            process.exit(0);
        }

        const adminUser = await prisma.user.create({
            data: {
                fullName: "Admin User",
                email: "admin@pearlsafari.ug",
                phone: "+256700000000",
                passwordHash: await bcrypt.hash("admin123", 10),
                role: "ADMIN",
                isActive: true,
            },
        });

        console.log("✅ Admin created successfully:", adminUser.email);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin:", error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

createAdmin();
