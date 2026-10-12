/**
 * Schema.org Structured Data Controller
 * Generates JSON-LD schema markup for SEO
 */

const Item = require('../models/item.model');
const CategoryModel = require('../models/category.model');

const BASE_URL = process.env.STORE_DOMAIN || process.env.BASE_URL || 'http://localhost:5056';
const SITE_URL = process.env.SITE_URL || 'https://logicfirst.in';
const IMAGE_BASE = (process.env.BASE_URL || 'http://localhost:5056').replace(/\/$/, '');

/**
 * Helper: resolve image URL to absolute
 */
function resolveImageUrl(image) {
  if (!image) return `${SITE_URL}/logo.png`;
  
  let img = image;
  if (typeof img === 'object' && img.url) img = img.url;
  if (typeof img === 'string' && !img.startsWith('http')) {
    img = `${IMAGE_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
  }
  return img || `${SITE_URL}/logo.png`;
}

/**
 * GET /api/schema/organization — Organization schema
 */
exports.getOrganizationSchema = (req, res) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Logic First Technologies",
    "alternateName": "LogicFirst",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "description": "Revolutionizing IT solutions since 2015. Expert software development, Busy/Tally accounting, cloud servers, and custom software solutions.",
    "foundingDate": "2015",
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "F-208, Supertech Eco Village 2",
        "addressLocality": "Noida",
        "addressRegion": "Uttar Pradesh",
        "postalCode": "201308",
        "addressCountry": "IN"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "House No 163, Garhi Rami, Chhalesar",
        "addressLocality": "Agra",
        "addressRegion": "Uttar Pradesh",
        "postalCode": "282006",
        "addressCountry": "IN"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8076901732",
      "contactType": "customer service",
      "email": "Info@Logicfirst.in",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://www.facebook.com/share/18UmjRhmaM/"
    ],
    "areaServed": "IN",
    "serviceType": [
      "Busy Accounting Software",
      "Tally Software",
      "Cloud Server Hosting",
      "Custom Software Development",
      "Busy Customization"
    ]
  };

  res.json(schema);
};

/**
 * GET /api/schema/products — Product list schema (ItemList)
 */
exports.getProductListSchema = async (req, res) => {
  try {
    const items = await Item.find({ is_active: true, showOnWebsite: true })
      .populate('category_id', 'name')
      .select('name sale_price mrp image item_code short_description stock')
      .sort({ created_date: -1 })
      .limit(100)
      .lean();

    const itemListElements = items.map((item, index) => {
      const slug = (item.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": item.name,
          "description": item.short_description || item.name,
          "image": resolveImageUrl(item.image?.[0]),
          "url": `${SITE_URL}/products/${slug}`,
          "sku": item.item_code || item._id.toString(),
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": item.sale_price || 0,
            "availability": (item.stock > 0) 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "Logic First Technologies"
            }
          }
        }
      };
    });

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Products - Logic First Technologies",
      "description": "Browse our complete product catalog",
      "numberOfItems": items.length,
      "itemListElement": itemListElements
    };

    res.json(schema);
  } catch (error) {
    res.status(500).json({ message: 'Schema generation failed', error: error.message });
  }
};

/**
 * GET /api/schema/product/:slug — Single product schema
 */
exports.getProductSchema = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Search by slug-like name match
    const searchName = slug.replace(/-/g, ' ');
    const item = await Item.findOne({
      is_active: true,
      name: { $regex: new RegExp(searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    })
      .populate('category_id', 'name')
      .populate('brand_id', 'name')
      .lean();

    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const images = (item.image || []).map(img => resolveImageUrl(img));

    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": item.name,
      "description": item.long_description || item.short_description || item.name,
      "image": images.length > 0 ? images : [`${SITE_URL}/logo.png`],
      "sku": item.item_code || item._id.toString(),
      "brand": {
        "@type": "Brand",
        "name": (item.brand_id && item.brand_id.name) || "Logic First Technologies"
      },
      "category": (item.category_id && item.category_id.name) || "General",
      "offers": {
        "@type": "Offer",
        "url": `${SITE_URL}/products/${slug}`,
        "priceCurrency": "INR",
        "price": item.sale_price || 0,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": (item.stock > 0) 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Logic First Technologies"
        }
      }
    };

    // Add MRP as high price if available
    if (item.mrp && item.mrp > (item.sale_price || 0)) {
      schema.offers.highPrice = item.mrp;
    }

    // Add GTIN if HSN code exists
    if (item.hsn_code) {
      schema.gtin = item.hsn_code;
    }

    res.json(schema);
  } catch (error) {
    res.status(500).json({ message: 'Schema generation failed', error: error.message });
  }
};
