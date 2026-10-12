const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Item = require('../models/item.model');
const Category = require('../models/category.model');
const ItemGroup = require('../models/itemGroup.model');
const Product = require('../models/Product');

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/logicfirstadmin';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    // 1. Create or Find Categories
    const categoriesData = [
      { name: 'Accounting Software', description: 'Business accounting and GST solutions', is_active: true, status: 'show' },
      { name: 'Cloud Infrastructure', description: 'High-speed cloud servers for ERP & accounting', is_active: true, status: 'show' },
      { name: 'Custom ERP Addons', description: 'Specialized plugins and integrations', is_active: true, status: 'show' },
      { name: 'POS & Retail Hardware', description: 'Receipt printers, barcode scanners, and retail POS equipment', is_active: true, status: 'show' },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        existing = await Category.create(cat);
        console.log(`Created category: ${cat.name}`);
      }
      categoryMap[cat.name] = existing._id;
    }

    // 2. Create or Find Item Groups
    const groupData = [
      { name: 'Software Licenses', is_active: true, is_parent_group: true, showOnWebsite: true },
      { name: 'Cloud Hosting', is_active: true, is_parent_group: true, showOnWebsite: true },
      { name: 'Integrations & Tools', is_active: true, is_parent_group: true, showOnWebsite: true },
      { name: 'Retail Hardware', is_active: true, is_parent_group: true, showOnWebsite: true },
    ];

    const groupMap = {};
    for (const grp of groupData) {
      let existing = await ItemGroup.findOne({ name: grp.name });
      if (!existing) {
        existing = await ItemGroup.create(grp);
        console.log(`Created group: ${grp.name}`);
      }
      groupMap[grp.name] = existing._id;
    }

    // 3. Define Professional Products
    const demoItems = [
      {
        name: 'BUSY 21 Accounting Software - Enterprise Multi-User Edition',
        item_code: 'BSY-ENT-MU',
        alias: 'Busy Enterprise',
        category_id: categoryMap['Accounting Software'],
        item_group_id: groupMap['Software Licenses'],
        sale_price: 18000,
        mrp: 22000,
        discount: 18,
        stock: 50,
        tax_gst: '18',
        hsn_code: '997331',
        short_description: 'Complete business accounting software with multi-branch management, advanced inventory, e-invoicing and payroll.',
        long_description: 'BUSY Enterprise Edition is designed for medium and large enterprises requiring comprehensive financial accounting, multi-location inventory tracking, configurable invoice formats, automated GST/e-way bill generation, and workflow approvals.',
        specification: 'Multi-User License | Windows Compatible | Lifetime License with 1-year free upgrades | Real-time GST Filing',
        image: [{ url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 50,
            price: 22000,
            selling_price: 18000
          }]
        }
      },
      {
        name: 'High-Performance Dedicated Cloud Server for Tally & Busy (16GB RAM, NVMe SSD)',
        item_code: 'CS-16GB-NVME',
        alias: 'LogicFirst Cloud Server',
        category_id: categoryMap['Cloud Infrastructure'],
        item_group_id: groupMap['Cloud Hosting'],
        sale_price: 3499,
        mrp: 4999,
        discount: 30,
        stock: 100,
        tax_gst: '18',
        hsn_code: '998315',
        short_description: 'Ultra-fast, secure cloud server tailored for multi-user accounting software with 99.9% uptime and automatic daily backups.',
        long_description: 'Access your Busy or Tally data seamlessly from anywhere in the world with zero hardware maintenance cost. Features dedicated SSD NVMe storage, anti-ransomware protection, high-speed remote desktop access, and automated cloud snapshots.',
        specification: '16GB Dedicated RAM | 4 vCPU High-Performance Intel Xeon | 200GB NVMe Storage | 99.9% Uptime SLA | Daily Backups',
        image: [{ url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 100,
            price: 4999,
            selling_price: 3499
          }]
        }
      },
      {
        name: 'LogicFirst Automated GST & E-Way Bill Sync Connector',
        item_code: 'LF-EWAY-SYNC',
        alias: 'E-Way Bill Plugin',
        category_id: categoryMap['Custom ERP Addons'],
        item_group_id: groupMap['Integrations & Tools'],
        sale_price: 5999,
        mrp: 7500,
        discount: 20,
        stock: 75,
        tax_gst: '18',
        hsn_code: '998313',
        short_description: 'One-click direct synchronization addon for generating E-Invoices and E-Way Bills directly from your ERP without portal login.',
        long_description: 'Eliminate manual entry errors and speed up your dispatch operations. This integration module auto-validates HSN codes, generates QR codes, produces e-way bills instantly, and updates status in your accounting software.',
        specification: 'Direct NIC Portal API Integration | Bulk Generation Support | Auto Cancel & Update | Instant WhatsApp PDF Dispatch',
        image: [{ url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 75,
            price: 7500,
            selling_price: 5999
          }]
        }
      },
      {
        name: 'TallyPrime Gold Edition - Multi-User Corporate License',
        item_code: 'TALLY-GOLD-MU',
        alias: 'TallyPrime Gold',
        category_id: categoryMap['Accounting Software'],
        item_group_id: groupMap['Software Licenses'],
        sale_price: 54000,
        mrp: 60000,
        discount: 10,
        stock: 30,
        tax_gst: '18',
        hsn_code: '997331',
        short_description: 'Industry-standard enterprise accounting and compliance solution with unlimited concurrent user access on LAN.',
        long_description: 'TallyPrime Gold provides comprehensive business management capabilities for enterprises. Manage accounts, inventory, statutory compliance, banking reconciliation, and multi-currency transactions with complete data security.',
        specification: 'Unlimited LAN Users | Complete GST Compliance | Multi-Currency | e-Payments & Banking Reconciliation Support',
        image: [{ url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 30,
            price: 60000,
            selling_price: 54000
          }]
        }
      },
      {
        name: 'LogicFirst Bulk WhatsApp Marketing & SMS Gateway Suite',
        item_code: 'LF-WA-BULK',
        alias: 'Bulk WhatsApp & SMS Tool',
        category_id: categoryMap['Custom ERP Addons'],
        item_group_id: groupMap['Integrations & Tools'],
        sale_price: 4499,
        mrp: 6000,
        discount: 25,
        stock: 100,
        tax_gst: '18',
        hsn_code: '998314',
        short_description: 'Enterprise bulk WhatsApp messaging & automated SMS notification software with template builder, campaign analytics, and anti-ban protection.',
        long_description: 'Transform customer communication with our automated Bulk WhatsApp and SMS marketing platform. Connect your CRM/ERP to send order alerts, payment reminders, promotional campaigns, and interactive catalogs directly on WhatsApp with official API support.',
        specification: 'Unlimited Contacts | Multi-Device Login | Smart Delay Anti-Ban Algorithm | Media Attachment Support (PDF, Image, Video) | Detailed Delivery Reports',
        image: [{ url: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 100,
            price: 6000,
            selling_price: 4499
          }]
        }
      },
      {
        name: 'LogicFirst 80mm High-Speed POS Thermal Receipt Printer (Auto-Cutter, USB/LAN/Bluetooth)',
        item_code: 'LF-POS-80MM',
        alias: '80mm Thermal Printer',
        category_id: categoryMap['POS & Retail Hardware'],
        item_group_id: groupMap['Retail Hardware'],
        sale_price: 4499,
        mrp: 6500,
        discount: 31,
        stock: 45,
        tax_gst: '18',
        hsn_code: '844332',
        short_description: 'Ultra-fast heavy-duty 80mm thermal receipt printer with auto-cutter, ESC/POS command support, and triple interface (USB + LAN + Bluetooth).',
        long_description: 'Engineered for high-volume retail billing, restaurants, supermarkets, and warehouses. Integrates seamlessly with BUSY, TallyPrime, and all custom POS billing software. Features high-speed printing (260mm/s), durable Japanese printhead, and automatic cutter mechanism.',
        specification: '80mm Paper Width | 260mm/s Print Speed | Auto Cutter (1.5M cuts) | USB + LAN + Bluetooth | ESC/POS Compatible | Windows, Linux & Android Support',
        image: [{ url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 45,
            price: 6500,
            selling_price: 4499
          }]
        }
      },
      {
        name: 'LogicFirst Wireless 2D Barcode & QR Code Scanner with Auto-Sensing Stand',
        item_code: 'LF-SCAN-2D',
        alias: 'Wireless 2D Scanner',
        category_id: categoryMap['POS & Retail Hardware'],
        item_group_id: groupMap['Retail Hardware'],
        sale_price: 2899,
        mrp: 4200,
        discount: 31,
        stock: 60,
        tax_gst: '18',
        hsn_code: '847160',
        short_description: 'High-precision 2.4GHz wireless and Bluetooth 2D barcode scanner with hands-free auto-sensing stand for retail and inventory.',
        long_description: 'Reads damaged, faded, or reflective 1D & 2D barcodes directly from mobile screens or paper labels. Equipped with a long-range 2.4GHz wireless dongle, Bluetooth connectivity, and 2000mAh rechargeable lithium battery supporting up to 30 hours of continuous scanning.',
        specification: '1D & 2D QR Code Support | CMOS Image Sensor | 2.4GHz Wireless + Bluetooth + USB Wired | Auto-Sensing Stand Included | 2000mAh Battery | Drop-Resistant Design',
        image: [{ url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 60,
            price: 4200,
            selling_price: 2899
          }]
        }
      },
      {
        name: 'LogicFirst Instant WhatsApp Invoice & Payment Reminder Add-on for BUSY & Tally',
        item_code: 'LF-WA-INVOICE',
        alias: 'Instant WhatsApp Invoice Plugin',
        category_id: categoryMap['Custom ERP Addons'],
        item_group_id: groupMap['Integrations & Tools'],
        sale_price: 3199,
        mrp: 4500,
        discount: 29,
        stock: 80,
        tax_gst: '18',
        hsn_code: '998313',
        short_description: 'One-click automated WhatsApp invoice, payment reminder, and outstanding ledger statement dispatch add-on for BUSY & Tally.',
        long_description: 'Save hours of manual billing work. Automatically send PDF invoices, receipts, dispatch slips, and payment reminder links with UPI QR codes directly to your customer WhatsApp numbers immediately upon saving transactions.',
        specification: '1-Click Automatic Send | PDF Invoice Attachment | Outstanding Payment Alerts with UPI QR | Multi-Language Template Customization | Lifetime Free Updates',
        image: [{ url: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=800&auto=format&fit=crop&q=60' }],
        is_active: true,
        showOnWebsite: true,
        item_attribute: {
          variant: [{
            stock: 80,
            price: 4500,
            selling_price: 3199
          }]
        }
      }
    ];

    for (const itemData of demoItems) {
      // Upsert into Item collection
      let existing = await Item.findOne({ item_code: itemData.item_code });
      if (existing) {
        await Item.updateOne({ item_code: itemData.item_code }, itemData);
        console.log(`Updated Item: ${itemData.name}`);
      } else {
        await Item.create(itemData);
        console.log(`Created Item: ${itemData.name}`);
      }

      // Also create corresponding Product record for compatibility with store endpoints
      const slug = itemData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const productDoc = {
        title: { en: itemData.name },
        description: { en: itemData.long_description },
        slug: slug,
        categories: [itemData.category_id],
        category: itemData.category_id,
        image: [itemData.image[0].url],
        stock: itemData.stock,
        prices: {
          originalPrice: itemData.mrp,
          price: itemData.sale_price,
          discount: itemData.discount
        },
        isCombination: false,
        status: 'show',
        sku: itemData.item_code
      };

      let existingProduct = await Product.findOne({ slug: slug });
      if (existingProduct) {
        await Product.updateOne({ slug: slug }, productDoc);
        console.log(`Updated Product: ${itemData.name}`);
      } else {
        await Product.create(productDoc);
        console.log(`Created Product: ${itemData.name}`);
      }
    }

    console.log('🎉 Successfully seeded 4 demo products for LogicFirst UI!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding items:', err);
    process.exit(1);
  }
}

seed();
