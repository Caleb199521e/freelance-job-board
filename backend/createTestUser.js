import mongoose from 'mongoose';
import User from './models/User.js';

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/freelance-job-board');
    console.log('✅ Connected to MongoDB');

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

    await mongoose.connection.close();
    console.log('\n✅ Done! You can now login with these credentials.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestUsers();
