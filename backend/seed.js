import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.js';
import Job from './models/Job.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Job.deleteMany({});
    console.log('🗑️  Cleared existing jobs');

    // Create a sample client if none exists
    let client = await User.findOne({ role: 'client' });
    if (!client) {
      client = await User.create({
        name: 'Tech Solutions Ghana',
        email: 'client@demo.com',
        password: 'password',
        role: 'client',
        company: {
          name: 'Tech Solutions Ghana',
          website: 'https://techsolutions.gh',
          description: 'Leading tech company in Ghana'
        }
      });
      console.log('✅ Created demo client');
    }

    // Sample jobs
    const sampleJobs = [
      {
        title: 'Full Stack Web Developer',
        description: 'We are looking for an experienced full-stack developer to build a modern e-commerce platform.',
        category: 'web-development',
        budget: 5000,
        budgetType: 'fixed',
        duration: '2-3 months',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        skillsRequired: ['React', 'Node.js', 'MongoDB', 'Express'],
        location: 'Remote',
        status: 'open',
        client: client._id
      },
      {
        title: 'Mobile App Developer - Flutter',
        description: 'Build a cross-platform mobile app for food delivery service.',
        category: 'mobile-development',
        budget: 80,
        budgetType: 'hourly',
        duration: '1-2 months',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        skillsRequired: ['Flutter', 'Dart', 'Firebase', 'REST API'],
        location: 'Accra',
        status: 'open',
        client: client._id
      },
      {
        title: 'UI/UX Designer for SaaS Platform',
        description: 'Design modern and intuitive user interfaces for our SaaS product.',
        category: 'design',
        budget: 3000,
        budgetType: 'fixed',
        duration: '1 month',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        skillsRequired: ['Figma', 'UI Design', 'UX Research', 'Prototyping'],
        location: 'Remote',
        status: 'open',
        client: client._id
      },
      {
        title: 'Content Writer - Tech Blog',
        description: 'Write engaging technical articles for our technology blog.',
        category: 'writing',
        budget: 50,
        budgetType: 'hourly',
        duration: 'Ongoing',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        skillsRequired: ['Technical Writing', 'SEO', 'Content Strategy'],
        location: 'Remote',
        status: 'open',
        client: client._id
      },
      {
        title: 'Digital Marketing Specialist',
        description: 'Manage social media campaigns and digital marketing strategies.',
        category: 'marketing',
        budget: 2500,
        budgetType: 'fixed',
        duration: '1 month',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        skillsRequired: ['Social Media Marketing', 'Google Ads', 'Analytics', 'SEO'],
        location: 'Kumasi',
        status: 'open',
        client: client._id
      },
      {
        title: 'WordPress Developer',
        description: 'Customize and maintain WordPress websites for small businesses.',
        category: 'web-development',
        budget: 45,
        budgetType: 'hourly',
        duration: 'Ongoing',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        skillsRequired: ['WordPress', 'PHP', 'CSS', 'JavaScript'],
        location: 'Takoradi',
        status: 'open',
        client: client._id
      }
    ];

    const jobs = await Job.insertMany(sampleJobs);
    console.log(`✅ Created ${jobs.length} sample jobs`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Jobs: ${jobs.length}`);
    console.log(`   - Client: ${client.email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
