const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
} else {
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
}

const User = require('../models/User');
const Material = require('../models/Material');
const Request = require('../models/Request');
const Order = require('../models/Order');
const { sanitizeObject } = require('../middleware/sanitizeMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
const { validateUploadedImages } = require('../middleware/uploadMiddleware');
const { completeOrder } = require('../controllers/orderController');
const { acceptRequest } = require('../controllers/requestController');

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/construction_exchange';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log(' BuildExchange - Concurrency & Security Hardening Test Suite');
  console.log('===============================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB test database.\n');

    // -------------------------------------------------------------
    // Test 1: NoSQL Injection Sanitization
    // -------------------------------------------------------------
    console.log('--- Test 1: NoSQL Injection Sanitizer ---');
    const maliciousPayload = {
      username: 'legitUser',
      password: { $ne: null },
      nested: {
        normalKey: 'safeValue',
        $where: 'sleep(1000)',
        'profile.admin': true,
      },
      tags: ['item1', { $gt: '' }, 'item2'],
    };

    const sanitized = sanitizeObject(maliciousPayload);
    assert(sanitized.username === 'legitUser', 'Preserves legitimate string properties');
    assert(sanitized.password && typeof sanitized.password === 'object', 'Keeps clean object structure');
    assert(sanitized.password.$ne === undefined, 'Strips $ne MongoDB operator');
    assert(sanitized.nested.$where === undefined, 'Strips $where injection key');
    assert(sanitized.nested['profile.admin'] === undefined, 'Strips keys with dot notation');
    assert(sanitized.nested.normalKey === 'safeValue', 'Preserves safe nested values');
    assert(sanitized.tags[0] === 'item1' && sanitized.tags[2] === 'item2', 'Sanitizes inside arrays properly');
    console.log('');

    // -------------------------------------------------------------
    // Test 2: In-Memory Sliding Window Rate Limiter
    // -------------------------------------------------------------
    console.log('--- Test 2: In-Memory Rate Limiter ---');
    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      message: 'Rate limit hit',
    });

    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 5; i++) {
      const mockReq = { ip: '192.168.1.100', headers: {} };
      let statusCalled = null;
      let jsonResponse = null;
      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          statusCalled = code;
          return {
            json: (data) => {
              jsonResponse = data;
            },
          };
        },
      };

      let nextCalled = false;
      testLimiter(mockReq, mockRes, () => {
        nextCalled = true;
      });

      if (nextCalled) allowedCount++;
      if (statusCalled === 429) blockedCount++;
    }

    assert(allowedCount === 3, 'Allows requests up to maximum threshold (3)');
    assert(blockedCount === 2, 'Rejects requests exceeding threshold with HTTP 429 (2 blocked)');
    console.log('');

    // -------------------------------------------------------------
    // Test 3: Magic Byte Image Validation with Sharp
    // -------------------------------------------------------------
    console.log('--- Test 3: Upload Buffer Magic Byte Inspection ---');
    // Generate valid 10x10 PNG buffer using Sharp
    const validPngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const fakeImageBuffer = Buffer.from('<html><script>alert(1)</script></html>', 'utf-8');

    // Valid buffer test
    let validNextCalled = false;
    await validateUploadedImages(
      { file: { buffer: validPngBuffer, mimetype: 'image/png' } },
      {},
      () => {
        validNextCalled = true;
      }
    );
    assert(validNextCalled === true, 'Accepts authentic PNG image buffer');

    // Spoofed buffer test
    let fakeBlocked = false;
    const fakeRes = {
      status: (code) => {
        if (code === 400) fakeBlocked = true;
        return { json: () => {} };
      },
    };
    await validateUploadedImages(
      { file: { buffer: fakeImageBuffer, mimetype: 'image/jpeg' } },
      fakeRes,
      () => {}
    );
    assert(fakeBlocked === true, 'Rejects spoofed/corrupted image payload with HTTP 400');
    console.log('');

    // -------------------------------------------------------------
    // Test 4: Concurrent Order Completion Race-Condition Safety
    // -------------------------------------------------------------
    console.log('--- Test 4: Concurrent Order Completion Atomic Safety ---');
    // Seed seller and buyer
    let testSeller = await User.findOne({ email: 'concurrency_seller@buildexchange.test' });
    if (!testSeller) {
      testSeller = await User.create({
        name: 'Concurrency Seller',
        email: 'concurrency_seller@buildexchange.test',
        password: 'password123',
        phone: '9876543210',
        role: 'seller',
      });
    }

    let testBuyer = await User.findOne({ email: 'concurrency_buyer@buildexchange.test' });
    if (!testBuyer) {
      testBuyer = await User.create({
        name: 'Concurrency Buyer',
        email: 'concurrency_buyer@buildexchange.test',
        password: 'password123',
        phone: '9876543211',
        role: 'buyer',
      });
    }

    // Create material with stock 10
    const testMaterial = await Material.create({
      sellerId: testSeller._id,
      name: 'Steel Rebar 12mm Concurrent Test',
      category: 'Structural Steel',
      description: 'Test material for concurrency verification',
      quantity: 10,
      unit: 'Pieces',
      condition: 'New',
      price: 500,
      images: [{ url: '/uploads/test.jpg', public_id: 'test_mat_1' }],
      address: 'Industrial Yard 4',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400001',
      status: 'available',
      isApproved: true,
    });

    // Create order for 4 pieces (should leave 6)
    const testOrder = await Order.create({
      buyerId: testBuyer._id,
      sellerId: testSeller._id,
      materialId: testMaterial._id,
      quantity: 4,
      unitPrice: 500,
      totalPrice: 2000,
      status: 'Ready for Pickup',
      pickupAddress: 'Industrial Yard 4',
      pickupCity: 'Mumbai',
      pickupDate: '2026-11-01',
      pickupStartTime: '10:00 AM',
      pickupEndTime: '01:00 PM',
    });

    // Fire 2 concurrent completeOrder calls simultaneously
    const results = [];
    const runComplete = async (reqId) => {
      const mockReq = {
        params: { id: testOrder._id },
        user: { _id: testSeller._id, role: 'seller' },
      };
      return new Promise((resolve) => {
        const mockRes = {
          status: (code) => ({
            json: (data) => resolve({ id: reqId, code, data }),
          }),
          json: (data) => resolve({ id: reqId, code: 200, data }),
        };
        completeOrder(mockReq, mockRes, (err) => resolve({ id: reqId, code: 500, error: err }));
      });
    };

    const [resp1, resp2] = await Promise.all([runComplete(1), runComplete(2)]);
    const codes = [resp1.code, resp2.code];

    assert(codes.includes(200), 'One concurrent completion request succeeds with HTTP 200');
    assert(codes.includes(400), 'The second concurrent completion request is rejected with HTTP 400');

    // Verify stock in database
    const refreshedMaterial = await Material.findById(testMaterial._id);
    assert(
      refreshedMaterial.quantity === 6,
      `Material quantity deducted exactly once (Expected: 6, Actual: ${refreshedMaterial.quantity})`
    );

    const refreshedOrder = await Order.findById(testOrder._id);
    assert(refreshedOrder.status === 'Completed', 'Order status is Completed');
    console.log('');

    // -------------------------------------------------------------
    // Test 5: Concurrent Request Acceptance Safety
    // -------------------------------------------------------------
    console.log('--- Test 5: Concurrent Request Acceptance Atomic Safety ---');
    const testRequest = await Request.create({
      buyerId: testBuyer._id,
      sellerId: testSeller._id,
      materialId: testMaterial._id,
      quantity: 2,
      message: 'Need 2 pieces urgently',
      contactPhone: '9876543211',
      status: 'pending',
    });

    const runAccept = async (reqId) => {
      const mockReq = {
        params: { id: testRequest._id },
        user: { _id: testSeller._id, role: 'seller' },
        body: {
          pickupAddress: 'Yard 4 Gate 1',
          pickupCity: 'Mumbai',
          pickupDate: '2026-11-05',
          pickupStartTime: '11:00 AM',
          pickupEndTime: '02:00 PM',
          sellerMessage: 'Ready for pickup',
        },
      };
      return new Promise((resolve) => {
        const mockRes = {
          status: (code) => ({
            json: (data) => resolve({ id: reqId, code, data }),
          }),
          json: (data) => resolve({ id: reqId, code: 200, data }),
        };
        acceptRequest(mockReq, mockRes, (err) => resolve({ id: reqId, code: 500, error: err }));
      });
    };

    const [acc1, acc2] = await Promise.all([runAccept(1), runAccept(2)]);
    const accCodes = [acc1.code, acc2.code];

    assert(accCodes.includes(200), 'First concurrent acceptRequest call succeeds with HTTP 200');
    assert(accCodes.includes(400), 'Second concurrent acceptRequest call is rejected with HTTP 400');

    // Count created orders for this request
    const ordersForRequest = await Order.find({ requestId: testRequest._id });
    assert(
      ordersForRequest.length === 1,
      `Exactly one order created for request (Expected: 1, Actual: ${ordersForRequest.length})`
    );
    console.log('');

    // Clean up test records
    await Material.deleteMany({ _id: testMaterial._id });
    await Order.deleteMany({ _id: { $in: [testOrder._id, ...ordersForRequest.map((o) => o._id)] } });
    await Request.deleteMany({ _id: testRequest._id });
    await User.deleteMany({ _id: { $in: [testSeller._id, testBuyer._id] } });

    console.log('===============================================================');
    console.log(` Summary: ${passedTests}/${totalTests} Tests Passed, ${failedTests} Failed.`);
    console.log('===============================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
