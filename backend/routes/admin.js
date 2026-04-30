// ═══════════════════════════════════════════════════════════════════════════════
// Pearl Safari Uganda - Admin Routes
// All admin endpoints require ADMIN role authentication
// ═══════════════════════════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const { PrismaClient, BookingStatus, PaymentStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

// Initialize Prisma (will be passed from server.js)
let prisma;
let JWT_SECRET;

// Middleware to set prisma and JWT_SECRET
router.use((req, res, next) => {
    prisma = req.app.locals.prisma;
    JWT_SECRET = req.app.locals.JWT_SECRET;
    next();
});

// ═══════════════ ADMIN AUTHENTICATION MIDDLEWARE ═══════════════
const adminRequired = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Missing auth token." });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.role !== "ADMIN") {
            return res.status(403).json({ message: "Unauthorized. Admin access required." });
        }
        req.user = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

// ═══════════════ DASHBOARD ENDPOINTS ═══════════════

/**
 * GET /api/admin/dashboard
 * Returns dashboard statistics
 */
router.get("/dashboard", adminRequired, async (req, res) => {
    try {
        const totalBookings = await prisma.booking.count();
        const totalRevenue = await prisma.payment.aggregate({
            where: { status: "PAID" },
            _sum: { amount: true }
        });
        const totalUsers = await prisma.user.count({ where: { role: "CUSTOMER" } });
        const pendingBookings = await prisma.booking.count({ where: { status: "PENDING" } });
        const unreadMessages = await prisma.contact.count({ where: { isRead: false } });

        const recentBookings = await prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { user: true }
        });

        return res.json({
            stats: {
                totalBookings,
                totalRevenue: totalRevenue._sum.amount || 0,
                totalUsers,
                pendingBookings,
                unreadMessages
            },
            recentBookings
        });
    } catch (error) {
        return res.status(500).json({ message: "Dashboard load failed.", error: error.message });
    }
});

// ═══════════════ BOOKINGS MANAGEMENT ═══════════════

/**
 * GET /api/admin/bookings
 * Returns all bookings with filters
 */
router.get("/bookings", adminRequired, async (req, res) => {
    try {
        const { status, search, skip = 0, take = 10 } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { bookingReference: { contains: search, mode: "insensitive" } }
            ];
        }

        const bookings = await prisma.booking.findMany({
            where: filter,
            include: {
                user: true,
                destination: true,
                tourPackage: true,
                payments: true
            },
            orderBy: { createdAt: "desc" },
            skip: Number(skip),
            take: Number(take)
        });

        const total = await prisma.booking.count({ where: filter });

        return res.json({ bookings, total, page: Number(skip) / Number(take) + 1 });
    } catch (error) {
        return res.status(500).json({ message: "Bookings load failed.", error: error.message });
    }
});

/**
 * GET /api/admin/bookings/:bookingId
 * Returns single booking details
 */
router.get("/bookings/:bookingId", adminRequired, async (req, res) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: Number(req.params.bookingId) },
            include: {
                user: true,
                destination: true,
                tourPackage: true,
                payments: true
            }
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        return res.json(booking);
    } catch (error) {
        return res.status(500).json({ message: "Booking load failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/bookings/:bookingId/status
 * Update booking status
 */
router.put("/bookings/:bookingId/status", adminRequired, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !Object.values(BookingStatus).includes(status)) {
            return res.status(400).json({ message: "Invalid booking status." });
        }

        const booking = await prisma.booking.update({
            where: { id: Number(req.params.bookingId) },
            data: { status }
        });

        return res.json({ message: "Booking status updated.", booking });
    } catch (error) {
        return res.status(500).json({ message: "Status update failed.", error: error.message });
    }
});

/**
 * DELETE /api/admin/bookings/:bookingId
 * Delete booking
 */
