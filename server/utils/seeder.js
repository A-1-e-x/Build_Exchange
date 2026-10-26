const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
} else {
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
}

const User = require('../models/User');
const Category = require('../models/Category');
const Material = require('../models/Material');
const Request = require('../models/Request');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');
const ImageAnalysis = require('../models/ImageAnalysis');
const { indexMaterialImages } = require('../services/aiImageService');

const { categories, users, sampleMaterials } = require('./seedData');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/construction_exchange';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`[MongoDB Connected for Seeder]: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[Warning]: Could not connect to primary MongoDB at ${uri}: ${err.message}`);
    console.log('[Info]: Starting In-Memory MongoDB server for seeding...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'construction_exchange',
      },
      spawn: {
        timeout: 60000,
      },
    });
    const fallbackUri = mongod.getUri();
    await mongoose.connect(fallbackUri);
    console.log(`[MongoDB In-Memory Connected]: ${fallbackUri}`);
  }
};

const importData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Category.deleteMany();
    await Material.deleteMany();
    await Request.deleteMany();
    await Order.deleteMany();
    await Message.deleteMany();
    await Notification.deleteMany();
    await Favorite.deleteMany();
    await ImageAnalysis.deleteMany();

    console.log('1. Importing Categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`   -> Created ${createdCategories.length} categories.`);

    console.log('2. Importing Users (1 Admin, 3 Sellers, 5 Buyers)...');
    const createdUsers = [];
    for (const u of users) {
      // Create users individually so pre('save') hashes password properly
      const createdUser = await User.create(u);
      createdUsers.push(createdUser);
    }
    console.log(`   -> Created ${createdUsers.length} users.`);

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const sellerUsers = createdUsers.filter((u) => u.role === 'seller');
    const buyerUsers = createdUsers.filter((u) => u.role === 'buyer');

    console.log('3. Importing Material Listings...');
    const createdMaterials = [];
    for (let i = 0; i < sampleMaterials.length; i++) {
      const mat = sampleMaterials[i];
      // Distribute listings among the 3 sellers
      const seller = sellerUsers[i % sellerUsers.length];

      const newMaterial = await Material.create({
        ...mat,
        sellerId: seller._id,
        contactPhone: seller.phone,
      });
      createdMaterials.push(newMaterial);
    }
    console.log(`   -> Created ${createdMaterials.length} material listings.`);

    console.log('3.1. Indexing Material Images for AI Duplicate Detection...');
    let indexedImagesCount = 0;
    for (const mat of createdMaterials) {
      try {
        const analyses = await indexMaterialImages(mat, mat.sellerId);
        indexedImagesCount += analyses.length;
      } catch (aiErr) {
        // Non-fatal if remote images cannot be fetched during seed
      }
    }
    console.log(`   -> Indexed ${indexedImagesCount} images for AI pHash detection.`);

    console.log('4. Creating Sample Buyer Requests...');
    const sampleRequests = [
      {
        buyerId: buyerUsers[0]._id, // Amit Kumar
        sellerId: createdMaterials[0].sellerId,
        materialId: createdMaterials[0]._id, // UltraTech Cement
        quantity: 20,
        message: 'Hello, I need 20 bags of cement for immediate foundation work in Bellandur. Can I arrange pickup tomorrow morning?',
        contactPhone: buyerUsers[0].phone,
        contactEmail: buyerUsers[0].email,
        status: 'accepted',
        sellerNote: 'Accepted! You can pick it up tomorrow between 9 AM to 1 PM. Loading support is available at our warehouse.',
      },
      {
        buyerId: buyerUsers[1]._id, // Pooja Deshmukh
        sellerId: createdMaterials[3].sellerId,
        materialId: createdMaterials[3]._id, // Tata Tiscon TMT Steel
        quantity: 500,
        message: 'Hi, I need 500 kg of 12mm TMT bars for building a terrace pergola. Are test certificates available?',
        contactPhone: buyerUsers[1].phone,
        contactEmail: buyerUsers[1].email,
        status: 'pending',
      },
      {
        buyerId: buyerUsers[2]._id, // Rohan Verma
        sellerId: createdMaterials[2].sellerId,
        materialId: createdMaterials[2]._id, // Kajaria Vitrified Tiles
        quantity: 200,
        message: 'Interested in purchasing 200 sq.ft of the Statuario marble-finish tiles. Can you offer any discount if I pick up today?',
        contactPhone: buyerUsers[2].phone,
        contactEmail: buyerUsers[2].email,
        status: 'pending',
      },
      {
        buyerId: buyerUsers[3]._id, // Ananya Roy
        sellerId: createdMaterials[5].sellerId,
        materialId: createdMaterials[5]._id, // CenturyPly Plywood
        quantity: 8,
        message: 'Require 8 sheets of 19mm BWP marine plywood for study table carpentry. Please confirm availability.',
        contactPhone: buyerUsers[3].phone,
        contactEmail: buyerUsers[3].email,
        status: 'completed',
        sellerNote: 'Completed transaction. Payment received and items dispatched successfully.',
      },
    ];

    const createdRequests = await Request.insertMany(sampleRequests);
    console.log(`   -> Created ${createdRequests.length} sample buyer requests.`);

    console.log('5. Creating Sample Orders & Pickup Schedules...');
    const sampleOrders = [
      {
        buyerId: buyerUsers[0]._id,
        sellerId: createdMaterials[0].sellerId,
        materialId: createdMaterials[0]._id,
        requestId: createdRequests[0]._id,
        quantity: 20,
        unitPrice: createdMaterials[0].price,
        totalPrice: 20 * createdMaterials[0].price,
        status: 'Pickup Scheduled',
        pickupAddress: createdMaterials[0].address,
        pickupCity: createdMaterials[0].city,
        pickupDistrict: createdMaterials[0].district,
        pickupPincode: createdMaterials[0].pincode,
        pickupLandmark: 'Opposite Shell Fuel Station',
        pickupDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        pickupStartTime: '10:00 AM',
        pickupEndTime: '01:00 PM',
        sellerMessage: 'Loading dock 3 is reserved for your vehicle. Please carry valid government ID.',
        acceptedAt: new Date(),
        pickupScheduledAt: new Date(),
      },
      {
        buyerId: buyerUsers[3]._id,
        sellerId: createdMaterials[5].sellerId,
        materialId: createdMaterials[5]._id,
        requestId: createdRequests[3]._id,
        quantity: 8,
        unitPrice: createdMaterials[5].price,
        totalPrice: 8 * createdMaterials[5].price,
        status: 'Completed',
        pickupAddress: createdMaterials[5].address,
        pickupCity: createdMaterials[5].city,
        pickupDistrict: createdMaterials[5].district,
        pickupPincode: createdMaterials[5].pincode,
        pickupLandmark: 'Near Metro Pillar 142',
        pickupDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        pickupStartTime: '02:00 PM',
        pickupEndTime: '05:00 PM',
        sellerMessage: 'Thank you for your business. Material inspected and handed over.',
        acceptedAt: new Date(Date.now() - 86400000 * 3),
        pickupScheduledAt: new Date(Date.now() - 86400000 * 3),
        completedAt: new Date(Date.now() - 86400000),
      },
    ];

    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`   -> Created ${createdOrders.length} sample scheduled & completed orders.`);

    // Link orders back to requests
    await Request.findByIdAndUpdate(createdRequests[0]._id, { orderId: createdOrders[0]._id });
    await Request.findByIdAndUpdate(createdRequests[3]._id, { orderId: createdOrders[1]._id });

    console.log('6. Creating Sample Order Chat Messages & Notifications...');
    await Message.create({
      senderId: buyerUsers[0]._id,
      receiverId: createdMaterials[0].sellerId,
      orderId: createdOrders[0]._id,
      message: 'Hi Rajesh, will a standard Tata Ace pickup tempo fit inside your yard gate?',
    });

    await Message.create({
      senderId: createdMaterials[0].sellerId,
      receiverId: buyerUsers[0]._id,
      orderId: createdOrders[0]._id,
      message: 'Yes Amit! Gates are 14ft wide and high enough for any commercial tempo or mini-truck.',
    });

    await Notification.create({
      userId: buyerUsers[0]._id,
      type: 'pickup_scheduled',
      title: 'Pickup Scheduled for Cement Bags',
      message: `Pickup scheduled for ${createdOrders[0].pickupDate} between 10:00 AM - 01:00 PM.`,
      relatedOrderId: createdOrders[0]._id,
      relatedRequestId: createdRequests[0]._id,
    });

    await Notification.create({
      userId: createdMaterials[0].sellerId,
      type: 'message',
      title: 'New Message from Buyer',
      message: 'Amit: "Hi Rajesh, will a standard Tata Ace pickup tempo fit inside your yard gate?"',
      relatedOrderId: createdOrders[0]._id,
    });
    console.log('   -> Created sample chat messages & notifications.');

    console.log('7. Creating Sample Favorites...');
    const sampleFavorites = [
      { userId: buyerUsers[0]._id, materialId: createdMaterials[0]._id },
      { userId: buyerUsers[0]._id, materialId: createdMaterials[1]._id },
      { userId: buyerUsers[1]._id, materialId: createdMaterials[3]._id },
      { userId: buyerUsers[1]._id, materialId: createdMaterials[4]._id },
      { userId: buyerUsers[2]._id, materialId: createdMaterials[2]._id },
      { userId: buyerUsers[3]._id, materialId: createdMaterials[5]._id },
      { userId: buyerUsers[4]._id, materialId: createdMaterials[6]._id },
    ];

    await Favorite.insertMany(sampleFavorites);
    console.log(`   -> Created ${sampleFavorites.length} sample favorites.`);

    console.log('\n=============================================================');
    console.log('  CONSTRUCTION MATERIAL EXCHANGE PLATFORM - SEED COMPLETED!');
    console.log('=============================================================');
    console.log('\nDEMO ACCOUNTS READY FOR EVALUATION:\n');
    console.log('1. ADMIN ACCOUNT:');
    console.log(`   Email:    admin@buildexchange.com`);
    console.log(`   Password: Password@123`);
    console.log(`   Role:     admin\n`);
    console.log('2. SELLER ACCOUNTS:');
    console.log(`   Email:    rajesh.seller@gmail.com`);
    console.log(`   Password: Password@123`);
    console.log(`   Role:     seller\n`);
    console.log(`   Email:    vikram.mehta@infraapex.com`);
    console.log(`   Password: Password@123`);
    console.log(`   Role:     seller\n`);
    console.log('3. BUYER ACCOUNTS:');
    console.log(`   Email:    amit.buyer@gmail.com`);
    console.log(`   Password: Password@123`);
    console.log(`   Role:     buyer\n`);
    console.log(`   Email:    pooja.deshmukh@gmail.com`);
    console.log(`   Password: Password@123`);
    console.log(`   Role:     buyer\n`);
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error importing seed data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Category.deleteMany();
    await Material.deleteMany();
    await Request.deleteMany();
    await Order.deleteMany();
    await Message.deleteMany();
    await Notification.deleteMany();
    await Favorite.deleteMany();
    await ImageAnalysis.deleteMany();
    console.log('All Construction Material Exchange data successfully destroyed!');
    process.exit(0);
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
