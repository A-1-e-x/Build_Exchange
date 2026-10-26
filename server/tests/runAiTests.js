const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const sharp = require('sharp');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Material = require('../models/Material');
const ImageAnalysis = require('../models/ImageAnalysis');
const {
  generatePHash,
  calculateHammingDistance,
  calculateSimilarityScore,
  classifyHammingResult,
} = require('../utils/aiHashService');
const { analyzeImage, indexMaterialImages } = require('../services/aiImageService');

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

async function runAllTests() {
  console.log('===============================================================');
  console.log('   AI Construction Material Image Analysis Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  try {
    // Clean test collections
    await ImageAnalysis.deleteMany({});

    // Create test user (Seller) and Admin
    const seller = await User.findOneAndUpdate(
      { email: 'test.seller@example.com' },
      {
        name: 'Test Seller',
        email: 'test.seller@example.com',
        phone: '9988776655',
        password: 'Password@123',
        role: 'seller',
      },
      { upsert: true, new: true }
    );

    const admin = await User.findOneAndUpdate(
      { email: 'test.admin@example.com' },
      {
        name: 'Test Admin',
        email: 'test.admin@example.com',
        phone: '9988776644',
        password: 'Password@123',
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    // -------------------------------------------------------------
    // TEST 1: Generate Perceptual Hash on New Image Buffer
    // -------------------------------------------------------------
    console.log('Test Suite 1: Perceptual Hashing (2D DCT pHash)');

    // Create Image A: Simulated Brick / Concrete Texture (Grey-Red pattern)
    const imageABuffer = await sharp({
      create: { width: 320, height: 240, channels: 3, background: { r: 180, g: 90, b: 60 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 100, height: 40, channels: 3, background: { r: 210, g: 120, b: 80 } },
          }).png().toBuffer(),
          top: 30,
          left: 40,
        },
        {
          input: await sharp({
            create: { width: 100, height: 40, channels: 3, background: { r: 150, g: 70, b: 50 } },
          }).png().toBuffer(),
          top: 90,
          left: 100,
        },
      ])
      .png()
      .toBuffer();

    const hashA = await generatePHash(imageABuffer);
    assert(
      typeof hashA === 'string' && hashA.length === 16,
      'Test 1.1: pHash generates a valid 16-character hexadecimal string',
      `Got hash: ${hashA}`
    );

    // -------------------------------------------------------------
    // TEST 2: Exact Duplicate Detection
    // -------------------------------------------------------------
    const exactCopyBuffer = Buffer.from(imageABuffer);
    const hashExact = await generatePHash(exactCopyBuffer);
    const exactDistance = calculateHammingDistance(hashA, hashExact);
    const exactClass = classifyHammingResult(exactDistance);

    assert(
      exactDistance === 0,
      'Test 2.1: Exact duplicate produces Hamming distance of 0',
      `Distance: ${exactDistance}`
    );
    assert(
      exactClass === 'likely_duplicate',
      'Test 2.2: Exact duplicate classified as likely_duplicate',
      `Class: ${exactClass}`
    );

    // -------------------------------------------------------------
    // TEST 3: Resized and Recompressed JPEG Detection
    // -------------------------------------------------------------
    const resizedBuffer = await sharp(imageABuffer)
      .resize(160, 120)
      .jpeg({ quality: 55 })
      .toBuffer();

    const hashResized = await generatePHash(resizedBuffer);
    const resizedDistance = calculateHammingDistance(hashA, hashResized);
    const resizedClass = classifyHammingResult(resizedDistance);

    assert(
      resizedDistance <= 5,
      'Test 3.1: Resized and recompressed image has Hamming distance <= 5',
      `Distance: ${resizedDistance}`
    );
    assert(
      resizedClass === 'likely_duplicate',
      'Test 3.2: Resized and recompressed image classified as likely_duplicate',
      `Class: ${resizedClass}`
    );

    // -------------------------------------------------------------
    // TEST 4: Distinct Construction Material Image (Different)
    // -------------------------------------------------------------
    // Image B: Blue Steel / Glass Texture (Distinct frequencies)
    const imageBBuffer = await sharp({
      create: { width: 320, height: 240, channels: 3, background: { r: 30, g: 70, b: 160 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 300, height: 20, channels: 3, background: { r: 200, g: 220, b: 240 } },
          }).png().toBuffer(),
          top: 100,
          left: 10,
        },
      ])
      .png()
      .toBuffer();

    const hashB = await generatePHash(imageBBuffer);
    const diffDistance = calculateHammingDistance(hashA, hashB);
    const diffClass = classifyHammingResult(diffDistance);

    assert(
      diffDistance > 10,
      'Test 4.1: Distinctly different material image has Hamming distance > 10',
      `Distance: ${diffDistance}`
    );
    assert(
      diffClass === 'no_match',
      'Test 4.2: Different material image classified as no_match',
      `Class: ${diffClass}`
    );

    // -------------------------------------------------------------
    // TEST 5: MongoDB Persistence and Duplicate Lookup
    // -------------------------------------------------------------
    console.log('\nTest Suite 2: AI Service Database Orchestration');

    // Create Material 1 with Image A
    const material1 = await Material.create({
      sellerId: seller._id,
      name: 'Red Clay Bricks (Class A)',
      category: 'Bricks & Blocks',
      description: 'First class kilned red clay bricks for structural masonry.',
      quantity: 1000,
      unit: 'Pieces',
      condition: 'New',
      price: 12,
      images: [{ url: '/uploads/brick_test_1.png', public_id: 'test_brick_1' }],
      address: 'Industrial Yard, Peenya',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      pincode: '560058',
    });

    // Save Image A to test public/uploads so service can read it
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, 'brick_test_1.png'), imageABuffer);

    // Index Material 1
    const indexResults = await indexMaterialImages(material1, seller._id);
    assert(
      indexResults.length === 1 && indexResults[0].success !== false,
      'Test 5.1: Material 1 image indexed successfully into MongoDB'
    );

    const indexedRecord = await ImageAnalysis.findOne({ materialId: material1._id });
    assert(
      indexedRecord && indexedRecord.imageHash === hashA,
      'Test 5.2: ImageAnalysis record stored correct pHash in database'
    );

    // -------------------------------------------------------------
    // TEST 6: Analyzing Duplicate Image Against Material 1
    // -------------------------------------------------------------
    console.log('\nTest Suite 3: Near-Duplicate Detection vs Stored Listings');

    // Analyze resized copy as a new upload
    const dupAnalysis = await analyzeImage({
      imageSource: resizedBuffer,
      imageUrl: '/uploads/brick_test_duplicate.jpg',
      sellerId: seller._id,
      saveRecord: true,
    });

    assert(
      dupAnalysis.result === 'likely_duplicate',
      'Test 6.1: Service correctly identified resized copy as likely_duplicate',
      `Got: ${dupAnalysis.result}`
    );
    assert(
      dupAnalysis.closestMatch !== null,
      'Test 6.2: Service returned closest match reference'
    );
    assert(
      String(dupAnalysis.closestMatch.materialId) === String(material1._id),
      'Test 6.3: Closest match correctly references Material 1 ID',
      `Expected ${material1._id}, got ${dupAnalysis.closestMatch?.materialId}`
    );

    // -------------------------------------------------------------
    // TEST 7: Idempotency & Exclusion of Same Material Self-Comparison
    // -------------------------------------------------------------
    const selfAnalysis = await analyzeImage({
      imageSource: imageABuffer,
      imageUrl: '/uploads/brick_test_1.png',
      materialId: material1._id,
      sellerId: seller._id,
      saveRecord: false,
    });

    // When materialId is specified as material1, it must ignore material1 images
    // It should match dupAnalysis (which had materialId: null) or no other material
    assert(
      selfAnalysis.closestMatch?.materialId?.toString() !== material1._id.toString(),
      'Test 7.1: Comparison query excludes images from the same material'
    );

    // -------------------------------------------------------------
    // TEST 8: Admin Review Workflow (Update Status, Confirm, Dismiss)
    // -------------------------------------------------------------
    console.log('\nTest Suite 4: Admin Flagged Image Review Workflow');

    const flaggedRecord = await ImageAnalysis.findById(dupAnalysis.analysisId);
    assert(
      flaggedRecord.reviewStatus === 'not_reviewed',
      'Test 8.1: Flagged duplicate starts with reviewStatus not_reviewed'
    );

    // Update to confirmed by Admin
    flaggedRecord.reviewStatus = 'confirmed';
    flaggedRecord.reviewedBy = admin._id;
    flaggedRecord.reviewedAt = new Date();
    flaggedRecord.reviewNotes = 'Confirmed duplicate uploaded from another yard listing.';
    await flaggedRecord.save();

    const updatedRecord = await ImageAnalysis.findById(dupAnalysis.analysisId);
    assert(
      updatedRecord.reviewStatus === 'confirmed',
      'Test 8.2: Admin successfully marks flag as confirmed'
    );
    assert(
      String(updatedRecord.reviewedBy) === String(admin._id),
      'Test 8.3: Review records Admin user reference'
    );
    assert(
      updatedRecord.reviewNotes.includes('Confirmed duplicate'),
      'Test 8.4: Review notes saved accurately'
    );

    // -------------------------------------------------------------
    // TEST 9: Error Handling for Unsupported Input
    // -------------------------------------------------------------
    console.log('\nTest Suite 5: Error Handling & Resilience');

    try {
      await generatePHash(Buffer.from('not-an-image-data-stream'));
      assert(false, 'Test 9.1: Unsupported image data threw error');
    } catch (err) {
      assert(true, 'Test 9.1: Corrupt or non-image buffer safely caught with error');
    }

    const failedAnalysis = await analyzeImage({
      imageSource: Buffer.from('invalid-buffer'),
      imageUrl: '/uploads/bad.png',
      saveRecord: false,
    });
    assert(
      failedAnalysis.success === false && failedAnalysis.analysisStatus === 'failed',
      'Test 9.2: analyzeImage safely handles decode failures without uncaught exception'
    );

    // Clean up test files
    try {
      fs.unlinkSync(path.join(uploadsDir, 'brick_test_1.png'));
    } catch (e) {}

    // Clean up test documents
    await Material.deleteOne({ _id: material1._id });
    await ImageAnalysis.deleteMany({});
    await User.deleteMany({ email: { $in: ['test.seller@example.com', 'test.admin@example.com'] } });

    console.log('\n===============================================================');
    console.log(`   TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================\n');

    if (failedTests === 0) {
      console.log('ALL AI MODULE TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error(`SOME TESTS FAILED: ${failedTests} errors.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runAllTests();
