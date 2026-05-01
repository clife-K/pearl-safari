const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, BookingStatus, PaymentStatus, CurrencyCode } = require("@prisma/client");

dotenv.config();

const { resolveDatabaseUrl } = require("./resolve-database-url.cjs");
const databaseUrl = resolveDatabaseUrl();
const staticOnlyMode = !databaseUrl && process.env.STATIC_ONLY === "1";

if (!databaseUrl && !staticOnlyMode) {
    console.error(
        "[Startup] DATABASE_URL is missing. Add it to .env or Railway variables.",
        "\n          UI-only preview: set STATIC_ONLY=1 (no login, bookings, or admin until Postgres is wired).",
        "\n          Railway: reference Postgres DATABASE_URL on your web service.",
    );
    process.exit(1);
}

if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
}

const app = express();
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

let pool = null;
let prisma = null;
if (!staticOnlyMode) {
    pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
}

// ═══════════════ MIDDLEWARE ═══════════════
// Supports one or many origins via FRONTEND_URL (comma-separated).
const allowedOrigins = (process.env.FRONTEND_URL ||
        "http://localhost:3000,http://localhost:5000,http://127.0.0.1:5000," +
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const railwayPublic = process.env.RAILWAY_PUBLIC_DOMAIN;
if (railwayPublic) {
    const root = railwayPublic.includes("://") ? railwayPublic : `https://${railwayPublic}`;
    if (!allowedOrigins.includes(root)) {
        allowedOrigins.push(root);
    }
}

const corsReflectAny = process.env.CORS_RELAXED === "1";
app.use(cors({
    origin: corsReflectAny
        ? true
        : (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(null, false);
        },
    credentials: true,
}));
app.use(express.json());

const FRONTEND_DIR = path.join(__dirname, "../frontend");
if (!fs.existsSync(FRONTEND_DIR)) {
    console.error(
        "[Startup] Frontend folder not found at",
        FRONTEND_DIR,
        "— run the server from the backend folder with frontend/ next to backend/, or check your deploy COPY paths.",
    );
    process.exit(1);
}
const indexPath = path.join(FRONTEND_DIR, "index.html");
if (!fs.existsSync(indexPath)) {
    console.error("[Startup] Missing", indexPath, "— static site will not load.");
    process.exit(1);
}

app.locals.prisma = prisma;
app.locals.staticOnly = staticOnlyMode;
app.locals.JWT_SECRET = process.env.JWT_SECRET || "replace-me";

if (staticOnlyMode) {
    console.warn(
        "[Startup] STATIC_ONLY mode — HTML/CSS loads; GET /api/packages and /api/destinations return empty lists;",
        "\n          other API routes return 503 until DATABASE_URL is set.",
    );
}

// ═══════════════ ROUTES SETUP ═══════════════
// Import admin routes
const adminRoutes = require("./routes/admin");

const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

// ═══════════════ CONFIG ENDPOINT ═══════════════
app.get("/api/config", (req, res) => {
    const xfProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim();
    const xfHost = (req.get("x-forwarded-host") || "").split(",")[0].trim();
    let proto = xfProto || req.protocol || "http";
    if (proto !== "http" && proto !== "https") {
        proto = process.env.NODE_ENV === "production" ? "https" : req.protocol || "http";
    }
    const host = xfHost || req.get("host") || "localhost";

    return res.json({
        apiUrl: `${proto}://${host}/api`,
        environment: process.env.NODE_ENV || "development",
        staticOnly: staticOnlyMode,
    });
});

function authRequired(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Missing auth token." });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}

app.get("/api/health", async(req, res) => {
    if (staticOnlyMode) {
        return res.json({
            ok: true,
            database: false,
            staticOnly: true,
            message: "Serving frontend only; set DATABASE_URL for full API.",
        });
    }
    try {
        await prisma.$queryRaw `SELECT 1`;
        return res.json({ ok: true, database: true, message: "Backend and database are running." });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Database connection failed.",
            error: error.message,
        });
    }
});

if (staticOnlyMode) {
    app.get("/api/packages", (_req, res) => res.json({ packages: [] }));
    app.get("/api/destinations", (_req, res) => res.json({ destinations: [] }));
    app.use("/api", (req, res) => {
        if (req.method === "OPTIONS") {
            return res.sendStatus(204);
        }
        return res.status(503).json({
            message: "Database not configured. Add DATABASE_URL and restart without STATIC_ONLY.",
            staticOnly: true,
        });
    });
}

if (!staticOnlyMode) {

app.post("/api/auth/signup", async(req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "fullName, email, and password are required." });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { fullName, email, phone: phone || null, passwordHash },
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
            message: "Account created.",
            token,
            user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
        });
    } catch (error) {
        return res.status(500).json({ message: "Signup failed.", error: error.message });
    }
});

app.post("/api/auth/login", async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required." });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });
        return res.json({
            message: "Login successful.",
            token,
            user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
        });
    } catch (error) {
        return res.status(500).json({ message: "Login failed.", error: error.message });
    }
});

