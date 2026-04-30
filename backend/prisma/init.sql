-- ═══════════════════════════════════════════════════════════════════════════════
-- Pearl Safari Uganda - Database Initialization Script
-- PostgreSQL Database Schema for E-commerce Booking System
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create database (run this separately if needed)
-- CREATE DATABASE pearl_safari_uganda;

-- ═══════════════ ENUMS ═══════════════
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'STAFF');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'UGX');

-- ═══════════════ USERS TABLE ═══════════════
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  "fullName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  "passwordHash" VARCHAR(255) NOT NULL,
  role "UserRole" DEFAULT 'CUSTOMER',
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "User_email_idx" ON "User"(email);
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_role_idx" ON "User"(role);

-- ═══════════════ DESTINATIONS TABLE ═══════════════
CREATE TABLE "Destination" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  region VARCHAR(255),
  country VARCHAR(255) DEFAULT 'Uganda',
  description TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Destination_slug_idx" ON "Destination"(slug);
CREATE INDEX "Destination_isActive_idx" ON "Destination"("isActive");

-- ═══════════════ TOUR PACKAGES TABLE ═══════════════
CREATE TABLE "TourPackage" (
  id SERIAL PRIMARY KEY,
  "destinationId" INTEGER REFERENCES "Destination"(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  "durationDays" INTEGER DEFAULT 1,
  "basePrice" DECIMAL(10, 2) NOT NULL,
  currency "CurrencyCode" DEFAULT 'USD',
  "isPublished" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "TourPackage_slug_idx" ON "TourPackage"(slug);
CREATE INDEX "TourPackage_destinationId_idx" ON "TourPackage"("destinationId");
CREATE INDEX "TourPackage_isPublished_idx" ON "TourPackage"("isPublished");

-- ═══════════════ BOOKINGS TABLE ═══════════════
CREATE TABLE "Booking" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "destinationId" INTEGER REFERENCES "Destination"(id) ON DELETE SET NULL,
  "tourPackageId" INTEGER REFERENCES "TourPackage"(id) ON DELETE SET NULL,
  "bookingReference" VARCHAR(255) UNIQUE NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  nationality VARCHAR(100),
  "specialRequests" TEXT,
  "travelDate" TIMESTAMP,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  "paymentMethod" VARCHAR(50) NOT NULL,
  "subtotalAmount" DECIMAL(10, 2),
  "discountAmount" DECIMAL(10, 2),
  "taxAmount" DECIMAL(10, 2),
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  currency "CurrencyCode" DEFAULT 'USD',
  status "BookingStatus" DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Booking_userId_createdAt_idx" ON "Booking"("userId", "createdAt");
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"(status, "createdAt");
CREATE INDEX "Booking_destinationId_idx" ON "Booking"("destinationId");
CREATE INDEX "Booking_tourPackageId_idx" ON "Booking"("tourPackageId");
CREATE INDEX "Booking_bookingReference_idx" ON "Booking"("bookingReference");

-- ═══════════════ PAYMENTS TABLE ═══════════════
CREATE TABLE "Payment" (
  id SERIAL PRIMARY KEY,
  "bookingId" INTEGER NOT NULL REFERENCES "Booking"(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency "CurrencyCode" DEFAULT 'USD',
  method VARCHAR(50) NOT NULL,
  status "PaymentStatus" DEFAULT 'PENDING',
  "transactionRef" VARCHAR(255) UNIQUE,
  reference VARCHAR(255) UNIQUE,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Payment_bookingId_status_idx" ON "Payment"("bookingId", status);
CREATE INDEX "Payment_transactionRef_idx" ON "Payment"("transactionRef");

-- ═══════════════ CONTACTS TABLE (Messages) ═══════════════
CREATE TABLE "Contact" (
  id SERIAL PRIMARY KEY,
  "fullName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Contact_email_idx" ON "Contact"(email);
CREATE INDEX "Contact_isRead_idx" ON "Contact"("isRead");
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

-- ═══════════════ INSERT SAMPLE DATA ═══════════════

-- Insert default destinations
INSERT INTO "Destination" (name, slug, region, description, "isActive") VALUES
('Bwindi Impenetrable National Park', 'bwindi-impenetrable-national-park', 'Western Uganda', 'Home to nearly half the world''s mountain gorillas. A UNESCO World Heritage Site deep in ancient rainforest.', TRUE),
('Murchison Falls National Park', 'murchison-falls-national-park', 'Northern Uganda', 'The world''s most powerful waterfall. Boat cruise to the base, game drives with elephants, lions, and giraffes.', TRUE),
('Jinja - Source of the Nile', 'jinja-source-of-the-nile', 'Eastern Uganda', 'The birthplace of the Nile. Thrilling white-water rafting, bungee jumping, kayaking, and sunset boat rides.', TRUE),
('Queen Elizabeth National Park', 'queen-elizabeth-national-park', 'Western Uganda', 'Famous for tree-climbing lions, the Kazinga channel boat cruise, and incredible biodiversity.', TRUE),
('Lake Bunyonyi', 'lake-bunyonyi', 'Western Uganda', 'Africa''s deepest lake dotted with 29 islands. Perfect for island-hopping, canoeing, and relaxation.', TRUE),
('Kidepo Valley National Park', 'kidepo-valley-national-park', 'Northern Uganda', 'Uganda''s most remote wilderness. Zebras, cheetahs, ostriches, and authentic Karamojong cultural experience.', TRUE);

-- Insert sample tour packages
INSERT INTO "TourPackage" ("destinationId", title, slug, description, "durationDays", "basePrice", currency, "isPublished") VALUES
(1, 'Gorilla Expedition — Bwindi', 'gorilla-expedition-bwindi', 'The ultimate Uganda bucket-list experience. Trek through the ancient Bwindi rainforest to spend an unforgettable hour with a wild mountain gorilla family.', 3, 850.00, 'USD', TRUE),
(2, 'Murchison Falls Safari', 'murchison-falls-safari', 'Witness the world''s most powerful waterfall, then cruise the Victoria Nile to its base. Game drives reveal elephants, lions, Rothschild giraffes, and hippos.', 4, 620.00, 'USD', TRUE),
(3, 'Jinja Adventure Weekend', 'jinja-adventure-weekend', 'An action-packed weekend at the Source of the Nile. White-water rafting, bungee jumping, kayaking, and scenic boat rides.', 2, 280.00, 'USD', TRUE),
(1, 'Gorillas & Lakes Explorer', 'gorillas-and-lakes-explorer', 'The perfect combo — gorilla trekking in Bwindi followed by peaceful days on beautiful Lake Bunyonyi.', 5, 1100.00, 'USD', TRUE),
(4, 'Western Uganda Grand Safari', 'western-uganda-grand-safari', 'The complete western Uganda circuit: Queen Elizabeth NP''s tree-climbing lions, Kibale chimpanzees, and Bwindi gorillas.', 6, 1550.00, 'USD', TRUE),
(6, 'Kidepo Valley Wilderness', 'kidepo-valley-wilderness', 'Uganda''s most remote and least-visited national park. Vast savannah and authentic Karamojong cultural immersion.', 7, 1350.00, 'USD', TRUE);

-- ═══════════════ CREATE ADMIN USER ═══════════════
-- Password: Admin@123456 (hashed using bcrypt)
-- You can generate new hash in Node: bcrypt.hash('Admin@123456', 10)
INSERT INTO "User" ("fullName", email, phone, "passwordHash", role, "isActive") VALUES
('Admin User', 'admin@pearlsafari.ug', '+256700123456', '$2b$10$gSvqqUPHQ.jHN6XrxjNkreV8NM1Uz7p.nWzh9p0OcxPhV8DcAm4iG', 'ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ═══════════════ SAMPLE DATA FOR TESTING ═══════════════
-- Uncomment to add test customer
-- INSERT INTO "User" ("fullName", email, phone, "passwordHash", role, "isActive") VALUES
-- ('Test Customer', 'customer@test.com', '+256712345678', '$2b$10$gSvqqUPHQ.jHN6XrxjNkreV8NM1Uz7p.nWzh9p0OcxPhV8DcAm4iG', 'CUSTOMER', TRUE);

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF INITIALIZATION SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════════
