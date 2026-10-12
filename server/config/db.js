require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("MONGO_URI environment variable is missing!");
      return;
    }

    const targetDb = process.env.DB_NAME || 'ecommerce';
    const urlParts = uri.split('?');
    const baseUri = urlParts[0];
    const queryParams = urlParts[1] ? `?${urlParts[1]}` : '';
    const pathPart = baseUri.split('/').pop();

    if (!pathPart || pathPart.includes('@') || pathPart.includes('.')) {
      const cleanBase = baseUri.endsWith('/') ? baseUri : `${baseUri}/`;
      uri = `${cleanBase}${targetDb}${queryParams}`;
    }

    await mongoose.connect(uri, {
      dbName: targetDb,
    });
    console.log(`mongodb connection success to ${mongoose.connection.name || targetDb}!`);
  } catch (err) {
    console.log("mongodb connection failed!", err.message);
  }
};

module.exports = {
  connectDB,
};
