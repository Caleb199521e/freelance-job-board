import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: join(__dirname, '..', '.env') });

import mongoose from 'mongoose';

const testConnection = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('Please check your .env file in the root directory');
      process.exit(1);
    }

    // Hide password in logs
    const maskedURI = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    
    console.log('🔍 Testing MongoDB Connection...\n');
    console.log('📍 URI:', maskedURI);
    
    // Check connection type
    const isAtlas = MONGODB_URI.includes('mongodb+srv://');
    const isLocal = MONGODB_URI.includes('mongodb://localhost') || MONGODB_URI.includes('mongodb://127.0.0.1');
    
    if (isAtlas) {
      console.log('🌐 Connection Type: MongoDB Atlas (Cloud)');
    } else if (isLocal) {
      console.log('💻 Connection Type: Local MongoDB');
    } else {
      console.log('🔗 Connection Type: Remote MongoDB');
    }
    
    console.log('\n⏳ Connecting...');
    
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    const startTime = Date.now();
    await mongoose.connect(MONGODB_URI, options);
    const connectionTime = Date.now() - startTime;
    
    console.log('\n✅ Connection Successful!');
    console.log('⚡ Connection Time:', connectionTime + 'ms');
    console.log('📊 Database Name:', mongoose.connection.db.databaseName);
    console.log('🎯 Host:', mongoose.connection.host);
    console.log('📡 Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    console.log('\n📈 Database Statistics:');
    console.log('   Collections:', stats.collections);
    console.log('   Data Size:', (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
    console.log('   Storage Size:', (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log('\n📦 Existing Collections:');
      collections.forEach(col => {
        console.log('   -', col.name);
      });
    } else {
      console.log('\n📦 No collections yet (database is empty)');
    }
    
    // Count documents in main collections
    try {
      const User = mongoose.connection.collection('users');
      const Job = mongoose.connection.collection('jobs');
      const Proposal = mongoose.connection.collection('proposals');
      
      const userCount = await User.countDocuments();
      const jobCount = await Job.countDocuments();
      const proposalCount = await Proposal.countDocuments();
      
      console.log('\n📊 Document Counts:');
      console.log('   Users:', userCount);
      console.log('   Jobs:', jobCount);
      console.log('   Proposals:', proposalCount);
    } catch (err) {
      // Collections might not exist yet
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Connection closed successfully');
    console.log('\n🎉 Your MongoDB Atlas setup is working correctly!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error('Error Message:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('\n💡 Possible Issues:');
      console.error('   - Check your username and password in MONGODB_URI');
      console.error('   - Verify the database user exists in MongoDB Atlas');
      console.error('   - Make sure the password is URL-encoded if it contains special characters');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Possible Issues:');
      console.error('   - Check your internet connection');
      console.error('   - Verify the cluster URL is correct');
      console.error('   - Make sure MongoDB Atlas cluster is running');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Possible Issues:');
      console.error('   - Check Network Access settings in MongoDB Atlas');
      console.error('   - Verify your IP address is whitelisted');
      console.error('   - Try adding 0.0.0.0/0 to allow access from anywhere (for testing)');
    }
    
    console.error('\n📝 Full Error Details:');
    console.error(error);
    
    process.exit(1);
  }
};

testConnection();
