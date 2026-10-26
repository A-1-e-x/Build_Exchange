const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Material = require('../models/Material');
const ImageAnalysis = require('../models/ImageAnalysis');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'mca_minor_project_construction_material_exchange_super_secret_jwt_key_2026';

const makeRequest = (server, options, body = null) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: options.path,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

async function runTest() {
  console.log('===============================================================');
  console.log('   Testing Flagged Material & Admin Image Monitoring Fixes');
  console.log('===============================================================\n');

  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, '127.0.0.1', res));

  try {
    // 1. Setup test admin and buyer users
    await User.deleteMany({ email: { $in: ['test_flag_admin@example.com', 'test_flag_buyer@example.com'] } });

    const adminUser = await User.create({
      name: 'Admin Image Officer',
      email: 'test_flag_admin@example.com',
      password: 'Password123!',
      role: 'admin',
      phone: '9876543210',
    });

    const buyerUser = await User.create({
      name: 'Buyer User',
      email: 'test_flag_buyer@example.com',
      password: 'Password123!',
      role: 'buyer',
      phone: '9876543211',
    });

    const adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    const buyerToken = jwt.sign({ id: buyerUser._id, role: 'buyer' }, JWT_SECRET, { expiresIn: '1d' });

    // 2. Setup a test material and ImageAnalysis record that was initially LIKELY_ORIGINAL
    const testMaterial = await Material.create({
      sellerId: adminUser._id,
      name: 'Verified Concrete Test Batch #999',
      category: 'Cement',
      description: 'High quality cement batch for verification testing',
      quantity: 50,
      unit: 'bags',
      condition: 'New',
      price: 450,
      address: 'Industrial Plot 4',
      city: 'Ahmedabad',
      district: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      status: 'available',
      isApproved: true,
      verificationSummary: {
        status: 'LIKELY_ORIGINAL',
        origin: 'camera_captured',
        riskScore: 10,
        duplicateMatch: false,
        checkedAt: new Date(),
      },
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample_cement.jpg',
          public_id: 'sample_cement_999',
        },
      ],
    });

    const initialAnalysis = await ImageAnalysis.create({
      materialId: testMaterial._id,
      sellerId: adminUser._id,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample_cement.jpg',
      exactFileHash: 'abcd1234efgh5678',
      imageHash: 'fedcba9876543210',
      verificationStatus: 'LIKELY_ORIGINAL',
      imageOriginPrediction: 'camera_captured',
      riskScore: 10,
      confidenceLevel: 'HIGH',
      result: 'no_match',
      analysisStatus: 'completed',
      reviewStatus: 'not_reviewed',
    });

    console.log('[Test 1]: Before review - Material is listed to buyers');
    const browseRes1 = await makeRequest(server, {
      path: '/api/materials?search=Verified+Concrete+Test+Batch+%23999',
      method: 'GET',
    });
    console.log(`Browse result count: ${browseRes1.body.materials?.length}`);
    if (browseRes1.body.materials?.length !== 1) {
      throw new Error(`Expected material to be browsable before flag, got ${browseRes1.body.materials?.length}`);
    }
    console.log('  [PASS] Material is currently browsable when LIKELY_ORIGINAL.\n');

    // 3. Admin accepts the flag on this LIKELY_ORIGINAL image
    console.log('[Test 2]: Admin accepts the flag on this Likely Original item');
    const reviewRes = await makeRequest(
      server,
      {
        path: `/api/ai/${initialAnalysis._id}/review`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        reviewStatus: 'confirmed',
        reviewNotes: 'Admin verified this photo is actually stolen/inauthentic',
      }
    );

    console.log(`Review patch response: status=${reviewRes.status}, success=${reviewRes.body.success}`);
    if (reviewRes.status !== 200 || !reviewRes.body.success) {
      throw new Error(`Review PATCH failed: ${JSON.stringify(reviewRes.body)}`);
    }
    if (reviewRes.body.analysis.verificationStatus === 'LIKELY_ORIGINAL') {
      throw new Error('Expected analysis.verificationStatus to no longer be LIKELY_ORIGINAL after confirming flag');
    }
    console.log(`Analysis verificationStatus updated to: ${reviewRes.body.analysis.verificationStatus}`);
    console.log('  [PASS] Flag accepted: Analysis updated to confirmed and flagged status.\n');

    // 4. Verify it is shown in "All Flags" (GET /api/ai/flagged?verificationStatus=all&reviewStatus=all)
    console.log('[Test 3]: Verify accepted flag is shown in All Flags (verificationStatus=all)');
    const allFlagsRes = await makeRequest(server, {
      path: '/api/ai/flagged?verificationStatus=all&reviewStatus=all',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    console.log(`All Flags total count: ${allFlagsRes.body.total}`);
    const foundInAll = allFlagsRes.body.flagged?.some(
      (item) => item._id.toString() === initialAnalysis._id.toString()
    );
    if (!foundInAll) {
      throw new Error('The accepted flag was NOT found in GET /api/ai/flagged with verificationStatus=all!');
    }
    console.log('  [PASS] Accepted flag IS shown in All Flags!\n');

    // 5. Verify the flagged material is NO LONGER listed to buyers browsing materials
    console.log('[Test 4]: Verify flagged material is NOT listed in browsing materials to buyer');
    const browseRes2 = await makeRequest(server, {
      path: '/api/materials?search=Verified+Concrete+Test+Batch+%23999',
      method: 'GET',
    });
    console.log(`Browse result count after flag: ${browseRes2.body.materials?.length}`);
    const foundInBrowse = browseRes2.body.materials?.some(
      (m) => m._id.toString() === testMaterial._id.toString()
    );
    if (foundInBrowse) {
      throw new Error('Flagged material should NOT be listed in browsing materials to buyer!');
    }
    console.log('  [PASS] Flagged material is NOT listed in browsing materials to buyer!\n');

    // 6. Verify buyer directly accessing /api/materials/:id is denied/unavailable
    console.log('[Test 5]: Verify buyer directly accessing /api/materials/:id gets 404/under review');
    const directRes = await makeRequest(server, {
      path: `/api/materials/${testMaterial._id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${buyerToken}`,
      },
    });
    console.log(`Buyer direct access status: ${directRes.status}`);
    if (directRes.status !== 404) {
      throw new Error(`Expected 404 for flagged material direct buyer access, got ${directRes.status}`);
    }
    console.log('  [PASS] Flagged material is blocked from direct buyer access!\n');

    // 7. Verify dismissing the flag restores material visibility
    console.log('[Test 6]: Admin dismisses the flag (restores authentic photo)');
    const dismissRes = await makeRequest(
      server,
      {
        path: `/api/ai/${initialAnalysis._id}/review`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        reviewStatus: 'dismissed',
        reviewNotes: 'Admin cleared photo as authentic camera original',
      }
    );

    if (dismissRes.status !== 200 || dismissRes.body.analysis.verificationStatus !== 'LIKELY_ORIGINAL') {
      throw new Error('Dismiss should restore verificationStatus to LIKELY_ORIGINAL');
    }

    const browseRes3 = await makeRequest(server, {
      path: '/api/materials?search=Verified+Concrete+Test+Batch+%23999',
      method: 'GET',
    });
    const restoredInBrowse = browseRes3.body.materials?.some(
      (m) => m._id.toString() === testMaterial._id.toString()
    );
    if (!restoredInBrowse) {
      throw new Error('Dismissed/authentic material should be browseable again!');
    }
    console.log('  [PASS] Dismissed material is restored to browseable state!\n');

    // Clean up
    await ImageAnalysis.deleteOne({ _id: initialAnalysis._id });
    await Material.deleteOne({ _id: testMaterial._id });
    await User.deleteMany({ email: { $in: ['test_flag_admin@example.com', 'test_flag_buyer@example.com'] } });

    console.log('===============================================================');
    console.log('   ALL 6 VERIFICATION & FLAGGED MATERIAL FIX TESTS PASSED!');
    console.log('===============================================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest().catch(async (err) => {
  console.error('Test Failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
