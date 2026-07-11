const axios = require("axios");

async function run() {
  try {
    const res = await axios.get("http://localhost:5056/api/products/product/classic-solitaire-diamond-ring");
    console.log("Product response:", JSON.stringify(res.data.image, null, 2));
  } catch (err) {
    console.error("Error fetching:", err.message);
  }
}

run();
