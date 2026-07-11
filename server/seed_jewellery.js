require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");

// Models
const Item = require("./models/item.model.js");
const Product = require("./models/Product.js"); // Client-side Product model
const Category = require("./models/category.model.js");
const ItemGroup = require("./models/itemGroup.model.js");
const Brand = require("./models/brand.model.js");
const Unit = require("./models/Unit.js");
const CategoryClient = require("./models/Category.js"); // Client-side Category model if separate

async function seed() {
  await connectDB();
  
  try {
    console.log("🧹 Clearing old items, products, categories, groups, brands, units...");
    await Item.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await ItemGroup.deleteMany({});
    await Brand.deleteMany({});
    await Unit.deleteMany({});
    
    // Also clear the client-side Category collection if it exists separately
    try {
      await CategoryClient.deleteMany({});
    } catch(e) {}

    console.log("🌱 Seeding Categories...");
    const ringsCat = await Category.create({ name: "Rings", is_active: true, is_parent_category: true, status: "show" });
    const necklacesCat = await Category.create({ name: "Necklaces", is_active: true, is_parent_category: true, status: "show" });
    const earringsCat = await Category.create({ name: "Earrings", is_active: true, is_parent_category: true, status: "show" });
    const braceletsCat = await Category.create({ name: "Bracelets", is_active: true, is_parent_category: true, status: "show" });

    // Seed client-side categories matching the schema of CategoryClient
    let ringsClientCat, necklacesClientCat, earringsClientCat, braceletsClientCat;
    try {
      ringsClientCat = await CategoryClient.create({ _id: ringsCat._id, name: { en: "Rings" }, status: "show", description: { en: "Exquisite Rings" } });
      necklacesClientCat = await CategoryClient.create({ _id: necklacesCat._id, name: { en: "Necklaces" }, status: "show", description: { en: "Luxury Necklaces" } });
      earringsClientCat = await CategoryClient.create({ _id: earringsCat._id, name: { en: "Earrings" }, status: "show", description: { en: "Designer Earrings" } });
      braceletsClientCat = await CategoryClient.create({ _id: braceletsCat._id, name: { en: "Bracelets" }, status: "show", description: { en: "Fine Bracelets" } });
    } catch (e) {
      console.log("Info: Client category model skip or separate seeding completed.");
    }

    console.log("🌱 Seeding Item Groups...");
    const bridalGroup = await ItemGroup.create({ name: "Bridal Collection", is_active: true, is_parent_group: true });
    const diamondGroup = await ItemGroup.create({ name: "Diamond Solitaires", is_active: true, is_parent_group: true });
    const goldGroup = await ItemGroup.create({ name: "Timeless Gold", is_active: true, is_parent_group: true });

    console.log("🌱 Seeding Brand & Unit...");
    const brand = await Brand.create({ name: "Vellora", is_active: true });
    const unit = await Unit.create({ name: "Pcs", is_active: true });

    console.log("🌱 Preparing Premium Jewellery Items...");
    
    const imgRing1 = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80";
    const imgRing2 = "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80";
    const imgRing3 = "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=600&q=80";
    
    const imgNecklace1 = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80";
    const imgNecklace2 = "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80";
    const imgNecklace3 = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80";
    
    const imgEarring1 = "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80";
    const imgEarring2 = "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=600&q=80";
    const imgEarring3 = "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80";

    const imgBracelet1 = "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80";
    const imgBracelet2 = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80";
    
    const baseItems = [
      // Rings
      {
        name: "Classic Solitaire Diamond Ring",
        slug: "classic-solitaire-diamond-ring",
        alias: "CSDR-01",
        print_name: "Classic Solitaire Diamond Ring",
        category_id: ringsCat._id,
        item_group_id: diamondGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 1850,
        mrp: 2200,
        stock: 12,
        discount: 15,
        short_description: "A stunning 1.5 carat round-cut diamond solitaire ring set in 18K white gold.",
        long_description: "Crafted with absolute precision, this classic solitaire ring showcases a brilliant 1.5-carat round-cut diamond. Secured in a classic six-prong setting in premium 18K white gold, it maximizes the light reflection and fire of the diamond. Perfect for engagements and special milestones.",
        specification: "Diamond: 1.5 Carat, VVS1 Clarity, Color G. Metal: 18K White Gold. Certificate: GIA.",
        item_code: "1001",
        is_active: true,
        image: [imgRing1, imgRing2, imgRing3]
      },
      {
        name: "Princess Cut Sapphire Ring",
        slug: "princess-cut-sapphire-ring",
        alias: "PCSR-02",
        print_name: "Princess Cut Sapphire Ring",
        category_id: ringsCat._id,
        item_group_id: diamondGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 1450,
        mrp: 1700,
        stock: 8,
        discount: 14,
        short_description: "Deep blue princess-cut sapphire accented by side round-cut diamonds in yellow gold.",
        long_description: "An elegant princess-cut blue sapphire serves as the centerpiece of this breathtaking ring, flanked by shimmering micro-pave diamonds on a polished 18K yellow gold band. A royal and timeless design.",
        specification: "Sapphire: 2.0 Carat. Diamonds: 0.3 Carat total weight. Metal: 18K Yellow Gold.",
        item_code: "1002",
        is_active: true,
        image: [imgRing3, imgRing1, imgRing2]
      },
      {
        name: "Eternal Gold Wedding Band",
        slug: "eternal-gold-wedding-band",
        alias: "EGWB-03",
        print_name: "Eternal Gold Wedding Band",
        category_id: ringsCat._id,
        item_group_id: goldGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 490,
        mrp: 550,
        stock: 35,
        discount: 10,
        short_description: "Classic 4mm comfort-fit wedding band in solid 22K yellow gold.",
        long_description: "A timeless symbol of love, this 4mm comfort-fit wedding band is crafted from solid 22K gold. Its domed profile features a highly polished finish for enduring lustre and daily comfort.",
        specification: "Width: 4mm. Profile: Domed Comfort-fit. Metal: 22K Yellow Gold. BIS Hallmarked.",
        item_code: "1003",
        is_active: true,
        image: [imgRing2, imgRing1, imgRing3]
      },
      {
        name: "Vintage Emerald Halo Ring",
        slug: "vintage-emerald-halo-ring",
        alias: "VEHR-04",
        print_name: "Vintage Emerald Halo Ring",
        category_id: ringsCat._id,
        item_group_id: diamondGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 1650,
        mrp: 1950,
        stock: 6,
        discount: 15,
        short_description: "Exquisite oval Colombian emerald surrounded by a sparkling diamond halo.",
        long_description: "A vibrant oval-cut Colombian emerald is framed by a halo of brilliant round diamonds. The split-shank band features vintage milgrain detailing, set in 14K rose gold.",
        specification: "Emerald: 1.2 Carat. Diamonds: 0.45 Carat total. Metal: 14K Rose Gold.",
        item_code: "1004",
        is_active: true,
        image: [imgRing1, imgRing3, imgRing2]
      },
      // Necklaces
      {
        name: "Royal Kundan Choker Necklace",
        slug: "royal-kundan-choker-necklace",
        alias: "RKCN-05",
        print_name: "Royal Kundan Choker Necklace",
        category_id: necklacesCat._id,
        item_group_id: bridalGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 3450,
        mrp: 4100,
        stock: 4,
        discount: 15,
        short_description: "Traditional Kundan choker set with uncut diamonds and pearl drops.",
        long_description: "Make a statement with this royal Kundan choker set, hand-crafted with premium uncut glass gemstones (polki) and delicate green enamel accents. Hand-finished with cascading freshwater pearl drops.",
        specification: "Stone: Uncut Polki & Kundan. Metal: Alloy with 22K Gold plating. Clasp: Adjustable thread.",
        item_code: "1005",
        is_active: true,
        image: [imgNecklace1, imgNecklace3, imgNecklace2]
      },
      {
        name: "Elegant Pearl Strand Necklace",
        slug: "elegant-pearl-strand-necklace",
        alias: "EPSN-06",
        print_name: "Elegant Pearl Strand Necklace",
        category_id: necklacesCat._id,
        item_group_id: goldGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 790,
        mrp: 950,
        stock: 15,
        discount: 16,
        short_description: "Lustrous Akoya cultured pearl necklace with a 14K white gold clasp.",
        long_description: "This elegant necklace features a strand of perfectly matched, lustrous white Akoya pearls. Individually knotted on fine silk thread and finished with a delicate 14K white gold safety clasp.",
        specification: "Pearl Type: Akoya Cultured. Size: 7.5 - 8.0mm. Length: 18 Inches. Clasp: 14K White Gold.",
        item_code: "1006",
        is_active: true,
        image: [imgNecklace2, imgNecklace1, imgNecklace3]
      },
      {
        name: "18K Gold Curb Link Chain",
        slug: "18k-gold-curb-link-chain",
        alias: "GCLC-07",
        print_name: "18K Gold Curb Link Chain",
        category_id: necklacesCat._id,
        item_group_id: goldGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 650,
        mrp: 750,
        stock: 20,
        discount: 13,
        short_description: "Classic and durable 18K solid yellow gold curb link chain.",
        long_description: "A staple in any collection, this 20-inch curb link chain is crafted from solid 18K yellow gold. Highly polished and finished with a secure lobster claw clasp, it is perfect for wearing solo or holding a pendant.",
        specification: "Length: 20 Inches. Width: 3.2mm. Weight: 8.5g. Metal: 18K Gold.",
        item_code: "1007",
        is_active: true,
        image: [imgNecklace3, imgNecklace2, imgNecklace1]
      },
      {
        name: "Diamond Drop Pendant Necklace",
        slug: "diamond-drop-pendant-necklace",
        alias: "DDPN-08",
        print_name: "Diamond Drop Pendant Necklace",
        category_id: necklacesCat._id,
        item_group_id: diamondGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 1100,
        mrp: 1300,
        stock: 10,
        discount: 15,
        short_description: "Breathtaking pear-shaped diamond drop pendant in 18K white gold.",
        long_description: "Elevate your style with this classic pear-cut diamond pendant hanging gracefully from an 18K white gold cable chain. Features a sparkling micro-pave diamond bail for added fire.",
        specification: "Center Diamond: 0.8 Carat, VS2. Chain: 16-18 Inch adjustable. Metal: 18K White Gold.",
        item_code: "1008",
        is_active: true,
        image: [imgNecklace1, imgNecklace2, imgNecklace3]
      },
      // Earrings
      {
        name: "Sparkling Diamond Hoop Earrings",
        slug: "sparkling-diamond-hoop-earrings",
        alias: "SDHE-09",
        print_name: "Sparkling Diamond Hoop Earrings",
        category_id: earringsCat._id,
        item_group_id: diamondGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 1250,
        mrp: 1500,
        stock: 10,
        discount: 16,
        short_description: "Stunning inside-out diamond hoop earrings in 18K white gold.",
        long_description: "These elegant hoops feature sparkling round-cut diamonds set both inside and outside the loop for maximum brilliance from all angles. Completed with a secure hinge lock.",
        specification: "Diamond weight: 1.0 Carat total. Diameter: 25mm. Metal: 18K White Gold.",
        item_code: "1009",
        is_active: true,
        image: [imgEarring1, imgEarring2, imgEarring3]
      },
      {
        name: "Classic Gold Jhumka Earrings",
        slug: "classic-gold-jhumka-earrings",
        alias: "CGJE-10",
        print_name: "Classic Gold Jhumka Earrings",
        category_id: earringsCat._id,
        item_group_id: goldGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 920,
        mrp: 1100,
        stock: 14,
        discount: 16,
        short_description: "Ornate traditional jhumka earrings in 22K gold with filigree work.",
        long_description: "A celebration of Indian heritage, these 22K gold jhumkas feature intricate filigree patterns and dangling gold beads. Ideal for bridal and festive occasions.",
        specification: "Weight: 14.2g. Metal: 22K Yellow Gold. Finish: Antique Gold. BIS Hallmarked.",
        item_code: "1010",
        is_active: true,
        image: [imgEarring2, imgEarring3, imgEarring1]
      },
      {
        name: "Minimalist Silver Studs",
        slug: "minimalist-silver-studs",
        alias: "MSS-11",
        print_name: "Minimalist Silver Studs",
        category_id: earringsCat._id,
        item_group_id: goldGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 80,
        mrp: 100,
        stock: 50,
        discount: 20,
        short_description: "Classic bezel-set cubic zirconia studs in sterling silver.",
        long_description: "Simple, elegant, and perfect for daily wear. These studs feature high-grade cubic zirconia stones set in 925 sterling silver with a rhodium plating to prevent tarnishing.",
        specification: "Stone: Cubic Zirconia. Metal: 925 Sterling Silver. Clasp: Push back.",
        item_code: "1011",
        is_active: true,
        image: [imgEarring3, imgEarring1, imgEarring2]
      },
      // Bracelets
      {
        name: "Diamond Tennis Bracelet",
        slug: "diamond-tennis-bracelet",
        alias: "DTB-12",
        print_name: "Diamond Tennis Bracelet",
        category_id: braceletsCat._id,
        item_group_id: diamondGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 2450,
        mrp: 2950,
        stock: 5,
        discount: 16,
        short_description: "Classic inline strand of brilliant-cut diamonds in 18K white gold.",
        long_description: "A continuous strand of round, brilliant-cut diamonds linked in a flexible 18K white gold setting. Finished with a double-safety clasp, this tennis bracelet is the epitome of elegance.",
        specification: "Diamonds: 3.5 Carat total. Length: 7 Inches. Metal: 18K White Gold.",
        item_code: "1012",
        is_active: true,
        image: [imgBracelet1, imgBracelet2, imgRing1]
      },
      {
        name: "22K Gold Bangle Bracelet",
        slug: "22k-gold-bangle-bracelet",
        alias: "GBB-13",
        print_name: "22K Gold Bangle Bracelet",
        category_id: braceletsCat._id,
        item_group_id: goldGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 850,
        mrp: 990,
        stock: 18,
        discount: 14,
        short_description: "Handcrafted 22K yellow gold bangle with intricate carvings.",
        long_description: "This stunning solid gold bangle features hand-carved ethnic motifs. Its slip-on design offers a smooth internal surface for comfortable daily wear. Perfect for stacking.",
        specification: "Width: 6mm. Weight: 12.0g. Metal: 22K Yellow Gold. BIS Hallmarked.",
        item_code: "1013",
        is_active: true,
        image: [imgBracelet2, imgBracelet1, imgRing2]
      },
      // Bridal / Sets
      {
        name: "Traditional Bridal Temple Set",
        slug: "traditional-bridal-temple-set",
        alias: "TBTS-14",
        print_name: "Traditional Bridal Temple Set",
        category_id: necklacesCat._id,
        item_group_id: bridalGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 4500,
        mrp: 5200,
        stock: 3,
        discount: 13,
        short_description: "Heavy 22K gold temple necklace set featuring Goddess Lakshmi carvings.",
        long_description: "This masterfully crafted South Indian bridal set features a heavy choker, long necklace, and matching jhumkas. Crafted in solid 22K gold with rubies and emerald accents.",
        specification: "Weight: 110g. Gemstones: Natural Rubies & Emeralds. Metal: 22K Yellow Gold.",
        item_code: "1014",
        is_active: true,
        image: [imgNecklace3, imgNecklace1, imgRing3]
      },
      {
        name: "Diamond Floral Cuff Bracelet",
        slug: "diamond-floral-cuff-bracelet",
        alias: "DFCB-15",
        print_name: "Diamond Floral Cuff Bracelet",
        category_id: braceletsCat._id,
        item_group_id: bridalGroup._id,
        brand_id: brand._id,
        unit_id: unit._id,
        sale_price: 2900,
        mrp: 3400,
        stock: 4,
        discount: 14,
        short_description: "Ornate floral diamond cuff bracelet in 18K yellow gold.",
        long_description: "An intricate statement piece, this cuff features delicate gold vines adorned with brilliant round and marquise-cut diamond flowers. Designed with a secure safety hinge.",
        specification: "Diamonds: 4.2 Carat. Metal: 18K Yellow Gold. Certificate: IGI.",
        item_code: "1015",
        is_active: true,
        image: [imgBracelet1, imgBracelet2, imgRing1]
      }
    ];

    console.log("🌱 Inserting Items into Admin Database (items)...");
    const adminItems = baseItems.map(item => ({
      ...item,
      // Map images to [{ url }] for admin compatibility
      image: item.image.map(imgUrl => ({ url: imgUrl })),
      default_image: item.image[0],
      is_active: true
    }));
    const createdAdminItems = await Item.insertMany(adminItems);
    console.log(`🎉 Admin items seeded: ${createdAdminItems.length}`);

    console.log("🌱 Inserting Products into Client Database (products)...");
    const clientProducts = baseItems.map(item => ({
      title: { en: item.name },
      description: { en: item.short_description },
      slug: item.slug,
      categories: [item.category_id],
      category: item.category_id,
      image: item.image, // Array of strings for client/Product compatibility
      stock: item.stock,
      sales: 0,
      tag: [item.slug.replace(/-/g, " ")],
      prices: {
        price: item.sale_price,
        originalPrice: item.mrp,
        discount: item.discount
      },
      status: "show",
      is_active: true,
      isCombination: false, // Required field
      variants: [],         // Empty array
      productId: item.item_code
    }));
    
    const createdClientProducts = await Product.insertMany(clientProducts);
    console.log(`🎉 Client products seeded: ${createdClientProducts.length}`);
    
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

seed();
