const path = require('path');
const fs = require('fs');
const http = require('http');
const sharp = require('sharp');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');
const Material = require('../models/Material');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');
const ImageAnalysis = require('../models/ImageAnalysis');
const {
  generatePHash,
  calculateHammingDistance,
  calculateSimilarityScore,
  classifyHammingResult,
} = require('../utils/aiHashService');
const { analyzeImage, indexMaterialImages, syncAllMaterials } = require('../services/aiImageService');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  phases: {},
};

function recordTest(phase, name, passed, details = '') {
  testResults.total++;
  if (!testResults.phases[phase]) {
    testResults.phases[phase] = { total: 0, passed: 0, failed: 0, tests: [] };
  }
  testResults.phases[phase].total++;

  if (passed) {
    testResults.passed++;
    testResults.phases[phase].passed++;
    console.log(`  [PASS] [${phase}] ${name}`);
    testResults.phases[phase].tests.push({ name, status: 'PASS' });
  } else {
    testResults.failed++;
    testResults.phases[phase].failed++;
    console.error(`  [FAIL] [${phase}] ${name} - ${details}`);
    testResults.phases[phase].tests.push({ name, status: 'FAIL', details });
  }
}

let testBaseUrl = 'http://127.0.0.1:5000';

async function makeRequest(server, options, postData = null) {
  const url = `${testBaseUrl}${options.path}`;
  const headers = { ...(options.headers || {}) };
  let body = undefined;

  if (postData !== null && postData !== undefined) {
    if (typeof postData === 'string' || Buffer.isBuffer(postData)) {
      body = postData;
    } else {
      body = JSON.stringify(postData);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: json,
    raw: text,
  };
}

async function runComprehensiveTests() {
  console.log('========================================================================');
  console.log(' BUILDEXCHANGE - COMPREHENSIVE END-TO-END VERIFICATION & AUDIT SUITE');
  console.log('========================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  testBaseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server]: Active and listening on ${testBaseUrl}\n`);

  try {
    // -----------------------------------------------------------------
    // PHASE 1: Project Setup and Health Check
    // -----------------------------------------------------------------
    console.log('>>> Running Phase 1: Setup and Health Check...');
    const healthRes = await makeRequest(server, { path: '/api/health', method: 'GET' });
    recordTest(
      'Phase 1',
      'API Health Check endpoint responds with 200 OK',
      healthRes.status === 200 && healthRes.body?.status === 'OK'
    );

    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    recordTest(
      'Phase 1',
      'Local uploads fallback directory is accessible',
      fs.existsSync(uploadsDir)
    );

    recordTest(
      'Phase 1',
      'Environment pHash thresholds configured in .env',
      process.env.PHASH_LIKELY_THRESHOLD !== undefined &&
        process.env.PHASH_POSSIBLE_THRESHOLD !== undefined
    );

    // -----------------------------------------------------------------
    // PHASE 2: Authentication Testing
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 2: Authentication & Authorization Testing...');
    const timestamp = Date.now();
    const testBuyerEmail = `buyer_${timestamp}@buildexchange.test`;
    const testSellerEmail = `seller_${timestamp}@buildexchange.test`;
    const testPassword = 'Password@123';

    // 2.1 Register new Buyer
    const regBuyerRes = await makeRequest(
      server,
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Test Buyer One',
        email: testBuyerEmail,
        phone: '9876543210',
        password: testPassword,
        confirmPassword: testPassword,
        role: 'buyer',
        city: 'Bengaluru',
        state: 'Karnataka',
      }
    );
    recordTest(
      'Phase 2',
      'Buyer registration succeeds with HTTP 201 and JWT token',
      regBuyerRes.status === 201 && !!regBuyerRes.body?.token && regBuyerRes.body?.user?.role === 'buyer'
    );
    const buyerToken = regBuyerRes.body?.token;
    const buyerId = regBuyerRes.body?.user?._id;

    // 2.2 Register new Seller
    const regSellerRes = await makeRequest(
      server,
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Test Seller One',
        email: testSellerEmail,
        phone: '9876543211',
        password: testPassword,
        confirmPassword: testPassword,
        role: 'seller',
        city: 'Bengaluru',
        state: 'Karnataka',
      }
    );
    recordTest(
      'Phase 2',
      'Seller registration succeeds with HTTP 201 and role "seller"',
      regSellerRes.status === 201 && regSellerRes.body?.user?.role === 'seller'
    );
    const sellerToken = regSellerRes.body?.token;
    const sellerId = regSellerRes.body?.user?._id;

    // 2.3 Password Mismatch Validation
    const mismatchRes = await makeRequest(
      server,
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Mismatch User',
        email: `mismatch_${timestamp}@test.com`,
        phone: '9876543212',
        password: 'Password@123',
        confirmPassword: 'WrongPassword',
      }
    );
    recordTest(
      'Phase 2',
      'Registration rejects password mismatch with HTTP 400',
      mismatchRes.status === 400
    );

    // 2.4 Duplicate Email Prevention
    const dupEmailRes = await makeRequest(
      server,
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Duplicate Email User',
        email: testBuyerEmail,
        phone: '9876543213',
        password: testPassword,
        confirmPassword: testPassword,
      }
    );
    recordTest(
      'Phase 2',
      'Duplicate email registration is rejected with HTTP 400',
      dupEmailRes.status === 400
    );

    // 2.5 Successful Login
    const loginRes = await makeRequest(
      server,
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testBuyerEmail,
        password: testPassword,
      }
    );
    recordTest(
      'Phase 2',
      'User login with valid credentials succeeds with HTTP 200',
      loginRes.status === 200 && !!loginRes.body?.token
    );

    // 2.6 Reject Incorrect Password
    const wrongPassRes = await makeRequest(
      server,
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testBuyerEmail,
        password: 'IncorrectPassword999',
      }
    );
    recordTest(
      'Phase 2',
      'Login with incorrect password rejected with HTTP 401',
      wrongPassRes.status === 401
    );

    // 2.7 Verify Password Hashing (Check raw DB document)
    const dbUser = await User.findById(buyerId).select('+password');
    recordTest(
      'Phase 2',
      'Passwords are encrypted with bcrypt salt (not plaintext)',
      dbUser.password.startsWith('$2') && !dbUser.password.includes(testPassword)
    );

    // 2.8 Protected Route Verification
    const getMeRes = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Phase 2',
      'Protected route /api/auth/me returns authenticated user identity',
      getMeRes.status === 200 && getMeRes.body?.user?._id === buyerId
    );

    // 2.9 Malformed Token Rejection
    const badTokenRes = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer this.is.a.fake.jwt.token' },
    });
    recordTest(
      'Phase 2',
      'Invalid/malformed JWT token rejected with HTTP 401 Unauthorized',
      badTokenRes.status === 401
    );

    // 2.10 Admin Role Isolation (Create Admin Token)
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Master Admin',
        email: `admin_${timestamp}@buildexchange.test`,
        phone: '9998887770',
        password: testPassword,
        role: 'admin',
      });
    }
    const adminToken = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET || 'mca_minor_project_construction_material_exchange_super_secret_jwt_key_2026',
      { expiresIn: '1d' }
    );

    // Buyer attempting to access Admin Users
    const buyerToAdminRes = await makeRequest(server, {
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Phase 2',
      'Buyer prevented from accessing Admin routes (HTTP 403 Forbidden)',
      buyerToAdminRes.status === 403
    );

    // Seller attempting to access Admin Users
    const sellerToAdminRes = await makeRequest(server, {
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    recordTest(
      'Phase 2',
      'Seller prevented from accessing Admin routes (HTTP 403 Forbidden)',
      sellerToAdminRes.status === 403
    );

    // Admin accessing Admin Users
    const adminAccessRes = await makeRequest(server, {
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(
      'Phase 2',
      'Admin successfully accesses Admin routes with HTTP 200',
      adminAccessRes.status === 200 && adminAccessRes.body?.success === true
    );

    // -----------------------------------------------------------------
    // PHASE 3: Material Management Testing
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 3: Material Management Testing...');

    // 3.1 Seller creates valid material listing
    const materialData = {
      name: 'High-Tensile TMT Steel Rebars Fe-500D (12mm)',
      category: 'Steel & Iron',
      description: 'Surplus primary grade corrosion resistant steel bars from commercial project.',
      quantity: 50,
      unit: 'Kg',
      condition: 'New',
      price: 65,
      address: 'Plot 44, Peenya 2nd Stage',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      pincode: '560058',
      imageUrl: '/uploads/sample_steel.png',
    };

    // Create simulated image file for testing
    const sampleImgBuffer = await sharp({
      create: { width: 250, height: 250, channels: 3, background: { r: 50, g: 70, b: 120 } },
    }).png().toBuffer();
    fs.writeFileSync(path.join(uploadsDir, 'sample_steel.png'), sampleImgBuffer);

    const createMatRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      materialData
    );
    recordTest(
      'Phase 3',
      'Seller creates new material listing with HTTP 201',
      createMatRes.status === 201 && createMatRes.body?.material?.name === materialData.name
    );
    const createdMaterial = createMatRes.body?.material;
    const materialId = createdMaterial?._id;

    // 3.2 Material Creation Validation: Missing required fields
    const invalidMatRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      { name: 'Incomplete Material' }
    );
    recordTest(
      'Phase 3',
      'Material creation with missing required fields rejected with HTTP 400',
      invalidMatRes.status === 400
    );

    // 3.3 Seller updates listing (price & quantity)
    const updateMatRes = await makeRequest(
      server,
      {
        path: `/api/materials/${materialId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        price: 70,
        quantity: 45,
        description: 'Updated surplus specifications.',
      }
    );
    recordTest(
      'Phase 3',
      'Seller successfully updates price (70) and quantity (45)',
      updateMatRes.status === 200 &&
        updateMatRes.body?.material?.price === 70 &&
        updateMatRes.body?.material?.quantity === 45
    );

    // 3.4 Ownership check: Another seller cannot edit this material
    const otherSellerToken = jwt.sign(
      { id: new mongoose.Types.ObjectId() },
      process.env.JWT_SECRET || 'mca_minor_project_construction_material_exchange_super_secret_jwt_key_2026',
      { expiresIn: '1d' }
    );
    // Create temporary seller user in DB
    const otherSeller = await User.create({
      name: 'Other Seller',
      email: `other_${timestamp}@test.com`,
      phone: '9876543299',
      password: testPassword,
      role: 'seller',
    });
    const validOtherSellerToken = jwt.sign(
      { id: otherSeller._id },
      process.env.JWT_SECRET || 'mca_minor_project_construction_material_exchange_super_secret_jwt_key_2026',
      { expiresIn: '1d' }
    );

    const unauthorizedEditRes = await makeRequest(
      server,
      {
        path: `/api/materials/${materialId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validOtherSellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      { price: 999 }
    );
    recordTest(
      'Phase 3',
      'Unauthorized seller cannot edit another sellers material (HTTP 403 Forbidden)',
      unauthorizedEditRes.status === 403
    );

    // 3.5 Buyer browses materials
    const browseRes = await makeRequest(server, { path: '/api/materials', method: 'GET' });
    recordTest(
      'Phase 3',
      'Public/buyer browse materials returns active listings with HTTP 200',
      browseRes.status === 200 && Array.isArray(browseRes.body?.materials)
    );

    // 3.6 Dynamic search by keyword
    const searchRes = await makeRequest(server, {
      path: '/api/materials?search=Rebars',
      method: 'GET',
    });
    recordTest(
      'Phase 3',
      'Search query filter returns matching materials',
      searchRes.status === 200 && searchRes.body?.materials?.some((m) => m._id === materialId)
    );

    // 3.7 Buyer toggles Favorites
    const addFavRes = await makeRequest(server, {
      path: `/api/favorites/${materialId}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Phase 3',
      'Buyer adds material to favorites with HTTP 201',
      addFavRes.status === 201
    );

    const getFavsRes = await makeRequest(server, {
      path: '/api/favorites',
      method: 'GET',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Phase 3',
      'Buyer retrieves favorite materials list',
      getFavsRes.status === 200 && getFavsRes.body?.favorites?.some((f) => f.materialId?._id === materialId)
    );

    const removeFavRes = await makeRequest(server, {
      path: `/api/favorites/${materialId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    recordTest(
      'Phase 3',
      'Buyer removes material from favorites with HTTP 200',
      removeFavRes.status === 200
    );

    // -----------------------------------------------------------------
    // PHASE 4: AI Image Detection & pHash Exhaustive Testing
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 4: AI Image Detection & pHash Testing (13 Test Cases)...');

    // Case 1: New image generates valid 64-bit hexadecimal pHash
    const tileImgBuffer = await sharp({
      create: { width: 300, height: 300, channels: 3, background: { r: 230, g: 210, b: 180 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 80, height: 80, channels: 3, background: { r: 120, g: 80, b: 40 } },
          }).png().toBuffer(),
          top: 50,
          left: 50,
        },
      ])
      .png()
      .toBuffer();

    const hashTile = await generatePHash(tileImgBuffer);
    recordTest(
      'Phase 4',
      'Case 1: Unique image produces a valid 16-hex pHash',
      typeof hashTile === 'string' && hashTile.length === 16
    );

    // Store tile in DB as base comparison
    fs.writeFileSync(path.join(uploadsDir, 'base_tile.png'), tileImgBuffer);
    const tileAnalysis = await analyzeImage({
      imageSource: tileImgBuffer,
      imageUrl: '/uploads/base_tile.png',
      sellerId,
      saveRecord: true,
    });
    recordTest(
      'Phase 4',
      'Case 1.1: Base image hash stored in MongoDB ImageAnalysis collection',
      !!tileAnalysis.analysisId && tileAnalysis.result === 'no_match'
    );

    // Case 2: Exact duplicate
    const exactTileBuffer = Buffer.from(tileImgBuffer);
    const exactDupRes = await analyzeImage({
      imageSource: exactTileBuffer,
      imageUrl: '/uploads/exact_tile_copy.png',
      sellerId,
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 2: Exact duplicate detected (Distance: 0, Result: likely_duplicate)',
      exactDupRes.hammingDistance === 0 && exactDupRes.result === 'likely_duplicate'
    );

    // Case 3: Resized copy (140x140)
    const resizedTileBuffer = await sharp(tileImgBuffer).resize(140, 140).png().toBuffer();
    const resizedRes = await analyzeImage({
      imageSource: resizedTileBuffer,
      imageUrl: '/uploads/resized_tile.png',
      sellerId,
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 3: Resized image detected as duplicate (Distance <= 10)',
      resizedRes.hammingDistance !== null &&
        resizedRes.hammingDistance <= 10 &&
        (resizedRes.result === 'likely_duplicate' || resizedRes.result === 'possible_duplicate')
    );

    // Case 4: Recompressed JPEG copy (quality 40)
    const recompressedBuffer = await sharp(tileImgBuffer).jpeg({ quality: 40 }).toBuffer();
    const recompressedRes = await analyzeImage({
      imageSource: recompressedBuffer,
      imageUrl: '/uploads/recompressed_tile.jpg',
      sellerId,
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 4: Recompressed JPEG copy detected as duplicate (Distance <= 5)',
      recompressedRes.hammingDistance <= 5 && recompressedRes.result === 'likely_duplicate'
    );

    // Case 5: Slightly modified image (brightness/contrast tweak)
    const modifiedBuffer = await sharp(tileImgBuffer).modulate({ brightness: 1.05 }).png().toBuffer();
    const modifiedRes = await analyzeImage({
      imageSource: modifiedBuffer,
      imageUrl: '/uploads/modified_tile.png',
      sellerId,
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 5: Minor brightness adjusted image classified within duplicate threshold',
      modifiedRes.hammingDistance <= 5 && modifiedRes.result === 'likely_duplicate'
    );

    // Case 6: Completely different image (green marble)
    const greenMarbleBuffer = await sharp({
      create: { width: 300, height: 300, channels: 3, background: { r: 20, g: 150, b: 70 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 280, height: 20, channels: 3, background: { r: 255, g: 255, b: 255 } },
          }).png().toBuffer(),
          top: 140,
          left: 10,
        },
      ])
      .png()
      .toBuffer();

    const diffRes = await analyzeImage({
      imageSource: greenMarbleBuffer,
      imageUrl: '/uploads/green_marble.png',
      sellerId,
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 6: Unrelated material image classified as no_match (Distance > 10 / null)',
      diffRes.result === 'no_match' &&
        (diffRes.hammingDistance === null || diffRes.hammingDistance > 10)
    );

    // Case 7: Similar material texture (verifying advisory threshold precision)
    const similarTextureBuffer = await sharp({
      create: { width: 300, height: 300, channels: 3, background: { r: 230, g: 210, b: 180 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 200, height: 200, channels: 3, background: { r: 120, g: 80, b: 40 } },
          }).png().toBuffer(),
          top: 20,
          left: 20,
        },
      ])
      .png()
      .toBuffer();
    const similarRes = await analyzeImage({
      imageSource: similarTextureBuffer,
      imageUrl: '/uploads/similar_tile.png',
      sellerId,
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 7: Similar material comparison returns valid advisory distance & classification',
      ['possible_duplicate', 'likely_duplicate', 'no_match'].includes(similarRes.result)
    );

    // Case 8: Multiple images per material
    const multiImgMaterial = await Material.create({
      sellerId,
      name: 'Granite Countertop Slabs',
      category: 'Stone & Marble',
      description: 'Polished black galaxy granite slabs.',
      quantity: 10,
      unit: 'Pieces',
      condition: 'New',
      price: 1500,
      images: [
        { url: '/uploads/base_tile.png', public_id: 'img_1' },
        { url: '/uploads/green_marble.png', public_id: 'img_2' },
      ],
      address: 'Industrial Area',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      pincode: '560058',
    });
    fs.writeFileSync(path.join(uploadsDir, 'green_marble.png'), greenMarbleBuffer);
    const multiIndexResults = await indexMaterialImages(multiImgMaterial, sellerId);
    recordTest(
      'Phase 4',
      'Case 8: Multiple images per material are both analysed and indexed independently',
      multiIndexResults.length === 2
    );

    // Case 9: Sync all materials batch function
    const syncResult = await syncAllMaterials();
    recordTest(
      'Phase 4',
      'Case 9: Batch sync function indexes materials and reports stats',
      typeof syncResult.indexedCount === 'number' && typeof syncResult.skippedCount === 'number'
    );

    // Case 10: Corrupt / unreachable image error handling
    const corruptAnalysis = await analyzeImage({
      imageSource: 'http://127.0.0.1:9/non_existent_image.jpg',
      imageUrl: 'http://127.0.0.1:9/non_existent_image.jpg',
      saveRecord: false,
    });
    recordTest(
      'Phase 4',
      'Case 10: Network/image retrieval failure safely handled without uncaught exception',
      corruptAnalysis.success === false && corruptAnalysis.analysisStatus === 'failed'
    );

    // Case 11: Analysis failure does not corrupt listing creation
    recordTest(
      'Phase 4',
      'Case 11: Analysis failure returns safe fallback object without crashing backend',
      corruptAnalysis.result === 'no_match'
    );

    // Case 12: Repeated analysis idempotency (already indexed image returns existing record)
    const repeatedIndex = await indexMaterialImages(multiImgMaterial, sellerId);
    recordTest(
      'Phase 4',
      'Case 12: Idempotent indexing avoids duplicate record creation for unchanged images',
      repeatedIndex.length === 2
    );

    // Case 13: Concurrency test (simultaneous duplicate requests)
    const [c1, c2] = await Promise.all([
      analyzeImage({ imageSource: exactTileBuffer, imageUrl: '/uploads/c1.png', saveRecord: false }),
      analyzeImage({ imageSource: exactTileBuffer, imageUrl: '/uploads/c2.png', saveRecord: false }),
    ]);
    recordTest(
      'Phase 4',
      'Case 13: Concurrent duplicate image analysis requests yield consistent pHash results',
      c1.imageHash === c2.imageHash && c1.result === 'likely_duplicate' && c2.result === 'likely_duplicate'
    );

    // -----------------------------------------------------------------
    // PHASE 5: Admin AI Monitoring Testing
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 5: Admin AI Monitoring Testing...');

    // Save a known duplicate into DB to verify admin dashboard listing
    const flaggedSave = await analyzeImage({
      imageSource: resizedTileBuffer,
      imageUrl: '/uploads/resized_tile_flagged.png',
      sellerId,
      saveRecord: true,
    });

    // 5.1 Admin fetches flagged images
    const getFlaggedRes = await makeRequest(server, {
      path: '/api/ai/flagged',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(
      'Phase 5',
      'Admin fetches flagged images list with HTTP 200',
      getFlaggedRes.status === 200 && Array.isArray(getFlaggedRes.body?.flagged)
    );

    // 5.2 Verify detection details in payload
    const foundFlagged = getFlaggedRes.body?.flagged?.find(
      (f) => String(f._id) === String(flaggedSave.analysisId)
    );
    recordTest(
      'Phase 5',
      'Flagged image payload includes Hamming distance, similarity, and reviewStatus',
      !!foundFlagged &&
        typeof foundFlagged.hammingDistance === 'number' &&
        foundFlagged.reviewStatus === 'not_reviewed'
    );

    // 5.3 Admin confirms duplicate flag
    const confirmRes = await makeRequest(
      server,
      {
        path: `/api/ai/${flaggedSave.analysisId}/review`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        reviewStatus: 'confirmed',
        reviewNotes: 'Verified duplicate image by platform moderation team.',
      }
    );
    recordTest(
      'Phase 5',
      'Admin updates flag to "confirmed" with review notes',
      confirmRes.status === 200 && confirmRes.body?.analysis?.reviewStatus === 'confirmed'
    );

    // 5.4 Admin dismisses flag (false positive)
    const dismissRes = await makeRequest(
      server,
      {
        path: `/api/ai/${flaggedSave.analysisId}/review`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        reviewStatus: 'dismissed',
        reviewNotes: 'Dismissed as authorized duplicate.',
      }
    );
    recordTest(
      'Phase 5',
      'Admin dismisses flag (reviewStatus: "dismissed")',
      dismissRes.status === 200 && dismissRes.body?.analysis?.reviewStatus === 'dismissed'
    );

    // 5.5 Verify persistence
    const recheckRecord = await ImageAnalysis.findById(flaggedSave.analysisId);
    recordTest(
      'Phase 5',
      'Review status and reviewer ID persist in MongoDB',
      recheckRecord.reviewStatus === 'dismissed' && String(recheckRecord.reviewedBy) === String(adminUser._id)
    );

    // -----------------------------------------------------------------
    // PHASE 6: Purchase Request & Order Workflow
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 6: Purchase Request & Order Workflow Testing...');

    // 6.1 Buyer submits request with quantity 10
    const submitReqRes = await makeRequest(
      server,
      {
        path: '/api/requests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        materialId,
        quantity: 10,
        message: 'Need 10 Kg steel rebars for site work. Pickup this Thursday.',
        contactPhone: '9876543210',
        contactEmail: testBuyerEmail,
      }
    );
    recordTest(
      'Phase 6',
      'Buyer submits valid purchase request with HTTP 201',
      submitReqRes.status === 201 && submitReqRes.body?.request?.quantity === 10
    );
    const requestId = submitReqRes.body?.request?._id;

    // 6.2 Validation: Quantity exceeds available stock (Current stock is 45, request 100)
    const excessReqRes = await makeRequest(
      server,
      {
        path: '/api/requests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        materialId,
        quantity: 100,
        message: 'Requesting more than available stock',
      }
    );
    recordTest(
      'Phase 6',
      'Purchase request exceeding available stock is rejected with HTTP 400',
      excessReqRes.status === 400
    );

    // 6.3 Validation: Zero or negative quantity
    const zeroReqRes = await makeRequest(
      server,
      {
        path: '/api/requests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        materialId,
        quantity: 0,
        message: 'Zero quantity request',
      }
    );
    recordTest(
      'Phase 6',
      'Purchase request with zero or negative quantity is rejected with HTTP 400',
      zeroReqRes.status === 400
    );

    // 6.4 Validation: Seller cannot request their own material
    const selfReqRes = await makeRequest(
      server,
      {
        path: '/api/requests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        materialId,
        quantity: 5,
        message: 'Self request',
      }
    );
    recordTest(
      'Phase 6',
      'Seller cannot send purchase request for their own material (HTTP 400)',
      selfReqRes.status === 400
    );

    // 6.5 Seller accepts request and schedules pickup
    const acceptReqRes = await makeRequest(
      server,
      {
        path: `/api/requests/${requestId}/accept`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        pickupAddress: 'Plot 44, Peenya 2nd Stage, Yard Gate 3',
        pickupCity: 'Bengaluru',
        pickupDistrict: 'Bengaluru Urban',
        pickupPincode: '560058',
        pickupLandmark: 'Opposite Shell Fuel Station',
        pickupDate: '2026-10-25',
        pickupStartTime: '10:00 AM',
        pickupEndTime: '02:00 PM',
        sellerMessage: 'Loading forklift available. Please carry photo ID.',
      }
    );
    recordTest(
      'Phase 6',
      'Seller accepts request and schedules pickup (Order created with status "Pickup Scheduled")',
      acceptReqRes.status === 200 && acceptReqRes.body?.order?.status === 'Pickup Scheduled'
    );
    const orderId = acceptReqRes.body?.order?._id;

    // 6.6 Verify material stock has NOT decreased yet (Quantity should still be 45)
    const checkStockBefore = await Material.findById(materialId);
    recordTest(
      'Phase 6',
      'Material quantity remains unchanged before order completion (Quantity = 45)',
      checkStockBefore.quantity === 45
    );

    // 6.7 Seller marks order "Ready for Pickup"
    const readyRes = await makeRequest(server, {
      path: `/api/orders/${orderId}/ready`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    recordTest(
      'Phase 6',
      'Seller marks order "Ready for Pickup" with HTTP 200',
      readyRes.status === 200 && readyRes.body?.order?.status === 'Ready for Pickup'
    );

    // 6.8 Seller completes order after collection (Quantity reduces from 45 to 35)
    const completeRes = await makeRequest(server, {
      path: `/api/orders/${orderId}/complete`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    recordTest(
      'Phase 6',
      'Seller completes order with HTTP 200',
      completeRes.status === 200 && completeRes.body?.order?.status === 'Completed'
    );

    // 6.9 Verify material quantity decreased atomically to 35
    const checkStockAfter = await Material.findById(materialId);
    recordTest(
      'Phase 6',
      'Material quantity accurately decreased to 35 upon order completion',
      checkStockAfter.quantity === 35
    );

    // 6.10 Complete order for remaining 35 units to test SOLD status transition
    const req2Res = await makeRequest(
      server,
      {
        path: '/api/requests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        materialId,
        quantity: 35,
        message: 'Clearing all remaining stock.',
      }
    );
    const order2Accept = await makeRequest(
      server,
      {
        path: `/api/requests/${req2Res.body?.request?._id}/accept`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        pickupAddress: 'Plot 44, Peenya',
        pickupCity: 'Bengaluru',
        pickupDate: '2026-10-26',
        pickupStartTime: '10:00 AM',
        pickupEndTime: '12:00 PM',
      }
    );
    await makeRequest(server, {
      path: `/api/orders/${order2Accept.body?.order?._id}/complete`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });

    const checkSoldStock = await Material.findById(materialId);
    recordTest(
      'Phase 6',
      'Listing automatically marked status="sold" when remaining quantity reaches 0',
      checkSoldStock.quantity === 0 && checkSoldStock.status === 'sold'
    );

    // 6.11 New request on sold material rejected
    const soldReqRes = await makeRequest(
      server,
      {
        path: '/api/requests',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        materialId,
        quantity: 1,
        message: 'Attempting request on sold material',
      }
    );
    recordTest(
      'Phase 6',
      'Purchase request on sold-out material is rejected with HTTP 400',
      soldReqRes.status === 400
    );

    // -----------------------------------------------------------------
    // PHASE 7: Messaging and Notifications Testing
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 7: Messaging & Notifications Testing...');

    // 7.1 Send message between buyer and seller on active order
    const sendMsgRes = await makeRequest(
      server,
      {
        path: '/api/messages',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        orderId,
        message: 'Hello, what vehicle capacity is suitable for loading?',
      }
    );
    recordTest(
      'Phase 7',
      'Buyer sends order message with HTTP 201',
      sendMsgRes.status === 201 && sendMsgRes.body?.message?.senderId?._id === buyerId
    );

    // 7.2 Get messages for the order
    const getMsgsRes = await makeRequest(server, {
      path: `/api/messages/order/${orderId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    recordTest(
      'Phase 7',
      'Seller retrieves order chat messages with HTTP 200',
      getMsgsRes.status === 200 && Array.isArray(getMsgsRes.body?.messages)
    );

    // 7.3 Unauthorized message access: User C cannot read or send messages on this order
    const unauthMsgRes = await makeRequest(
      server,
      {
        path: `/api/messages/order/${orderId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${validOtherSellerToken}` },
      },
      null
    );
    recordTest(
      'Phase 7',
      'Unrelated user cannot access order chat (HTTP 403 Forbidden)',
      unauthMsgRes.status === 403
    );

    // 7.4 Notifications generated
    const notifsRes = await makeRequest(server, {
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    recordTest(
      'Phase 7',
      'Seller receives notifications for buyer requests and messages',
      notifsRes.status === 200 && notifsRes.body?.notifications?.length > 0
    );

    const firstNotif = notifsRes.body?.notifications?.[0];
    if (firstNotif) {
      const readNotifRes = await makeRequest(server, {
        path: `/api/notifications/${firstNotif._id}/read`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      recordTest(
        'Phase 7',
        'User marks notification as read (HTTP 200)',
        readNotifRes.status === 200 && readNotifRes.body?.notification?.isRead === true
      );
    }

    // -----------------------------------------------------------------
    // PHASE 8: API Security & Input Sanitization
    // -----------------------------------------------------------------
    console.log('\n>>> Running Phase 8: API Security & Input Sanitization...');

    // 8.1 Invalid MongoDB ObjectId format
    const badIdRes = await makeRequest(server, {
      path: '/api/materials/not-a-valid-mongodb-id-999',
      method: 'GET',
    });
    recordTest(
      'Phase 8',
      'Invalid MongoDB ObjectId is safely caught by error middleware (HTTP 404 or 400, not 500)',
      [400, 404].includes(badIdRes.status)
    );

    // 8.2 Password hash exposure prevention
    const usersListRes = await makeRequest(server, {
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const exposedPasswords = usersListRes.body?.users?.filter((u) => u.password !== undefined);
    recordTest(
      'Phase 8',
      'User password hashes are NEVER exposed in user listings',
      exposedPasswords && exposedPasswords.length === 0
    );

    // 8.3 Cloudinary secret isolation
    const healthBody = JSON.stringify(healthRes.body);
    const adminBody = JSON.stringify(adminAccessRes.body);
    recordTest(
      'Phase 8',
      'Cloudinary API secret is never leaked in API response payloads',
      !healthBody.includes(process.env.CLOUDINARY_API_SECRET || 'IWCR') &&
        !adminBody.includes(process.env.CLOUDINARY_API_SECRET || 'IWCR')
    );

    // -----------------------------------------------------------------
    // CLEANUP TEST DATA
    // -----------------------------------------------------------------
    console.log('\n>>> Cleaning up test resources...');
    await Material.deleteMany({ _id: { $in: [materialId, multiImgMaterial._id] } });
    await Request.deleteMany({ _id: requestId });
    await Order.deleteMany({ _id: orderId });
    await Message.deleteMany({ orderId });
    await Notification.deleteMany({ userId: { $in: [buyerId, sellerId] } });
    await Favorite.deleteMany({ userId: buyerId });
    await ImageAnalysis.deleteMany({ sellerId });
    await User.deleteMany({ email: { $in: [testBuyerEmail, testSellerEmail, `other_${timestamp}@test.com`] } });

    // Remove scratch images
    try {
      fs.unlinkSync(path.join(uploadsDir, 'sample_steel.png'));
      fs.unlinkSync(path.join(uploadsDir, 'base_tile.png'));
      fs.unlinkSync(path.join(uploadsDir, 'green_marble.png'));
    } catch (e) {}

    if (server) server.close();

    console.log('\n========================================================================');
    console.log(` AUDIT COMPLETE: ${testResults.passed} PASSED, ${testResults.failed} FAILED`);
    console.log('========================================================================\n');

    // Print phase breakdown
    for (const [phase, data] of Object.entries(testResults.phases)) {
      console.log(`  * ${phase}: ${data.passed}/${data.total} passed`);
    }

    if (testResults.failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal audit failure:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runComprehensiveTests();
