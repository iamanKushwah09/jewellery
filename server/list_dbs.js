require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB cluster!");
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    console.log("Databases on cluster:");
    for (let db of dbs.databases) {
      console.log(`- ${db.name}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit();
}

run();
