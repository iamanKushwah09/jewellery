/**
 * GMC Product Mapper
 * Maps MongoDB Item documents into valid Google Merchant Center product payloads
 */

const TARGET_COUNTRY = process.env.GMC_FEED_LABEL || process.env.GMC_TARGET_COUNTRY || 'IN';
const CONTENT_LANGUAGE = process.env.GMC_CONTENT_LANGUAGE || 'en';
const STORE_DOMAIN = (process.env.STORE_DOMAIN || process.env.STORE_URL || 'https://logicfirst.in').replace(/\/$/, '');
const BASE_URL = (process.env.BASE_URL || 'https://api.logicfirst.in').replace(/\/$/, '');

/**
 * Generate a clean URL-friendly slug from string
 */
function generateSlug(text) {
  if (!text) return 'product';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Strip HTML tags from description
 */
function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve and validate a public image URL
 * @param {string|Object} img 
 * @returns {string|null} Full public image URL
 */
function resolvePublicImageUrl(img) {
  if (!img) return null;
  let rawUrl = '';
  
  if (typeof img === 'object') {
    rawUrl = img.url || img.image_url || img.path || img.filePath || '';
  } else if (typeof img === 'string') {
    rawUrl = img;
  }

  rawUrl = rawUrl.trim();
  if (!rawUrl) return null;

  // Reject local absolute Windows/Linux file paths like C:\uploads\ or /tmp
  if (/^[a-zA-Z]:[\\\/]/.test(rawUrl) || rawUrl.startsWith('\\')) {
    return null;
  }

  // Already a full public HTTP/HTTPS URL (e.g. Cloudinary, AWS S3, or CDN)
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    // If it's a localhost URL, replace with BASE_URL if configured for production
    if (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
      const pathPart = rawUrl.replace(/^https?:\/\/[^\/]+/, '');
      return `${BASE_URL}${pathPart.startsWith('/') ? '' : '/'}${pathPart}`;
    }
    return rawUrl;
  }

  // Relative path (e.g., /uploadFile/items/... or items/...)
  const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Convert price into Indian Rupees formatted string and amountMicros
 * 1 INR = 1,000,000 micros
 * @param {number|string} priceValue 
 * @returns {{ value: string, currency: string, amountMicros: string }}
 */
function formatGmcPrice(priceValue) {
  const num = Math.max(0, parseFloat(priceValue) || 0);
  const rounded = Number(num.toFixed(2));
  return {
    value: String(rounded),
    currency: 'INR',
    amountMicros: String(Math.round(rounded * 1000000))
  };
}

/**
 * Map MongoDB Item document to Google Merchant Center Product object
 * @param {Object} item - MongoDB Item document (populated)
 * @param {Object} [variant] - Optional specific variant
 * @returns {Object} GMC product payload
 */
function mapItemToGMC(item, variant = null) {
  const isVariant = !!variant;
  
  // Stable Offer ID
  let offerId = '';
  if (isVariant) {
    const varIdentifier = variant._id?.toString() || variant.size || variant.color || 'var';
    offerId = `${item.item_code || item._id.toString()}-${varIdentifier}`;
  } else {
    offerId = item.item_code || item._id.toString();
  }

  // Title
  let title = item.name || item.print_name || 'Footwear Product';
  if (isVariant && (variant.color || variant.size)) {
    const details = [variant.color, variant.size].filter(Boolean).join(', ');
    title = `${title} (${details})`;
  }

  // Description
  const rawDescription = item.long_description || item.short_description || item.specification || item.name || '';
  const description = stripHtml(rawDescription).slice(0, 5000) || title;

  // Product Canonical Link
  const slug = item.slug || generateSlug(item.name || 'product');
  const productLink = `${STORE_DOMAIN}/products/${slug}`;

  // Image URLs
  let primaryImage = null;
  const additionalImages = [];

  // Check variant images first if variant
  if (isVariant && Array.isArray(variant.attribute_image) && variant.attribute_image.length > 0) {
    primaryImage = resolvePublicImageUrl(variant.attribute_image[0]);
  }

  // Fallback to item images
  if (!primaryImage && Array.isArray(item.image) && item.image.length > 0) {
    primaryImage = resolvePublicImageUrl(item.image[0]);
    // Collect additional images (up to 10)
    for (let i = 1; i < Math.min(item.image.length, 11); i++) {
      const extraImg = resolvePublicImageUrl(item.image[i]);
      if (extraImg && extraImg !== primaryImage) {
        additionalImages.push(extraImg);
      }
    }
  }

  if (!primaryImage) {
    primaryImage = `${STORE_DOMAIN}/logo.png`;
  }

  // Stock / Availability
  const currentStock = isVariant ? (variant.stock ?? item.stock ?? 0) : (item.stock ?? 0);
  const availability = (item.is_active && currentStock > 0) ? 'in_stock' : 'out_of_stock';

  // Pricing
  const rawSalePrice = isVariant ? (variant.selling_price || variant.price || item.sale_price || 0) : (item.sale_price || 0);
  const rawMrp = isVariant ? (variant.price || item.mrp || rawSalePrice) : (item.mrp || rawSalePrice);

  const priceObj = formatGmcPrice(rawMrp > rawSalePrice ? rawMrp : rawSalePrice);
  const salePriceObj = rawMrp > rawSalePrice ? formatGmcPrice(rawSalePrice) : null;

  // Brand
  let brandName = 'Logic First';
  if (item.brand_id && typeof item.brand_id === 'object' && item.brand_id.name) {
    brandName = item.brand_id.name;
  } else if (item.brand && typeof item.brand === 'object' && item.brand.name) {
    brandName = item.brand.name;
  }

  // Category
  let categoryName = '';
  if (item.category_id && typeof item.category_id === 'object' && item.category_id.name) {
    categoryName = item.category_id.name;
  } else if (item.category && typeof item.category === 'object' && item.category.name) {
    categoryName = item.category.name;
  }

  // Product Group / Item Group for variants
  let itemGroupId = null;
  if (item.item_group_id) {
    itemGroupId = typeof item.item_group_id === 'object' 
      ? item.item_group_id._id?.toString() 
      : item.item_group_id.toString();
  }

  // Build GMC standard product object
  const gmcProduct = {
    offerId: offerId,
    title: title.slice(0, 150),
    description: description,
    link: productLink,
    imageLink: primaryImage,
    contentLanguage: CONTENT_LANGUAGE,
    targetCountry: TARGET_COUNTRY,
    channel: 'online',
    availability: availability,
    condition: 'new',
    price: {
      value: priceObj.value,
      currency: priceObj.currency
    },
    brand: brandName,
    identifierExists: false,
  };

  if (additionalImages.length > 0) {
    gmcProduct.additionalImageLinks = additionalImages;
  }

  if (salePriceObj) {
    gmcProduct.salePrice = {
      value: salePriceObj.value,
      currency: salePriceObj.currency
    };
  }

  // GTIN or MPN
  if (item.hsn_code) {
    gmcProduct.gtin = item.hsn_code.replace(/[^\d]/g, '');
    gmcProduct.identifierExists = true;
  } else if (item.item_code) {
    gmcProduct.mpn = item.item_code;
    gmcProduct.identifierExists = true;
  }

  // Category breadcrumb / product type
  if (categoryName) {
    gmcProduct.productTypes = [categoryName];
  }

  // Item group (for variants)
  if (itemGroupId || (item.item_attribute?.variant && item.item_attribute.variant.length > 1)) {
    gmcProduct.itemGroupId = itemGroupId || item._id.toString();
  }

  // Sizes and Colors for footwear
  if (isVariant) {
    if (variant.size) gmcProduct.sizes = [String(variant.size)];
    if (variant.color) gmcProduct.color = String(variant.color);
  }

  // Tax configuration (GST)
  if (item.tax_gst) {
    const taxRate = parseFloat(item.tax_gst) || 0;
    if (taxRate > 0) {
      gmcProduct.taxes = [{
        country: TARGET_COUNTRY,
        rate: taxRate,
        taxShip: false
      }];
    }
  }

  return gmcProduct;
}

module.exports = {
  mapItemToGMC,
  resolvePublicImageUrl,
  formatGmcPrice,
  generateSlug,
  stripHtml,
  TARGET_COUNTRY,
  CONTENT_LANGUAGE,
  STORE_DOMAIN
};
