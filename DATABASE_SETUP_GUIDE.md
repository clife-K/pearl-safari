# Pearl Safari Uganda - Database & Admin Setup Guide

## 📋 Complete Setup Instructions for Local Development

This guide will help you set up the PostgreSQL database and admin system for Pearl Safari Uganda locally on your machine.

---

## **Part 1: PostgreSQL Installation & Setup**

### **Step 1: Install PostgreSQL**

#### **For Windows:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. **Important:** Remember the password you set for the `postgres` user (default user)
4. During installation, keep the default port as **5432**
5. Complete the installation

#### **For Mac:**
```bash
# Using Homebrew (install if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15
```

#### **For Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

### **Step 2: Create Database and User**

Open **PostgreSQL Command Line** (psql):

**Windows:** Search for "SQL Shell (psql)" in Start Menu
**Mac/Linux:** Open terminal and run `psql -U postgres`

Then execute these commands:

```sql
-- Create database
CREATE DATABASE pearl_safari_uganda;

-- Create database user
CREATE USER ecommerce_user WITH PASSWORD 'your_password';

-- Grant privileges
ALTER ROLE ecommerce_user SET client_encoding TO 'utf8';
ALTER ROLE ecommerce_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecommerce_user SET default_transaction_deferrable TO on;
ALTER ROLE ecommerce_user SET default_transaction_deferrable TO off;
ALTER ROLE ecommerce_user SET default_time_zone TO 'UTC';

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE pearl_safari_uganda TO ecommerce_user;

-- Connect to the new database
\c pearl_safari_uganda

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO ecommerce_user;
```

---

## **Part 2: Initialize Database with SQL Script**

### **Step 1: Run the SQL Initialization Script**

Navigate to the project folder and run:

**Windows (Command Prompt):**
```cmd
psql -U ecommerce_user -d pearl_safari_uganda -f backend\prisma\init.sql
```

**Mac/Linux (Terminal):**
```bash
psql -U ecommerce_user -d pearl_safari_uganda -f backend/prisma/init.sql
```

You'll be prompted to enter the password you set for `ecommerce_user`.

**Expected Output:** You should see confirmation that tables and sample data were created.

### **Step 2: Verify Database Setup**

Connect to the database and check:

```bash
psql -U ecommerce_user -d pearl_safari_uganda

# In psql, run:
\dt                    # List all tables
SELECT * FROM "User";  # View users
```

---

## **Part 3: Configure Backend Environment**

### **Step 1: Update .env File**

Edit `backend/.env` with your database credentials:

```env
DATABASE_URL="postgresql://ecommerce_user:your_password@localhost:5432/pearl_safari_uganda?schema=public"
JWT_SECRET="pearl_safari_backend_super_secret_2026"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@pearlsafari.ug
```

**Replace:**
- `your_password` with the password you set for `ecommerce_user`

### **Step 2: Install Backend Dependencies**

```bash
cd backend
npm install
```

---

## **Part 4: Start the Backend Server**

### **Run the Backend**

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

**Expected Output:**
```
API running on http://localhost:5000
```

---

## **Part 5: Access Admin Panel**

### **Admin Login Credentials**

**URL:** `http://localhost:3000/admin-login.html`

**Default Admin Account:**
```
Email:    admin@pearlsafari.ug
Password: Admin@123456
```

**After Login, you have access to:**
- ✅ **Dashboard** - Overview of bookings, revenue, customers
- ✅ **Bookings Management** - View, update, cancel bookings
- ✅ **Payments Management** - View, update payment status
- ✅ **Messages** - View customer inquiries from contact form
- ✅ **Users Management** - Manage user roles and status

---

## **Part 6: Contact Form Integration**

The website's contact form now saves messages to the database.

**Frontend Implementation Already Included:**
- Messages are stored when users submit the contact form
- Admin can view and manage messages from admin panel

To test:
1. Go to `http://localhost:3000/contact.html`
2. Fill out and submit the contact form
3. Check `admin-messages.html` to see the message

---

## **API Endpoints Reference**

