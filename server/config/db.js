require("dotenv").config();
const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("MONGO_URI environment variable is missing!");
      return null;
    }

    const opts = {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`mongodb connection success!`);
      return m;
    }).catch((err) => {
      cached.promise = null;
      console.error("mongodb connection failed!", err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = {
  connectDB,
};

