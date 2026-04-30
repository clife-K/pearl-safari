const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, BookingStatus, PaymentStatus, CurrencyCode } = require("@prisma/client");

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ═══════════════ MIDDLEWARE ═══════════════
// Supports one or many origins via FRONTEND_URL (comma-separated).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server requests and tools with no Origin header.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Store prisma and JWT_SECRET in app.locals for admin routes
app.locals.prisma = prisma;
app.locals.JWT_SECRET = process.env.JWT_SECRET || "replace-me";

// ═══════════════ ROUTES SETUP ═══════════════
// Import admin routes
const adminRoutes = require("./routes/admin");

const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

// ═══════════════ CONFIG ENDPOINT ═══════════════
app.get("/api/config", (req, res) => {
    return res.json({
        apiUrl: `http${process.env.NODE_ENV === 'production' ? 's' : ''}://${req.get('host')}/api`,
        environment: process.env.NODE_ENV || 'development'
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
    try {
        await prisma.$queryRaw `SELECT 1`;
        return res.json({ ok: true, message: "Backend and database are running." });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Database connection failed.",
            error: error.message,
        });
    }
});

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

        const payment = await prisma.payment.create({
            data: {
                bookingId,
                amount: Number(amount),
                method,
                status: PaymentStatus.PAID,
                currency: currency === CurrencyCode.UGX ? CurrencyCode.UGX : CurrencyCode.USD,
                transactionRef: transactionRef || null,
                reference: reference || `PAY-${Date.now()}`,
                paidAt: new Date(),
            },
        });

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CONFIRMED },
        });

        return res.status(201).json({ message: "Payment saved. Booking confirmed.", payment });
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

app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});