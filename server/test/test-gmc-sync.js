/**
 * GMC Synchronization Test Suite
 * Validates product mapping, image URL resolution, price calculation, error categorization, and queue operations
 */

const assert = require('assert');
const { 
  mapItemToGMC, 
  resolvePublicImageUrl, 
  formatGmcPrice, 
  generateSlug,
  stripHtml 
} = require('../services/gmc/gmcMapper');
const { categorizeError } = require('../services/gmc/gmcClient');
const { enqueueGmcJob, getQueueMetrics, initGmcQueue } = require('../services/gmc/gmcQueue');

async function runTests() {
  console.log('🧪 Starting Google Merchant Center (GMC) Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function it(description, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  async function itAsync(description, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  // --- Group 1: Price & Formatting Tests ---
  console.log('--- Group 1: Price & Formatting ---');
  it('should format Indian Rupee prices and convert to amountMicros correctly', () => {
    const res = formatGmcPrice(1299.50);
    assert.strictEqual(res.value, '1299.5');
    assert.strictEqual(res.currency, 'INR');
    assert.strictEqual(res.amountMicros, '1299500000');
  });

  it('should handle zero, integer, and fractional prices safely', () => {
    const zero = formatGmcPrice(0);
    assert.strictEqual(zero.value, '0');
    assert.strictEqual(zero.amountMicros, '0');

    const intVal = formatGmcPrice(500);
    assert.strictEqual(intVal.value, '500');
    assert.strictEqual(intVal.amountMicros, '500000000');
  });

  it('should strip HTML tags and clean descriptions', () => {
    const html = '<p>Stylish <b>Leather Shoes</b> with <span class="tag">comfort</span>.</p>';
    const cleaned = stripHtml(html);
    assert.strictEqual(cleaned, 'Stylish Leather Shoes with comfort.');
  });

  it('should generate URL-friendly SEO slugs', () => {
    const slug = generateSlug('Men\'s Running Shoes & Sneakers 2026!');
    assert.strictEqual(slug, 'mens-running-shoes-sneakers-2026');
  });

  // --- Group 2: Public Image URL Resolution Tests ---
  console.log('\n--- Group 2: Image URL Resolution & Security ---');
  it('should preserve external public CDN and Cloudinary HTTPS URLs', () => {
    const cloudUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const resolved = resolvePublicImageUrl(cloudUrl);
    assert.strictEqual(resolved, cloudUrl);
  });

  it('should resolve relative local image paths to absolute public URLs', () => {
    const relPath = '/uploadFile/items/shoe101/main.png';
    const resolved = resolvePublicImageUrl(relPath);
    assert.ok(resolved.startsWith('http'));
    assert.ok(resolved.includes('/uploadFile/items/shoe101/main.png'));
  });

  it('should reject local Windows / Linux filesystem paths for safety', () => {
    const winPath = 'C:\\uploads\\shoe.jpg';
    const resolved = resolvePublicImageUrl(winPath);
    assert.strictEqual(resolved, null);
  });

  // --- Group 3: Product Mapping Tests ---
  console.log('\n--- Group 3: MongoDB Item to GMC Mapping ---');
  it('should correctly map standard product with MRP, discount, stock, and HSN/GTIN', () => {
    const mockItem = {
      _id: '60d5ec49f1b2c8b1f8e4e1a1',
      item_code: 'SHOE-101',
      name: 'Classic Oxford Leather Shoe',
      long_description: 'Handcrafted premium leather oxford shoes.',
      sale_price: 1999,
      mrp: 2999,
      stock: 15,
      tax_gst: '18',
      hsn_code: '6403',
      is_active: true,
      image: ['https://cdn.example.com/shoes/oxford-1.jpg', 'https://cdn.example.com/shoes/oxford-2.jpg'],
      category_id: { name: 'Formal Shoes' },
      brand_id: { name: 'Logic First Footwear' }
    };

    const gmc = mapItemToGMC(mockItem);
    assert.strictEqual(gmc.offerId, 'SHOE-101');
    assert.strictEqual(gmc.title, 'Classic Oxford Leather Shoe');
    assert.strictEqual(gmc.availability, 'in_stock');
    assert.strictEqual(gmc.price.value, '2999'); // Regular/MRP
    assert.strictEqual(gmc.salePrice.value, '1999'); // Discounted
    assert.strictEqual(gmc.gtin, '6403');
    assert.strictEqual(gmc.brand, 'Logic First Footwear');
    assert.strictEqual(gmc.imageLink, 'https://cdn.example.com/shoes/oxford-1.jpg');
    assert.strictEqual(gmc.additionalImageLinks.length, 1);
  });

  it('should map out-of-stock product when stock is 0 or negative', () => {
    const mockItem = {
      _id: '60d5ec49f1b2c8b1f8e4e1a2',
      name: 'Sold Out Sneaker',
      sale_price: 999,
      stock: 0,
      is_active: true,
      image: ['https://cdn.example.com/shoes/sneaker.jpg']
    };

    const gmc = mapItemToGMC(mockItem);
    assert.strictEqual(gmc.availability, 'out_of_stock');
  });

  it('should map variant items with unique stable offerIds and variant details', () => {
    const mockItem = {
      _id: '60d5ec49f1b2c8b1f8e4e1a3',
      item_code: 'RUN-500',
      name: 'Aero Running Shoes',
      sale_price: 1499,
      mrp: 1499,
      stock: 20,
      is_active: true,
      image: ['https://cdn.example.com/shoes/run.jpg'],
    };

    const mockVariant = {
      _id: 'var-sz-8-blk',
      size: '8',
      color: 'Black',
      selling_price: 1499,
      stock: 5
    };

    const gmcVariant = mapItemToGMC(mockItem, mockVariant);
    assert.strictEqual(gmcVariant.offerId, 'RUN-500-var-sz-8-blk');
    assert.strictEqual(gmcVariant.title, 'Aero Running Shoes (Black, 8)');
    assert.deepStrictEqual(gmcVariant.sizes, ['8']);
    assert.strictEqual(gmcVariant.color, 'Black');
  });

  // --- Group 4: Error Categorization Tests ---
  console.log('\n--- Group 4: Error Categorization & Retry Rules ---');
  it('should classify timeout and network errors as temporary and retryable', () => {
    const timeoutErr = new Error('timeout of 15000ms exceeded');
    timeoutErr.code = 'ECONNABORTED';
    const cat = categorizeError(timeoutErr);
    assert.strictEqual(cat.code, 'TEMPORARY_ERROR');
    assert.strictEqual(cat.isTemporary, true);
  });

  it('should classify 429 rate limit as temporary', () => {
    const rateErr = {
      response: {
        status: 429,
        data: { error: { message: 'Too Many Requests' } }
      }
    };
    const cat = categorizeError(rateErr);
    assert.strictEqual(cat.code, 'RATE_LIMIT');
    assert.strictEqual(cat.isTemporary, true);
  });

  it('should classify 400 validation and image errors as non-retryable permanent errors', () => {
    const validErr = {
      response: {
        status: 400,
        data: { error: { message: 'Invalid image link URL' } }
      }
    };
    const cat = categorizeError(validErr);
    assert.strictEqual(cat.code, 'IMAGE_ERROR');
    assert.strictEqual(cat.isTemporary, false);
  });

  // --- Group 5: Queue & Async System Tests ---
  console.log('\n--- Group 5: Queue & Resilience ---');
  await itAsync('should initialize queue and accept background jobs safely', async () => {
    initGmcQueue();
    await enqueueGmcJob({ action: 'CREATE', itemId: '507f1f77bcf86cd799439011' }, 100);
    const metrics = await getQueueMetrics();
    assert.ok(metrics.mode);
  });

  // --- Summary ---
  console.log('\n=========================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('=========================================\n');

  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