app.post("/api/bookings", authRequired, async(req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            nationality,
            specialRequests,
            paymentMethod,
            totalAmount,
            destinationId,
            tourPackageId,
            travelDate,
            adults,
            children,
            subtotalAmount,
            discountAmount,
            taxAmount,
            currency,
        } = req.body;

        if (!firstName || !lastName || !email || !phone || !paymentMethod || !totalAmount) {
            return res.status(400).json({ message: "Missing required booking fields." });
        }

        const booking = await prisma.booking.create({
            data: {
                userId: req.user.userId,
                firstName,
                lastName,
                email,
                phone,
                nationality: nationality || null,
                specialRequests: specialRequests || null,
                paymentMethod,
                totalAmount: Number(totalAmount),
                destinationId: destinationId ? Number(destinationId) : null,
                tourPackageId: tourPackageId ? Number(tourPackageId) : null,
                travelDate: travelDate ? new Date(travelDate) : null,
                adults: adults ? Number(adults) : 1,
                children: children ? Number(children) : 0,
                subtotalAmount: subtotalAmount ? Number(subtotalAmount) : null,
                discountAmount: discountAmount ? Number(discountAmount) : null,
                taxAmount: taxAmount ? Number(taxAmount) : null,
                currency: currency === CurrencyCode.UGX ? CurrencyCode.UGX : CurrencyCode.USD,
                status: BookingStatus.PENDING,
            },
            include: {
                destination: true,
                tourPackage: true,
            },
        });

        return res.status(201).json({
            message: "Booking created.",
            booking: {
                ...booking,
                reference: booking.bookingReference,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Could not create booking.", error: error.message });
    }
});

app.get("/api/bookings/me", authRequired, async(req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user.userId },
            include: {
                payments: true,
                destination: true,
                tourPackage: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return res.json({ bookings });
    } catch (error) {
        return res.status(500).json({ message: "Could not load bookings.", error: error.message });
    }
});

app.post("/api/bookings/:bookingId/payments", authRequired, async(req, res) => {
    try {
        const bookingId = Number(req.params.bookingId);
        const { amount, method, reference, currency, transactionRef } = req.body;

        if (!bookingId || !amount || !method) {
            return res.status(400).json({ message: "bookingId, amount, and method are required." });
        }

        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, userId: req.user.userId },
        });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const rawRef = typeof transactionRef === "string" ? transactionRef.trim() : "";
        const uniqueTransactionRef = rawRef
            ? `${bookingId}-${Date.now()}-${rawRef.replace(/\s+/g, " ").slice(0, 72)}`
            : null;

        const payment = await prisma.payment.create({
            data: {
                bookingId,
                amount: Number(amount),
                method,
                status: PaymentStatus.PENDING,
                currency: currency === CurrencyCode.UGX ? CurrencyCode.UGX : CurrencyCode.USD,
                transactionRef: uniqueTransactionRef,
                reference: reference || `PAY-${Date.now()}`,
                paidAt: null,
            },
        });

        return res.status(201).json({
            message: "Payment notice recorded. Our team will verify your payment and confirm the booking.",
            payment,
        });
    } catch (error) {
        return res.status(500).json({ message: "Could not save payment.", error: error.message });
    }
});

app.get("/api/destinations", async(req, res) => {
    try {
        const destinations = await prisma.destination.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        });
        return res.json({ destinations });
    } catch (error) {
        return res.status(500).json({ message: "Could not load destinations.", error: error.message });
    }
});

app.get("/api/packages", async(req, res) => {
    try {
        const packages = await prisma.tourPackage.findMany({
            where: { isPublished: true },
            include: { destination: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ packages });
    } catch (error) {
        return res.status(500).json({ message: "Could not load packages.", error: error.message });
    }
});

// ═══════════════ CONTACT/MESSAGE ENDPOINT ═══════════════
app.post("/api/contacts", async(req, res) => {
    try {
        const { fullName, email, phone, subject, message } = req.body;

        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({ message: "fullName, email, subject, and message are required." });
        }

        const contact = await prisma.contact.create({
            data: {
                fullName,
                email,
                phone: phone || null,
                subject,
                message,
                isRead: false
            }
        });

        return res.status(201).json({
            message: "Message received. We'll get back to you soon.",
            contact
        });
    } catch (error) {
        return res.status(500).json({ message: "Could not save message.", error: error.message });
    }
});

// ═══════════════ ADMIN ROUTES ═══════════════
app.use("/api/admin", adminRoutes);

} // end !staticOnlyMode

// Home page explicitly (reliable behind proxies / Express 5 static edge cases)
app.get("/", (_req, res) => {
    res.sendFile(indexPath);
});

// Static site (after /api routes)
app.use(express.static(FRONTEND_DIR));

app.use((req, res) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "Route not found." });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
        return res.status(404).type("text").send("Not found");
    }
    // Clean URLs: /packages → packages.html (only one path segment, no dots — avoids /images/x.jpg → images.html)
    const parts = req.path.replace(/^\//, "").split("/").filter(Boolean);
    if (parts.length !== 1 || parts[0].includes("..") || parts[0].includes(".")) {
        return res.status(404).type("text").send("Not found");
    }
    const htmlPath = path.join(FRONTEND_DIR, `${parts[0]}.html`);
    const resolved = path.resolve(htmlPath);
    const rootResolved = path.resolve(FRONTEND_DIR);
    const underRoot =
        resolved === rootResolved ||
        resolved.toLowerCase().startsWith(rootResolved.toLowerCase() + path.sep);
    if (!underRoot) {
        return res.status(404).type("text").send("Not found");
    }
    if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
    }
    return res.status(404).type("text").send("Not found");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server http://localhost:${PORT}`);
    console.log(`Serving pages from ${FRONTEND_DIR}`);
});