router.delete("/bookings/:bookingId", adminRequired, async (req, res) => {
    try {
        const booking = await prisma.booking.delete({
            where: { id: Number(req.params.bookingId) }
        });

        return res.json({ message: "Booking deleted.", booking });
    } catch (error) {
        return res.status(500).json({ message: "Booking deletion failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/bookings/:bookingId/cancel
 * Cancel booking
 */
router.put("/bookings/:bookingId/cancel", adminRequired, async (req, res) => {
    try {
        const booking = await prisma.booking.update({
            where: { id: Number(req.params.bookingId) },
            data: { status: BookingStatus.CANCELLED }
        });

        return res.json({ message: "Booking cancelled.", booking });
    } catch (error) {
        return res.status(500).json({ message: "Cancellation failed.", error: error.message });
    }
});

// ═══════════════ PAYMENTS MANAGEMENT ═══════════════

/**
 * GET /api/admin/payments
 * Returns all payments with filters
 */
router.get("/payments", adminRequired, async (req, res) => {
    try {
        const { status, skip = 0, take = 10 } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }

        const payments = await prisma.payment.findMany({
            where: filter,
            include: {
                booking: { include: { user: true } }
            },
            orderBy: { createdAt: "desc" },
            skip: Number(skip),
            take: Number(take)
        });

        const total = await prisma.payment.count({ where: filter });
        const totalAmount = await prisma.payment.aggregate({
            where: filter,
            _sum: { amount: true }
        });

        return res.json({
            payments,
            total,
            totalAmount: totalAmount._sum.amount || 0,
            page: Number(skip) / Number(take) + 1
        });
    } catch (error) {
        return res.status(500).json({ message: "Payments load failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/payments/:paymentId/status
 * Update payment status
 */
router.put("/payments/:paymentId/status", adminRequired, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !Object.values(PaymentStatus).includes(status)) {
            return res.status(400).json({ message: "Invalid payment status." });
        }

        const payment = await prisma.payment.update({
            where: { id: Number(req.params.paymentId) },
            data: { status, paidAt: status === "PAID" ? new Date() : null }
        });

        return res.json({ message: "Payment status updated.", payment });
    } catch (error) {
        return res.status(500).json({ message: "Status update failed.", error: error.message });
    }
});

/**
 * DELETE /api/admin/payments/:paymentId
 * Delete payment
 */
router.delete("/payments/:paymentId", adminRequired, async (req, res) => {
    try {
        const payment = await prisma.payment.delete({
            where: { id: Number(req.params.paymentId) }
        });

        return res.json({ message: "Payment deleted.", payment });
    } catch (error) {
        return res.status(500).json({ message: "Payment deletion failed.", error: error.message });
    }
});

// ═══════════════ CONTACTS/MESSAGES MANAGEMENT ═══════════════

/**
 * GET /api/admin/contacts
 * Returns all contact messages
 */
router.get("/contacts", adminRequired, async (req, res) => {
    try {
        const { isRead, skip = 0, take = 10 } = req.query;
        const filter = {};

        if (isRead !== undefined) {
            filter.isRead = isRead === "true";
        }

        const contacts = await prisma.contact.findMany({
            where: filter,
            orderBy: { createdAt: "desc" },
            skip: Number(skip),
            take: Number(take)
        });

        const total = await prisma.contact.count({ where: filter });

        return res.json({ contacts, total, page: Number(skip) / Number(take) + 1 });
    } catch (error) {
        return res.status(500).json({ message: "Contacts load failed.", error: error.message });
    }
});

/**
 * GET /api/admin/contacts/:contactId
 * Returns single contact
 */
router.get("/contacts/:contactId", adminRequired, async (req, res) => {
    try {
        const contact = await prisma.contact.update({
            where: { id: Number(req.params.contactId) },
            data: { isRead: true }
        });

        return res.json(contact);
    } catch (error) {
        return res.status(500).json({ message: "Contact load failed.", error: error.message });
    }
});

/**
 * DELETE /api/admin/contacts/:contactId
 * Delete contact message
 */
router.delete("/contacts/:contactId", adminRequired, async (req, res) => {
    try {
        const contact = await prisma.contact.delete({
            where: { id: Number(req.params.contactId) }
        });

        return res.json({ message: "Contact deleted.", contact });
    } catch (error) {
        return res.status(500).json({ message: "Contact deletion failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/contacts/:contactId/read
 * Mark contact as read
 */
router.put("/contacts/:contactId/read", adminRequired, async (req, res) => {
    try {
        const contact = await prisma.contact.update({
            where: { id: Number(req.params.contactId) },
            data: { isRead: true }
        });

        return res.json({ message: "Contact marked as read.", contact });
    } catch (error) {
        return res.status(500).json({ message: "Update failed.", error: error.message });
    }
});

// ═══════════════ USERS MANAGEMENT ═══════════════

/**
 * GET /api/admin/users
 * Returns all users
 */
router.get("/users", adminRequired, async (req, res) => {
    try {
        const { role, search, skip = 0, take = 10 } = req.query;
        const filter = {};

        if (role) {
            filter.role = role;
        }

        if (search) {
            filter.OR = [
                { email: { contains: search, mode: "insensitive" } },
                { fullName: { contains: search, mode: "insensitive" } }
            ];
        }

        const users = await prisma.user.findMany({
            where: filter,
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                _count: { select: { bookings: true } }
            },
            orderBy: { createdAt: "desc" },
            skip: Number(skip),
            take: Number(take)
        });

        const total = await prisma.user.count({ where: filter });

        return res.json({ users, total, page: Number(skip) / Number(take) + 1 });
    } catch (error) {
        return res.status(500).json({ message: "Users load failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 */
router.put("/users/:userId/role", adminRequired, async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ["CUSTOMER", "ADMIN", "STAFF"];

        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role." });
        }

        const user = await prisma.user.update({
            where: { id: Number(req.params.userId) },
            data: { role }
        });

        return res.json({ message: "User role updated.", user });
    } catch (error) {
        return res.status(500).json({ message: "Role update failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/users/:userId/status
 * Activate or deactivate user
 */
router.put("/users/:userId/status", adminRequired, async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await prisma.user.update({
            where: { id: Number(req.params.userId) },
            data: { isActive }
        });

        return res.json({ message: `User ${isActive ? "activated" : "deactivated"}.`, user });
    } catch (error) {
        return res.status(500).json({ message: "Status update failed.", error: error.message });
    }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user account
 */
router.delete("/users/:userId", adminRequired, async (req, res) => {
    try {
        const user = await prisma.user.delete({
            where: { id: Number(req.params.userId) }
        });

        return res.json({ message: "User deleted.", user });
    } catch (error) {
        return res.status(500).json({ message: "User deletion failed.", error: error.message });
    }
});

// ═══════════════ DESTINATIONS & PACKAGES (Admin) ═══════════════

/**
 * GET /api/admin/destinations
 * Returns all destinations (including inactive)
 */
router.get("/destinations", adminRequired, async (req, res) => {
    try {
        const destinations = await prisma.destination.findMany({
            include: {
                packages: true,
                _count: { select: { bookings: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.json(destinations);
    } catch (error) {
        return res.status(500).json({ message: "Destinations load failed.", error: error.message });
    }
});

/**
 * POST /api/admin/destinations
 * Create new destination
 */
router.post("/destinations", adminRequired, async (req, res) => {
    try {
        const { name, slug, region, description, isActive } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: "Name and slug are required." });
        }

        const destination = await prisma.destination.create({
            data: { name, slug, region, description, isActive: isActive ?? true }
        });

        return res.status(201).json({ message: "Destination created.", destination });
    } catch (error) {
        return res.status(500).json({ message: "Creation failed.", error: error.message });
    }
});

/**
 * PUT /api/admin/destinations/:destinationId
 * Update destination
 */
router.put("/destinations/:destinationId", adminRequired, async (req, res) => {
    try {
        const { name, slug, region, description, isActive } = req.body;

        const destination = await prisma.destination.update({
            where: { id: Number(req.params.destinationId) },
            data: { name, slug, region, description, isActive }
        });

        return res.json({ message: "Destination updated.", destination });
    } catch (error) {
        return res.status(500).json({ message: "Update failed.", error: error.message });
    }
});

module.exports = router;