### **Public Endpoints**
```
POST   /api/contacts                    # Submit contact message
GET    /api/destinations                # Get destinations
GET    /api/packages                    # Get packages
POST   /api/auth/signup                 # User signup
POST   /api/auth/login                  # User login
```

### **Authenticated User Endpoints**
```
POST   /api/bookings                    # Create booking
GET    /api/bookings/me                 # Get user's bookings
POST   /api/bookings/:id/payments       # Add payment
```

### **Admin Endpoints (Require ADMIN Role)**
```
GET    /api/admin/dashboard             # Dashboard stats
GET    /api/admin/bookings              # All bookings
PUT    /api/admin/bookings/:id/status   # Update booking status
DELETE /api/admin/bookings/:id          # Delete booking
GET    /api/admin/payments              # All payments
PUT    /api/admin/payments/:id/status   # Update payment status
GET    /api/admin/contacts              # All messages
DELETE /api/admin/contacts/:id          # Delete message
GET    /api/admin/users                 # All users
PUT    /api/admin/users/:id/role        # Update user role
```

---

## **Troubleshooting**

### **Problem: "Connection refused" error**

**Solution:**
1. Verify PostgreSQL is running:
   - Windows: Check Services (postgres service)
   - Mac: `brew services list`
   - Linux: `sudo service postgresql status`
2. Verify DATABASE_URL in `.env` is correct
3. Ensure port 5432 is not blocked by firewall

### **Problem: "Password authentication failed"**

**Solution:**
1. Double-check password in `.env` matches the one you set
2. Reset PostgreSQL password:
   ```bash
   psql -U postgres
   ALTER USER ecommerce_user WITH PASSWORD 'new_password';
   ```

### **Problem: Tables don't exist**

**Solution:**
1. Re-run the init SQL script
2. Or use Prisma migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

### **Problem: Admin login fails**

**Solution:**
1. Verify admin user exists:
   ```bash
   psql -U ecommerce_user -d pearl_safari_uganda
   SELECT * FROM "User" WHERE role='ADMIN';
   ```
2. If not found, insert manually:
   ```sql
   INSERT INTO "User" ("fullName", email, "passwordHash", role, "isActive") 
   VALUES ('Admin User', 'admin@pearlsafari.ug', '$2b$10$gSvqqUPHQ.jHN6XrxjNkreV8NM1Uz7p.nWzh9p0OcxPhV8DcAm4iG', 'ADMIN', TRUE);
   ```

---

## **Admin Features Explained**

### **Dashboard**
- Real-time statistics on bookings, revenue, customers
- Quick overview of pending tasks
- Recent bookings list

### **Bookings Management**
- View all bookings with search/filter
- Change booking status (Pending → Confirmed → Completed)
- Cancel bookings
- Delete bookings from database
- View detailed booking information

### **Payments Management**
- View all payments received
- Update payment status manually
- Track revenue
- Delete invalid payments
- See payment breakdown by status

### **Messages**
- View customer inquiries from contact form
- Mark messages as read
- Delete old messages
- Reply via email

### **Users Management**
- View all registered users
- Change user role (Customer → Staff → Admin)
- Activate/Deactivate user accounts
- View user booking history
- Delete user accounts

---

## **Next Steps**

1. ✅ Set up PostgreSQL database
2. ✅ Install and run backend
3. ✅ Access admin panel
4. ✅ Test all features locally
5. 📱 Start managing bookings and payments
6. 🚀 When ready, deploy to production

---

## **Database Backup & Restore**

### **Backup Database**
```bash
pg_dump -U ecommerce_user -d pearl_safari_uganda -f backup.sql
```

### **Restore Database**
```bash
psql -U ecommerce_user -d pearl_safari_uganda -f backup.sql
```

---

## **Support**

For issues or questions:
1. Check the troubleshooting section
2. Verify all environment variables are correct
3. Check database connection status
4. Review server logs for error messages

---

**Last Updated:** April 24, 2026

**Status:** ✅ Complete - Ready for Production Use

Good luck with your Pearl Safari Uganda platform!
