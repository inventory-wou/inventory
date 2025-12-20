// Password Reset Script
// Run this with: node scripts/reset-admin-password.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
    try {
        console.log('🔐 Admin Password Reset Script\n');

        // Get admin email from command line or use default
        const adminEmail = process.argv[2] || 'admin@woxsen.edu.in';
        const newPassword = process.argv[3] || 'Admin@123';

        console.log(`Looking for admin user: ${adminEmail}`);

        // Find admin user
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!admin) {
            console.error(`❌ Admin user not found with email: ${adminEmail}`);
            console.log('\nAvailable admin users:');

            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { email: true, name: true }
            });

            admins.forEach(a => console.log(`  - ${a.email} (${a.name})`));
            process.exit(1);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { email: adminEmail },
            data: { password: hashedPassword }
        });

        console.log('✅ Password reset successful!');
        console.log(`\nLogin credentials:`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${newPassword}`);
        console.log('\n⚠️  Please change this password after logging in!');

    } catch (error) {
        console.error('❌ Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
