import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'inventory_wou@woxsen.edu.in' },
        update: {},
        create: {
            email: 'inventory_wou@woxsen.edu.in',
            name: 'System Administrator',
            password: hashedPassword,
            role: 'ADMIN',
            isApproved: true,
            isActive: true,
        },
    });

    console.log('✅ Admin user created:', admin.email);
    console.log('   Password: Admin@123');
    console.log('   Please change this password after first login!');

    // Create default categories
    const categories = [
        {
            name: 'Electronics',
            description: 'Electronic components and devices',
            maxBorrowDuration: 7,
            requiresApproval: false,
            visibleToStudents: true,
            visibleToStaff: true,
        },
        {
            name: 'Robotics Components',
            description: 'Motors, sensors, actuators, and robotic parts',
            maxBorrowDuration: 14,
            requiresApproval: true,
            visibleToStudents: true,
            visibleToStaff: true,
        },
        {
            name: 'Computing Devices',
            description: 'Laptops, computers, and computing equipment',
            maxBorrowDuration: 30,
            requiresApproval: true,
            visibleToStudents: false,
            visibleToStaff: true,
        },
        {
            name: 'VR Equipment',
            description: 'Oculus and other VR devices',
            maxBorrowDuration: 7,
            requiresApproval: true,
            visibleToStudents: true,
            visibleToStaff: true,
        },
        {
            name: 'Consumables',
            description: 'Cables, resistors, capacitors, and other consumables',
            maxBorrowDuration: 7,
            requiresApproval: false,
            visibleToStudents: true,
            visibleToStaff: true,
        },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }

    console.log(`✅ ${categories.length} categories created`);

    // Create default settings
    const defaultSettings = [
        { key: 'MAX_ITEMS_PER_USER', value: '3', description: 'Maximum items a user can borrow simultaneously' },
        { key: 'LATE_RETURN_BAN_MONTHS', value: '6', description: 'Months to ban user for late returns' },
        { key: 'APPROVAL_THRESHOLD_VALUE', value: '50000', description: 'Item value threshold requiring admin approval (in ₹)' },
        { key: 'GRACE_PERIOD_DAYS', value: '0', description: 'Grace period before late penalty applies' },
        { key: 'ALLOW_EXTENSIONS', value: 'true', description: 'Allow users to request extensions' },
        { key: 'MAX_EXTENSIONS', value: '1', description: 'Maximum number of extensions allowed per item' },
    ];

    for (const setting of defaultSettings) {
        await prisma.settings.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }

    console.log(`✅ ${defaultSettings.length} default settings created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nNext steps:');
    console.log('1. Login with: inventory_wou@woxsen.edu.in / Admin@123');
    console.log('2. Create departments (Robotics Lab, AI Lab, Metaverse Lab)');
    console.log('3. Assign incharges to departments');
    console.log('4. Add inventory items');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
