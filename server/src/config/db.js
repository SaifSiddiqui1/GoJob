const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to resolve MongoDB Atlas SRV records
// (local ISP DNS may not support SRV lookups)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async (retries = 5) => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        if (retries > 0) {
            console.log(`   Retrying in 5s... (${retries} attempts left)`);
            setTimeout(() => connectDB(retries - 1), 5000);
        } else {
            console.error('   All retries failed. Check MONGODB_URI and Atlas -> Network Access -> Add IP: 0.0.0.0/0');
        }
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected!');
});

module.exports = connectDB;
