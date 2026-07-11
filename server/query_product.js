require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

async function check() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const product = await Product.findOne({ slug: "classic-solitaire-diamond-ring" });
  console.log("Raw DB Product JSON:", JSON.stringify(product, null, 2));
  process.exit();
}

check();
