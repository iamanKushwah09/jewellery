const mongoose = require('mongoose');
require('dotenv').config();

// Test script to verify customer order fix
const testCustomerOrderFix = async () => {
  try {
    console.log('🔧 Testing Customer Order Fix...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Database connected');
    
    // Import models
    const Customer = require('./models/customer.model');
    const orderDetailsModel = require('./models/orderDetails.model');
    
    // Test 1: Check if customers exist
    const customerCount = await Customer.countDocuments();
    console.log(`📊 Total customers in database: ${customerCount}`);
    
    // Test 2: Check if orders exist
    const orderCount = await orderDetailsModel.countDocuments();
    console.log(`📊 Total orders in database: ${orderCount}`);
    
    // Test 3: Find a sample customer
    const sampleCustomer = await Customer.findOne().select('_id name email group_type');
    if (sampleCustomer) {
      console.log('👤 Sample customer found:', {
        id: sampleCustomer._id,
        name: sampleCustomer.name,
        email: sampleCustomer.email,
        group_type: sampleCustomer.group_type
      });
      
      // Test 4: Check ObjectId validation
      const isValidObjectId = sampleCustomer._id.toString().match(/^[0-9a-fA-F]{24}$/);
      console.log(`🔍 Customer ID format valid: ${!!isValidObjectId}`);
      
      // Test 5: Find orders for this customer
      const customerOrders = await orderDetailsModel.find({ customers_id: sampleCustomer._id }).limit(3);
      console.log(`📦 Orders found for customer: ${customerOrders.length}`);
      
      if (customerOrders.length > 0) {
        console.log('📦 Sample order:', {
          id: customerOrders[0]._id,
          order_no: customerOrders[0].order_no,
          status: customerOrders[0].status,
          total_amount: customerOrders[0].total_amount
        });
      }
    } else {
      console.log('❌ No customers found in database');
    }
    
    console.log('✅ Customer Order Fix Test Completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

// Run the test
testCustomerOrderFix();