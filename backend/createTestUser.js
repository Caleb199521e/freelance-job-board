import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: join(__dirname, '..', '.env') });

import mongoose from 'mongoose';
import User from './models/User.js';

const createTestUsers = async () => {
  try {
    // Get MongoDB URI from environment
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('Please check your .env file');
      process.exit(1);
    }

    // Hide password in logs
    const maskedURI = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', maskedURI);
    
    // Check if using Atlas
    const isAtlas = MONGODB_URI.includes('mongodb+srv://');
    if (isAtlas) {
      console.log('🌐 Using MongoDB Atlas (Cloud)');
    } else {
      console.log('💻 Using Local MongoDB');
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);

    // Check if test users already exist
    const existingFreelancer = await User.findOne({ email: 'freelancer@test.com' });
    const existingClient = await User.findOne({ email: 'client@test.com' });

    if (!existingFreelancer) {
      const freelancer = new User({
        name: 'Test Freelancer',
        email: 'freelancer@test.com',
        password: 'password123',
        role: 'freelancer',
        profile: {
          title: 'Full Stack Developer',
          bio: 'Experienced developer with 5+ years in web development',
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
          location: 'Accra',
          contact: {
            phone: '+233 24 123 4567',
            linkedin: 'https://linkedin.com/in/testfreelancer',
            github: 'https://github.com/testfreelancer'
          }
        }
      });
      await freelancer.save();
      console.log('✅ Test Freelancer created');
      console.log('   Email: freelancer@test.com');
      console.log('   Password: password123');
    } else {
      console.log('ℹ️  Test Freelancer already exists');
      console.log('   Email: freelancer@test.com');
      console.log('   Password: password123');
    }

    if (!existingClient) {
      const client = new User({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'password123',
        role: 'client',
        company: {
          name: 'Test Company Ltd',
          website: 'https://testcompany.com',
          description: 'A leading tech company in Ghana'
        }
      });
      await client.save();
      console.log('✅ Test Client created');
      console.log('   Email: client@test.com');
      console.log('   Password: password123');
    } else {
      console.log('ℹ️  Test Client already exists');
      console.log('   Email: client@test.com');
      console.log('   Password: password123');
    }

    // List all users
    const allUsers = await User.find().select('name email role');
    console.log('\n📋 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Setup complete!');
    console.log('\nTest Accounts:');
    console.log('  📧 Freelancer: freelancer@test.com / password123');
    console.log('  📧 Client: client@test.com / password123');
    
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createTestUsers();
