const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/construction_exchange';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Warning]: Primary MongoDB connection to ${primaryUri} failed: ${error.message}`);
    console.log('[Info]: Starting resilient In-Memory MongoDB Server for development/evaluation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'construction_exchange',
        },
        spawn: {
          timeout: 60000,
        },
      });

      const fallbackUri = mongodInstance.getUri();
      const conn = await mongoose.connect(fallbackUri);
      console.log(`[MongoDB In-Memory Connected]: Resilient fallback active at ${fallbackUri}`);
      console.log('[Note]: Full database operations, models, relations, and seeders will work seamlessly.');
      return conn;
    } catch (fallbackError) {
      console.error(`[Fatal]: Could not start MongoDB fallback: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
