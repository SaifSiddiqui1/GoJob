const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to resolve MongoDB Atlas SRV records
// (local ISP DNS may not support SRV lookups)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Disable Mongoose command buffering globally — instead of buffering queries
// silently and timing out with a cryptic error, fail fast with a clear message.
mongoose.set('bufferCommands', false);

const MONGOOSE_OPTS = {
    serverSelectionTimeoutMS: 15000,   // max time to find a server
    socketTimeoutMS: 45000,            // max time for a socket operation
    connectTimeoutMS: 15000,           // max time for initial TCP connect
    maxPoolSize: 10,                   // connection pool size
    retryWrites: true,
};

const connectDB = async (retries = 5, delayMs = 3000) => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, MONGOOSE_OPTS);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        if (retries > 0) {
            console.log(`   Retrying in ${delayMs / 1000}s... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return connectDB(retries - 1, Math.min(delayMs * 2, 15000)); // exponential backoff
        }
        console.error('   All retries exhausted. Check MONGODB_URI and Atlas → Network Access → Allow IP 0.0.0.0/0');
        process.exit(1); // exit hard — can't run without DB
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected!');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error after connect:', err.message);
});

module.exports = connectDB;

