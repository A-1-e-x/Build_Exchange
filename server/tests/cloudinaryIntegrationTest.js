const path = require('path');
const fs = require('fs');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const mongoose = require('mongoose');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');
const Material = require('../models/Material');
const ImageAnalysis = require('../models/ImageAnalysis');
const {
  cloudinary,
  isCloudinaryConfigured,
  uploadImage,
  deleteImage,
} = require('../config/cloudinary');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: {},
};

function recordTest(suite, name, passed, details = '') {
  testResults.total++;
  if (!testResults.suites[suite]) {
    testResults.suites[suite] = { total: 0, passed: 0, failed: 0, tests: [] };
  }
  testResults.suites[suite].total++;

  if (passed) {
    testResults.passed++;
    testResults.suites[suite].passed++;
    console.log(`  [PASS] [${suite}] ${name}`);
    testResults.suites[suite].tests.push({ name, status: 'PASS' });
  } else {
    testResults.failed++;
    testResults.suites[suite].failed++;
    console.error(`  [FAIL] [${suite}] ${name} - ${details}`);
    testResults.suites[suite].tests.push({ name, status: 'FAIL', details });
  }
}

/**
 * Builds standard multipart/form-data payload in pure Node.js Buffer
 */
function createMultipartPayload(fields = {}, files = []) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2) + Date.now();
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      )
    );
  }

  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname || 'images'}"; filename="${file.filename || 'image.png'}"\r\nContent-Type: ${file.mimetype || 'image/png'}\r\n\r\n`
      )
    );
    chunks.push(file.buffer);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body,
  };
}

function makeRequest(server, options, postData = null, customContentType = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      ...options,
      port,
      host: '127.0.0.1',
      headers: {
        ...(options.headers || {}),
      },
    };

    if (postData) {
      if (customContentType) {
        reqOptions.headers['Content-Type'] = customContentType;
        reqOptions.headers['Content-Length'] = Buffer.isBuffer(postData)
          ? postData.length
          : Buffer.byteLength(postData);
      } else if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
    }

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

