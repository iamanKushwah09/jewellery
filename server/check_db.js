require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

async function check() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const product = await Product.findOne({});
  console.log("Sample Product Title:", product.title);
  console.log("Sample Product Images:", JSON.stringify(product.image, null, 2));
  console.log("Image types:", product.image.map(img => typeof img));
  process.exit();
}

check();
