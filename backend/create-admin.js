const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@pearlsafari.ug' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    const adminUser = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: 'admin@pearlsafari.ug',
        phone: '+256700000000',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin created successfully:', adminUser.email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