async function runCloudinaryIntegrationSuite() {
  console.log('========================================================================');
  console.log('   BuildExchange Cloudinary Integration & Security Audit Suite');
  console.log('========================================================================\n');

  // Start dedicated test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}\n`);

  // Ensure DB connection is established
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
  }

  const jwtSecret =
    process.env.JWT_SECRET || 'mca_minor_project_construction_material_exchange_super_secret_jwt_key_2026';

  let testSeller, testBuyer;
  let sellerToken, buyerToken;

  const testSuffix = Date.now();
  const testSellerEmail = `cloudinary.seller.${testSuffix}@example.com`;
  const testBuyerEmail = `cloudinary.buyer.${testSuffix}@example.com`;
  let createdMaterialId = null;
  const createdCloudinaryPublicIds = [];

  try {
    // -----------------------------------------------------------------
    // SUITE 1: Cloudinary SDK Installation & Configuration Detection
    // -----------------------------------------------------------------
    console.log('>>> Running Suite 1: Cloudinary SDK Installation & Dual-Mode Config Detection...');

    recordTest(
      'Suite 1',
      'Cloudinary v2 SDK is installed and callable',
      typeof cloudinary?.uploader?.upload_stream === 'function' &&
        typeof cloudinary?.uploader?.destroy === 'function'
    );

    recordTest(
      'Suite 1',
      'Cloudinary config enforces HTTPS secure URLs',
      cloudinary.config().secure === true
    );

    recordTest(
      'Suite 1',
      'isCloudinaryConfigured() detects credentials from environment',
      isCloudinaryConfigured() === true
    );

    // Live ping test
    let pingOk = false;
    try {
      const pingRes = await cloudinary.api.ping();
      pingOk = pingRes && pingRes.status === 'ok';
    } catch (e) {
      pingOk = false;
    }
    recordTest(
      'Suite 1',
      'Cloudinary API ping responds with status "ok"',
      pingOk
    );

    // -----------------------------------------------------------------
    // SUITE 2: Direct Upload, Retrieval & Verification
    // -----------------------------------------------------------------
    console.log('\n>>> Running Suite 2: Direct Cloudinary Upload, Asset Retrieval & Deletion...');

    // Generate safe in-memory test image
    const testImage1Buffer = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 60, g: 120, b: 240 },
      },
    })
      .png()
      .toBuffer();

    const directUploadRes = await uploadImage(
      { buffer: testImage1Buffer, originalname: 'audit_direct_test.png' },
      'test_audit_temp'
    );

    recordTest(
      'Suite 2',
      'uploadImage returns an HTTPS URL starting with https://res.cloudinary.com/',
      typeof directUploadRes.url === 'string' &&
        directUploadRes.url.startsWith('https://res.cloudinary.com/')
    );

    recordTest(
      'Suite 2',
      'uploadImage returns a valid Cloudinary public_id under folder test_audit_temp',
      typeof directUploadRes.public_id === 'string' &&
        directUploadRes.public_id.startsWith('test_audit_temp/')
    );

    createdCloudinaryPublicIds.push(directUploadRes.public_id);

    // Verify asset on Cloudinary Admin API
    let assetVerifiedOnCdn = false;
    try {
      const assetResource = await cloudinary.api.resource(directUploadRes.public_id);
      assetVerifiedOnCdn =
        assetResource &&
        assetResource.public_id === directUploadRes.public_id &&
        assetResource.bytes > 0;
    } catch (e) {
      assetVerifiedOnCdn = false;
    }
    recordTest(
      'Suite 2',
      'Asset genuinely exists and is verified on Cloudinary CDN via Admin API',
      assetVerifiedOnCdn
    );

    // Delete asset
    await deleteImage(directUploadRes.public_id);

    // Verify asset is gone from Cloudinary
    let assetDeletedFromCdn = false;
    try {
      await cloudinary.api.resource(directUploadRes.public_id);
      assetDeletedFromCdn = false; // still exists
    } catch (err) {
      assetDeletedFromCdn = err.error?.http_code === 404 || err.message?.includes('not found') || err.http_code === 404;
    }
    recordTest(
      'Suite 2',
      'deleteImage destroys the asset on Cloudinary (verified 404 via Admin API)',
      assetDeletedFromCdn
    );

    // -----------------------------------------------------------------
    // SUITE 3: Full API Multipart Upload & MongoDB Persistence
    // -----------------------------------------------------------------
    console.log('\n>>> Running Suite 3: Full API Multipart Upload & MongoDB Persistence...');

    // Create test seller and buyer
    testSeller = await User.create({
      name: 'Cloudinary Audit Seller',
      email: testSellerEmail,
      phone: '9876500001',
      password: 'AuditPassword@123',
      role: 'seller',
    });
    sellerToken = jwt.sign({ id: testSeller._id }, jwtSecret, { expiresIn: '1d' });

    testBuyer = await User.create({
      name: 'Cloudinary Audit Buyer',
      email: testBuyerEmail,
      phone: '9876500002',
      password: 'AuditPassword@123',
      role: 'buyer',
    });
    buyerToken = jwt.sign({ id: testBuyer._id }, jwtSecret, { expiresIn: '1d' });

    const materialImg1 = await sharp({
      create: {
        width: 48,
        height: 48,
        channels: 3,
        background: { r: 180, g: 90, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const fields = {
      name: 'Cloudinary Audited Cement Sacks 50kg',
      category: 'Cement & Sand',
      description: 'Surplus grade 53 OPC cement sacks stored in moisture-free dry warehouse.',
      quantity: '25',
      unit: 'Bags',
      condition: 'New',
      price: '380',
      address: 'Industrial Area Phase 1',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      pincode: '560001',
    };

    const files = [
      {
        fieldname: 'images',
        filename: 'cement_sack_1.png',
        mimetype: 'image/png',
        buffer: materialImg1,
      },
    ];

    const multipart = createMultipartPayload(fields, files);

    const createListingRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      },
      multipart.body,
      multipart.contentType
    );

    recordTest(
      'Suite 3',
      'POST /api/materials with multipart image upload responds with HTTP 201 Created',
      createListingRes.status === 201 && createListingRes.body?.success === true
    );

    const createdMat = createListingRes.body?.material;
    createdMaterialId = createdMat?._id;

    recordTest(
      'Suite 3',
      'Created listing response contains Cloudinary secure URL (https://res.cloudinary.com/)',
      Boolean(
        createdMat?.images?.[0]?.url &&
        createdMat.images[0].url.startsWith('https://res.cloudinary.com/')
      )
    );

    recordTest(
      'Suite 3',
      'Created listing response contains Cloudinary public_id under construction_materials/',
      Boolean(
        createdMat?.images?.[0]?.public_id &&
        createdMat.images[0].public_id.startsWith('construction_materials/')
      )
    );

    if (createdMat?.images?.[0]?.public_id) {
      createdCloudinaryPublicIds.push(createdMat.images[0].public_id);
    }

    // Verify in MongoDB directly
    const dbMaterial = await Material.findById(createdMaterialId);
    recordTest(
      'Suite 3',
      'MongoDB Material document securely persists { url, public_id } object array',
      Boolean(
        dbMaterial &&
        dbMaterial.images.length === 1 &&
        dbMaterial.images[0].url.startsWith('https://res.cloudinary.com/') &&
        dbMaterial.images[0].public_id === createdMat.images[0].public_id
      )
    );

    // Verify AI analysis record created for the Cloudinary image
    const aiRecord = await ImageAnalysis.findOne({ materialId: createdMaterialId });
    recordTest(
      'Suite 3',
      'AI Forensic Image Analysis successfully indexed Cloudinary image with pHash',
      Boolean(aiRecord && aiRecord.imageHash && aiRecord.imageHash.length === 16)
    );

    // -----------------------------------------------------------------
    // SUITE 4: Listing Edit and Removed Image Cleanup
    // -----------------------------------------------------------------
    console.log('\n>>> Running Suite 4: Listing Edit & Image Removal Cleanup...');

    // Upload a 2nd image via PUT /api/materials/:id
    const materialImg2 = await sharp({
      create: {
        width: 48,
        height: 48,
        channels: 3,
        background: { r: 30, g: 150, b: 80 },
      },
    })
      .png()
      .toBuffer();

    const firstImagePublicId = dbMaterial.images[0].public_id;
    const firstImageUrl = dbMaterial.images[0].url;

    const editFieldsWithAdd = {
      name: 'Cloudinary Audited Cement Sacks 50kg (Updated)',
      existingImages: JSON.stringify([{ url: firstImageUrl, public_id: firstImagePublicId }]),
    };
    const editFilesWithAdd = [
      {
        fieldname: 'images',
        filename: 'cement_sack_2.png',
        mimetype: 'image/png',
        buffer: materialImg2,
      },
    ];
    const editMultipart = createMultipartPayload(editFieldsWithAdd, editFilesWithAdd);

    const updateRes1 = await makeRequest(
      server,
      {
        path: `/api/materials/${createdMaterialId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      editMultipart.body,
      editMultipart.contentType
    );

    recordTest(
      'Suite 4',
      'PUT /api/materials/:id adds 2nd image while preserving 1st image (HTTP 200)',
      updateRes1.status === 200 && updateRes1.body?.material?.images?.length === 2
    );

    const secondImagePublicId = updateRes1.body?.material?.images?.[1]?.public_id;
    if (secondImagePublicId) {
      createdCloudinaryPublicIds.push(secondImagePublicId);
    }

    // Now edit to REMOVE the 1st image and retain only the 2nd image
    const editFieldsRemoveFirst = {
      existingImages: JSON.stringify([
        {
          url: updateRes1.body.material.images[1].url,
          public_id: secondImagePublicId,
        },
      ]),
    };
    const editMultipartRemoveFirst = createMultipartPayload(editFieldsRemoveFirst, []);

    const updateRes2 = await makeRequest(
      server,
      {
        path: `/api/materials/${createdMaterialId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      editMultipartRemoveFirst.body,
      editMultipartRemoveFirst.contentType
    );

    recordTest(
      'Suite 4',
      'PUT /api/materials/:id with removed image updates listing to 1 image',
      updateRes2.status === 200 && updateRes2.body?.material?.images?.length === 1
    );

    // Verify firstImagePublicId was destroyed from Cloudinary
    let removedImgDestroyed = false;
    try {
      await cloudinary.api.resource(firstImagePublicId);
      removedImgDestroyed = false; // still exists
    } catch (e) {
      removedImgDestroyed = e.error?.http_code === 404 || e.message?.includes('not found') || e.http_code === 404;
    }
    recordTest(
      'Suite 4',
      'Removed image was cleaned up from Cloudinary upon listing update (verified 404)',
      removedImgDestroyed
    );

    // -----------------------------------------------------------------
    // SUITE 5: Listing Deletion & Full Asset Cleanup
    // -----------------------------------------------------------------
    console.log('\n>>> Running Suite 5: Listing Deletion & Associated Cloudinary Asset Cleanup...');

    const deleteMatRes = await makeRequest(server, {
      path: `/api/materials/${createdMaterialId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });

    recordTest(
      'Suite 5',
      'DELETE /api/materials/:id succeeds with HTTP 200',
      deleteMatRes.status === 200 && deleteMatRes.body?.success === true
    );

    const checkMatInDb = await Material.findById(createdMaterialId);
    recordTest(
      'Suite 5',
      'Material document is completely removed from MongoDB',
      checkMatInDb === null
    );

    let secondImgDestroyed = false;
    try {
      await cloudinary.api.resource(secondImagePublicId);
      secondImgDestroyed = false;
    } catch (e) {
      secondImgDestroyed = e.error?.http_code === 404 || e.message?.includes('not found') || e.http_code === 404;
    }
    recordTest(
      'Suite 5',
      'Associated Cloudinary asset was destroyed on listing deletion (verified 404)',
      secondImgDestroyed
    );

    // -----------------------------------------------------------------
    // SUITE 6: Security, File Types & Guard Rails
    // -----------------------------------------------------------------
    console.log('\n>>> Running Suite 6: Security, File Types, Limits & Auth Guards...');

    // 6.1 Disallowed file type (.txt)
    const badFileMultipart = createMultipartPayload(fields, [
      {
        fieldname: 'images',
        filename: 'malicious.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('This is not an image file'),
      },
    ]);
    const badFileTypeRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      badFileMultipart.body,
      badFileMultipart.contentType
    );
    recordTest(
      'Suite 6',
      'Uploading non-image file (.txt) is rejected with HTTP 400 Bad Request',
      badFileTypeRes.status === 400 &&
        (badFileTypeRes.body?.message?.includes('Invalid file type') ||
          badFileTypeRes.body?.message?.includes('Only JPG'))
    );

    // 6.2 File exceeding 5MB limit
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0x41);
    const largeFileMultipart = createMultipartPayload(fields, [
      {
        fieldname: 'images',
        filename: 'too_large.png',
        mimetype: 'image/png',
        buffer: largeBuffer,
      },
    ]);
    const largeFileRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
      largeFileMultipart.body,
      largeFileMultipart.contentType
    );
    recordTest(
      'Suite 6',
      'Uploading file exceeding 5MB limit is rejected with HTTP 400 Bad Request',
      largeFileRes.status === 400 &&
        largeFileRes.body?.message?.includes('File size is too large')
    );

    // 6.3 Unauthenticated upload
    const unauthMultipart = createMultipartPayload(fields, files);
    const unauthRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
      },
      unauthMultipart.body,
      unauthMultipart.contentType
    );
    recordTest(
      'Suite 6',
      'Unauthenticated POST /api/materials is rejected with HTTP 401 Unauthorized',
      unauthRes.status === 401
    );

    // 6.4 Non-seller (buyer) upload
    const buyerUploadRes = await makeRequest(
      server,
      {
        path: '/api/materials',
        method: 'POST',
        headers: { Authorization: `Bearer ${buyerToken}` },
      },
      unauthMultipart.body,
      unauthMultipart.contentType
    );
    recordTest(
      'Suite 6',
      'Buyer role attempting to create listing is rejected with HTTP 403 Forbidden',
      buyerUploadRes.status === 403
    );

    // 6.5 API Secret isolation
    const healthCheckRes = await makeRequest(server, {
      path: '/api/health',
      method: 'GET',
    });
    const parsedSecret = cloudinary.config().api_secret;
    const healthRaw = JSON.stringify(healthCheckRes.body || {});
    recordTest(
      'Suite 6',
      'Cloudinary API secret is never exposed in API response payloads',
      parsedSecret ? !healthRaw.includes(parsedSecret) : true
    );

    // -----------------------------------------------------------------
    // SUITE 7: Offline / Missing / Invalid Credentials Failover
    // -----------------------------------------------------------------
    console.log('\n>>> Running Suite 7: Missing / Invalid Credentials Storage Failover...');

    const originalUrl = process.env.CLOUDINARY_URL;

    // Simulate missing credentials
    delete process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    cloudinary.config(true);

    recordTest(
      'Suite 7',
      'isCloudinaryConfigured() returns false when credentials are absent',
      isCloudinaryConfigured() === false
    );

    const fallbackUploadRes = await uploadImage(
      { buffer: testImage1Buffer, originalname: 'audit_fallback_test.png' },
      'construction_materials'
    );

    recordTest(
      'Suite 7',
      'uploadImage transparently falls back to local /uploads/ URL when unconfigured',
      typeof fallbackUploadRes.url === 'string' &&
        fallbackUploadRes.url.startsWith('/uploads/')
    );

    const fallbackLocalFile = path.join(
      __dirname,
      '..',
      'public',
      'uploads',
      fallbackUploadRes.public_id
    );
    recordTest(
      'Suite 7',
      'Fallback file is confirmed written to local public/uploads/ directory',
      fs.existsSync(fallbackLocalFile)
    );

    // Clean up local fallback file
    if (fs.existsSync(fallbackLocalFile)) {
      fs.unlinkSync(fallbackLocalFile);
    }

    // Restore environment credentials
    if (originalUrl) {
      process.env.CLOUDINARY_URL = originalUrl;
    }

    recordTest(
      'Suite 7',
      'Cloudinary configuration successfully restored to active cloud connection',
      isCloudinaryConfigured() === true
    );
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log('\n>>> Cleaning up test resources...');

    // Clean up any remaining test Cloudinary assets
    for (const pid of createdCloudinaryPublicIds) {
      try {
        await cloudinary.uploader.destroy(pid);
      } catch (e) {
        // ignore
      }
    }

    // Clean up test users and materials from MongoDB
    if (testSeller?._id) await User.deleteOne({ _id: testSeller._id });
    if (testBuyer?._id) await User.deleteOne({ _id: testBuyer._id });
    if (createdMaterialId) {
      await Material.deleteOne({ _id: createdMaterialId });
      await ImageAnalysis.deleteMany({ materialId: createdMaterialId });
    }

    server.close();
  }

  console.log('\n========================================================================');
  console.log(` CLOUDINARY AUDIT SUITE COMPLETE: ${testResults.passed} PASSED, ${testResults.failed} FAILED`);
  console.log('========================================================================\n');

  for (const [suite, data] of Object.entries(testResults.suites)) {
    console.log(`  * ${suite}: ${data.passed}/${data.total} passed`);
  }
  console.log('');

  if (testResults.failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runCloudinaryIntegrationSuite().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = runCloudinaryIntegrationSuite;
