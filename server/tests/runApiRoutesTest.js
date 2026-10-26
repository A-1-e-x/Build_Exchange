const path = require('path');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');
const Material = require('../models/Material');
const ImageAnalysis = require('../models/ImageAnalysis');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

function makeRequest(server, options, postData = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      ...options,
      port,
      host: '127.0.0.1',
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      if (typeof postData === 'string' || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runRouteTests() {
  console.log('===============================================================');
  console.log('   AI Endpoints & Authorization Security Test Suite');
  console.log('===============================================================\n');

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}\n`);

  try {
    // Setup test users
    const seller = await User.findOneAndUpdate(
      { email: 'api.seller@example.com' },
      {
        name: 'API Test Seller',
        email: 'api.seller@example.com',
        phone: '9876543211',
        password: 'Password@123',
        role: 'seller',
      },
      { upsert: true, new: true }
    );

    const admin = await User.findOneAndUpdate(
      { email: 'api.admin@example.com' },
      {
        name: 'API Test Admin',
        email: 'api.admin@example.com',
        phone: '9876543212',
        password: 'Password@123',
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    const jwtSecret =
      process.env.JWT_SECRET || 'mca_minor_project_construction_material_exchange_super_secret_jwt_key_2026';
    const sellerToken = jwt.sign({ id: seller._id }, jwtSecret, { expiresIn: '1d' });
    const adminToken = jwt.sign({ id: admin._id }, jwtSecret, { expiresIn: '1d' });

    // -------------------------------------------------------------
    // Test 1: Unauthenticated request to /api/ai/flagged
    // -------------------------------------------------------------
    console.log('Test Suite 1: Authentication Guard Enforcement');
    const unauthRes = await makeRequest(server, {
      path: '/api/ai/flagged',
      method: 'GET',
    });
    assert(
      unauthRes.status === 401,
      'Test 1.1: Unauthenticated request to /api/ai/flagged is rejected with 401 Unauthorized',
      `Got status: ${unauthRes.status}`
    );

    // -------------------------------------------------------------
    // Test 2: Seller attempting to access Admin-only /api/ai/flagged
    // -------------------------------------------------------------
    console.log('\nTest Suite 2: Role Authorization Enforcement');
    const sellerAccessRes = await makeRequest(server, {
      path: '/api/ai/flagged',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
    });
    assert(
      sellerAccessRes.status === 403,
      'Test 2.1: Seller token accessing Admin-only flagged images route is rejected with 403 Forbidden',
      `Got status: ${sellerAccessRes.status}`
    );

    // -------------------------------------------------------------
    // Test 3: Admin accessing /api/ai/flagged
    // -------------------------------------------------------------
    const adminAccessRes = await makeRequest(server, {
      path: '/api/ai/flagged',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(
      adminAccessRes.status === 200 && adminAccessRes.body.success === true,
      'Test 3.1: Admin token accessing /api/ai/flagged succeeds with 200 OK',
      `Got status: ${adminAccessRes.status}`
    );

    // -------------------------------------------------------------
    // Test 4: Admin accessing /api/ai/stats
    // -------------------------------------------------------------
    console.log('\nTest Suite 3: AI Aggregated Statistics Endpoint');
    const adminStatsRes = await makeRequest(server, {
      path: '/api/ai/stats',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(
      adminStatsRes.status === 200 && adminStatsRes.body.success === true,
      'Test 4.1: Admin accessing /api/ai/stats returns HTTP 200'
    );
    assert(
      typeof adminStatsRes.body.stats?.totalAnalyses === 'number',
      'Test 4.2: /api/ai/stats includes totalAnalyses metric'
    );

    // -------------------------------------------------------------
    // Test 5: Admin reviewing an analysis flag via PATCH /api/ai/:id/review
    // -------------------------------------------------------------
    console.log('\nTest Suite 4: Admin Review API Endpoint');
    const sampleRecord = await ImageAnalysis.create({
      imageUrl: '/uploads/sample_test.png',
      imageHash: '1234567890abcdef',
      result: 'likely_duplicate',
      reviewStatus: 'not_reviewed',
    });

    const patchRes = await makeRequest(
      server,
      {
        path: `/api/ai/${sampleRecord._id}/review`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        reviewStatus: 'confirmed',
        reviewNotes: 'Verified duplicate through admin panel test',
      }
    );

    assert(
      patchRes.status === 200 && patchRes.body.success === true,
      'Test 5.1: PATCH /api/ai/:analysisId/review succeeds with HTTP 200',
      `Got status: ${patchRes.status}`
    );
    assert(
      patchRes.body.analysis?.reviewStatus === 'confirmed',
      'Test 5.2: Review status successfully updated to confirmed'
    );

    // Test invalid review status
    const invalidPatchRes = await makeRequest(
      server,
      {
        path: `/api/ai/${sampleRecord._id}/review`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        reviewStatus: 'unsupported_state_xyz',
      }
    );
    assert(
      invalidPatchRes.status === 400,
      'Test 5.3: Invalid reviewStatus returns 400 Bad Request'
    );

    // Clean up
    await ImageAnalysis.deleteOne({ _id: sampleRecord._id });
    await User.deleteMany({ email: { $in: ['api.seller@example.com', 'api.admin@example.com'] } });

    console.log('\n===============================================================');
    console.log(`   API ROUTE TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================\n');

    server.close();
    if (failedTests === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('API Test Error:', error);
    server.close();
    process.exit(1);
  }
}

runRouteTests();
