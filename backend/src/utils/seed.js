const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB - seed.js:9');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users - seed.js:13');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      department: 'IT Management',
      status: 'active'
    });

    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', 10);
    const employee = new User({
      fullName: 'John Employee',
      email: 'employee@example.com',
      password: employeePassword,
      role: 'employee',
      department: 'Development',
      status: 'active'
    });

    // Create additional employee for testing
    const employee2Password = await bcrypt.hash('employee123', 10);
    const employee2 = new User({
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      password: employee2Password,
      role: 'employee',
      department: 'Design',
      status: 'active'
    });

    await admin.save();
    await employee.save();
    await employee2.save();

    console.log('✅ Demo users created successfully! - seed.js:52');
    console.log('\n📝 Login Credentials: - seed.js:53');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ - seed.js:54');
    console.log('🔐 Admin: - seed.js:55');
    console.log('Email: admin@example.com - seed.js:56');
    console.log('Password: admin123 - seed.js:57');
    console.log('\n👥 Employees: - seed.js:58');
    console.log('Email: employee@example.com - seed.js:59');
    console.log('Password: employee123 - seed.js:60');
    console.log('\n   Email: jane@example.com - seed.js:61');
    console.log('Password: employee123 - seed.js:62');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ - seed.js:63');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users: - seed.js:67', error);
    process.exit(1);
  }
};

seedUsers();