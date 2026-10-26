# BuildExchange: AI-Powered Construction Material Exchange Platform

> **Academic Project — Master of Computer Applications (MCA)**  
> Full-Stack MERN Architecture with Python AI Image Forensic Inference Microservice, 2D Discrete Cosine Transform (pHash) Deduplication, and Resilient Storage & Database Failovers.

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-2563EB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose%208-47A248.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)
[![Python AI](https://img.shields.io/badge/AI%20Microservice-Python%203.10%2B%20%2B%20Flask-3776AB.svg?style=for-the-badge&logo=python)](https://www.python.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-amber.svg?style=for-the-badge)](#26-license)

---

## 📋 Table of Contents
1. [Project Title](#1-project-title)
2. [Project Overview](#2-project-overview)
3. [Abstract](#3-abstract)
4. [Problem Statement](#4-problem-statement)
5. [Project Objectives](#5-project-objectives)
6. [Key Features](#6-key-features)
7. [User Roles and Permissions](#7-user-roles-and-permissions)
8. [Technology Stack](#8-technology-stack)
9. [System Architecture](#9-system-architecture)
10. [Project Folder Structure](#10-project-folder-structure)
11. [Prerequisites](#11-prerequisites)
12. [Installation and Setup](#12-installation-and-setup)
13. [Environment Variable Configuration](#13-environment-variable-configuration)
14. [MongoDB Configuration](#14-mongodb-configuration)
15. [Cloudinary Configuration](#15-cloudinary-configuration)
16. [How to Run the Project](#16-how-to-run-the-project)
17. [Application Workflow](#17-application-workflow)
18. [AI Image Verification Methodology](#18-ai-image-verification-methodology)
19. [API Documentation and Important Endpoints](#19-api-documentation-and-important-endpoints)
20. [Database Models and Relationships](#20-database-models-and-relationships)
21. [Testing Instructions](#21-testing-instructions)
22. [Troubleshooting](#22-troubleshooting)
23. [Security Considerations](#23-security-considerations)
24. [Future Enhancements](#24-future-enhancements)
25. [Project Limitations](#25-project-limitations)
26. [License](#26-license)

---

## 1. Project Title

**BuildExchange: AI-Powered Construction Material Exchange Platform**  
*A Circular Economy Web Application for Reclaiming, Trading, and Verifying Surplus Construction Materials.*

---

## 2. Project Overview

The construction and infrastructure sector generates enormous volumes of solid waste annually, much of which consists of brand new, surplus, or reusable raw materials—such as unconsumed cement bags, excess TMT steel rebar, surplus vitrified ceramic tiles, framing timber, structural bricks, plumbing pipes, and electrical fittings. In traditional construction operations, these leftover supplies are routinely dumped into municipal landfills, left to deteriorate under open work-site weather conditions, or discarded to scrap dealers at negligible salvage value.

Simultaneously, independent home builders, masonry contractors, renovation crews, and small-scale developers grapple with inflated construction material costs and supply chain delays.

**BuildExchange** resolves this imbalance by establishing a decentralized, role-based digital marketplace. Sellers can catalog surplus materials with verified condition grades, volume quantities, geographic coordinates, and discounted pricing. Buyers can browse, search with fuzzy text indexes, negotiate offers, coordinate on-site pickup schedules, and inspect physical goods before payment.

To prevent marketplace fraud, duplicate posting spam, stock photo plagiarism, and synthetic computer-generated fake materials, BuildExchange integrates a **Multi-Signal Image Verification & Forensic Deduplication Pipeline** combining 64-bit 2D Discrete Cosine Transform (pHash) perceptual hashing, SHA-256 byte digest hashing, EXIF hardware metadata forensics, and a dedicated Python Flask microservice analyzing 2D Discrete Fourier Transform (DFT) spectral anomalies, Error Level Analysis (ELA), and Laplacian texture roughness variance.

---

## 3. Abstract

Urban expansion and real estate development face severe sustainability hurdles: over 30% of global solid waste stems from Construction and Demolition (C&D) activities, squandering embedded carbon and scarce raw minerals. This project delivers a production-ready, full-stack web application implementing a circular economy framework for surplus material reallocation.

Engineered with the **MERN Stack (MongoDB, Express.js, React 18, Node.js)** and supported by a dedicated **Python Flask AI Forensic Microservice**, the system delivers stateless JWT authentication, role-based authorization across Buyers, Sellers, and Administrators, atomic inventory decrementing with race-condition prevention, structured pickup window scheduling, in-app transaction messaging, real-time notifications, and responsive multi-device interfaces styled with Tailwind CSS.

Media hosting is fortified with an automated zero-downtime failover engine: uploads stream securely to Cloudinary's global Content Delivery Network (CDN) when credentials exist, but automatically fall back to local disk storage (`server/public/uploads/`) and static Express serving if offline or unconfigured.

The system's integrity layer applies multi-signal image forensics: 2D DCT-II perceptual hashing indexes 64-bit image fingerprints to detect visual duplicates within configurable Hamming distance thresholds ($D_H \le 5$), while frequency-domain spectral analysis and Laplacian surface variance examine physical tactile roughness against smoothed diffusion patterns. BuildExchange illustrates how modern web engineering and applied image forensics directly advance sustainable construction practices.

---

## 4. Problem Statement

1. **High Material Wastage & Landfill Burden:** Millions of tons of usable materials are discarded annually due to site over-ordering, minor specification shifts, and lack of secondary distribution channels.
2. **Escalating Procurement Costs:** Independent builders, carpenters, plumbers, and home renovators face escalating costs for foundational materials like cement, steel, and electrical cables.
3. **Hyperlocal Fragmentation:** Worksites with surplus stock have no structured medium to broadcast availability to nearby builders who need those exact quantities within short delivery radiuses.
4. **Marketplace Fraud & Misrepresentation:** Unregulated peer-to-peer classifieds frequently suffer from duplicate listing spam, stolen web photos, misrepresented stock images, and synthetic AI-generated images that deceive prospective buyers.

---

## 5. Project Objectives

- **Develop a Scalable Circular Marketplace:** Construct an intuitive web platform connecting surplus material holders with prospective buyers across 12 primary construction categories.
- **Enforce Role-Based Access Control (RBAC):** Provide tailored, secure portals for Public Browsers, Verified Buyers, Registered Sellers, and Platform Administrators.
- **Ensure Atomic Inventory Control:** Eliminate double-allocation and overselling through atomic MongoDB increments (`$inc: { quantity: -order.quantity }`) and automatic status transitions to `sold` when stock reaches zero.
- **Implement Multi-Signal Image Forensics:** Formulate a multi-layered verification pipeline using SHA-256 exact byte matching, 64-bit 2D DCT perceptual hashing, EXIF hardware provenance scanning, and frequency-domain synthetic artifact detection.
- **Guarantee Deployment Resilience:** Provide dual-layer automated failovers: in-memory MongoDB fallback when local databases are offline, and local static disk fallback when Cloudinary cloud storage is unconfigured.
- **Streamline Physical Inspection & Handover:** Facilitate direct buyer-seller negotiations, pickup time windows, order messaging, and on-site physical handovers without requiring forced online credit transactions.

---

## 6. Key Features

### 🔍 Dynamic Discovery & Catalog Search
- **Fuzzy Full-Text Search:** Compound text index across `name`, `category`, `description`, `city`, `district`, and `state`.
- **Multi-Faceted Filtering:** Real-time client and server filtering by Category (12 standard building trades), Condition (`New`, `Like New`, `Good`, `Used`, `Damaged`), State, City, and Price Range sliders.
- **Sorting Options:** Dynamic sorting by `newest`, `price-asc`, `price-desc`, and popularity view counts.
- **Responsive Material Detail Gallery:** Multi-image gallery carousel, quantity/unit badges, seller profile card, physical site address, and real-time verification trust badge.

### 🔨 Seller Inventory & Listing Management
- **Structured Posting Form:** Category selection, condition grade, unit pricing, quantity available, standard units (`Bags`, `Pieces`, `Sq.Ft`, `Kg`, `Tons`, `Meters`, `Liters`, `Bundles`, `Lots`), contact phone, and pickup site address.
- **Multi-Image Uploader:** Accepts up to 6 photos per listing with automatic Cloudinary CDN hosting or local disk fallback.
- **Seller Management Dashboard:** Live counters for Total Listings, Active Items, Sold Items, Incoming Enquiries, and Total Inventory Value.
- **Listing Lifecycle Control:** In-place price/detail updates, listing deletion with automated image purging, and quick status toggling (`available` vs `sold`).

### 🛒 Buyer Enquiries & Price Negotiation
- **Structured Purchase Enquiries:** Buyers submit requests with desired quantity, custom offered unit price, project note, and contact phone number.
- **Real-Time Stock Checks:** Prevents buyers from submitting requests exceeding available quantities.
- **Buyer Request Dashboard:** Live status pills (`pending`, `accepted`, `rejected`, `completed`, `cancelled`) with seller response notes.
- **Persistent Watchlist / Favorites:** Instant one-click toggle to bookmark materials into a personal favorites gallery.

### 📦 Pickup Scheduling, Order Tracking & In-App Chat
- **Acceptance & Pickup Window Coordination:** Sellers accept requests by specifying pickup date, start time, end time, pickup address, landmark, and coordination instructions.
- **Order Lifecycle States:** Structured progression through `Pending` $\rightarrow$ `Accepted` $\rightarrow$ `Pickup Scheduled` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Completed` (or `Cancelled`).
- **In-App Order Messaging:** Contextual buyer-seller messaging thread linked directly to each order.
- **Real-Time System Notifications:** In-app notification center tracking order creations, pickup schedule updates, ready-for-pickup alerts, and order completion receipts.
- **Atomic Stock Decrementing:** Marking an order `Completed` atomically deducts inventory from MongoDB. If remaining stock hits 0, the listing status automatically switches to `sold`.

### 🛡️ Administrator Operations & Moderation
- **Platform Analytics KPI Board:** Total registered users (by role), active/sold material counts, total inventory valuation, and category distribution breakdowns.
- **User Moderation:** Search users, toggle account active/disabled states, or permanently delete abusive accounts.
- **Listing Oversight:** Audit listings, manually approve or reject pending items, or delete non-compliant posts.
- **Category CRUD:** Create, update, or remove construction categories with customized Lucide icons and banner images.
- **AI Image Monitoring Dashboard (`/admin/ai-monitoring`):** Dedicated admin console listing flagged images, duplicate matches, perceptual Hamming distances, synthetic probability scores, and one-click manual confirmation/dismissal actions.

---

## 7. User Roles and Permissions

| Capability | Public / Guest | Buyer (`buyer`) | Seller (`seller`) | Admin (`admin`) |
|---|:---:|:---:|:---:|:---:|
| Browse & Search Material Catalog | ✅ | ✅ | ✅ | ✅ |
| View Material Details & Verification Trust Badges | ✅ | ✅ | ✅ | ✅ |
| Register Account & Log In (JWT) | ✅ | ✅ | ✅ | ✅ |
| Bookmark Materials to Favorites Watchlist | ❌ | ✅ | ❌ | ✅ |
| Submit Purchase Enquiry / Custom Offer | ❌ | ✅ | ❌ | ✅ |
| Track Buyer Requests & Pickup Orders | ❌ | ✅ | ❌ | ✅ |
| Post Surplus Material Listings (up to 6 photos) | ❌ | ❌ | ✅ | ✅ |
| Manage Listed Inventory (Edit, Delete, Toggle Sold) | ❌ | ❌ | ✅ | ✅ |
| Accept / Reject Enquiries & Schedule Pickups | ❌ | ❌ | ✅ | ✅ |
| Mark Orders as "Ready for Pickup" & "Completed" | ❌ | ❌ | ✅ | ✅ |
| In-App Messaging Thread on Active Orders | ❌ | ✅ | ✅ | ✅ |
| View System Notifications Center | ❌ | ✅ | ✅ | ✅ |
| Platform Analytics & KPI Dashboard | ❌ | ❌ | ❌ | ✅ |
| Moderate Users (Activate/Disable/Delete) | ❌ | ❌ | ❌ | ✅ |
| Approve / Reject / Delete Material Listings | ❌ | ❌ | ❌ | ✅ |
| Manage Categories (Create, Update, Delete) | ❌ | ❌ | ❌ | ✅ |
| AI Image Monitoring & Forensic Flag Review | ❌ | ❌ | ❌ | ✅ |
| Trigger Catalog Batch Re-Sync for AI Analysis | ❌ | ❌ | ❌ | ✅ |

---

## 8. Technology Stack

### Frontend Architecture
- **Core Library:** React 18.3.1 (Single Page Application architecture)
- **Build Tool:** Vite 6.0.7 (Lightning-fast HMR and optimized production bundling)
- **Styling & Design System:** Tailwind CSS 3.4.17 (Custom construction-themed color palette: Amber, Slate, Emerald, Rose)
- **Routing:** React Router DOM 6.28.0 (Declarative client routing with protected role gates)
- **HTTP Client:** Axios 1.7.9 (Configured with request/response interceptors for automatic JWT Bearer injection)
- **Iconography:** Lucide React 0.469.0 (Crisp, modern SVG icons)

### Backend Architecture
- **Runtime Environment:** Node.js (v18.0.0 or higher recommended)
- **Web Framework:** Express.js 4.21.2 (RESTful MVC architecture, custom route handlers, error middleware)
- **Authentication & Security:** 
  - `jsonwebtoken` (v9.0.2) for stateless HMAC SHA-256 tokens
  - `bcryptjs` (v2.4.3) for 10-round salted password hashing
  - `helmet` (v8.0.0) for HTTP security headers
  - `cors` (v2.8.5) for origin whitelisting
- **File Handling:** Multer 1.4.5-lts.1 (Multipart form-data parsing with memory storage buffer)
- **Logging:** Morgan 1.10.0 (Development HTTP request logging)

### Database Layer
- **Database Engine:** MongoDB 6.0+ (NoSQL document store)
- **Object Modeling:** Mongoose ODM 8.9.5 (Strong typing, validation rules, compound indexes, hooks)
- **In-Memory Fallback:** `mongodb-memory-server` 10.1.3 (Automatically spawns when standalone MongoDB is unavailable)

### Cloud Media & Storage
- **Primary Media CDN:** Cloudinary v2 SDK (v2.5.1) (Direct stream uploads, dynamic image transformations, secure HTTPS delivery)
- **Zero-Config Fallback:** Node.js Local Disk Storage (`server/public/uploads/`) with static Express file serving

### AI & Forensic Image Analysis Layer
- **Node.js Forensic Services:**
  - `sharp` (v0.35.5): High-performance libvips image decoding, grayscale conversion, and in-process Laplacian filtering
  - `exifr` (v7.1.3): Complete EXIF, TIFF, XMP, and GPS hardware metadata parser
  - `crypto` (Built-in): SHA-256 cryptographic digest computation
  - Custom 2D Discrete Cosine Transform (DCT-II) 64-bit perceptual hashing implementation
- **Python Forensic Microservice (`ai-service`):**
  - Python 3.10+ with Flask
  - `Pillow` (PIL): Error Level Analysis (ELA) recompression discrepancy computation
  - `NumPy`: 2D Fast Fourier Transform (FFT) power spectrum analysis and discrete Laplacian variance texture calculation

---

## 9. System Architecture

```mermaid
graph TD
    subgraph ClientTier ["CLIENT TIER (React 18 + Vite) - Port 5173"]
        UI["Tailwind CSS UI Components"]
        Router["React Router DOM (Protected Routes)"]
        Context["AuthContext & ToastContext"]
        AxiosClient["Axios HTTP Interceptor (JWT Bearer)"]
        UI --> Router
        Router --> Context
        Context --> AxiosClient
    end

    subgraph BackendTier ["APPLICATION SERVER (Node.js + Express) - Port 5000"]
        Middlewares["Helmet, CORS, Morgan, Body Parser"]
        AuthMiddleware["JWT Verification & RBAC Guards"]
        MulterHandler["Multer Memory Buffer"]
        Controllers["Controllers: Auth, Materials, Orders, Requests, AI, Admin"]
        
        AxiosClient -->|"HTTP REST Requests / JSON"| Middlewares
        Middlewares --> AuthMiddleware
        AuthMiddleware --> MulterHandler
        MulterHandler --> Controllers
    end

    subgraph StorageTier ["MEDIA STORAGE & FAILOVER ENGINE"]
        CloudinaryCDN["Primary: Cloudinary Cloud CDN"]
        LocalDisk["Fallback: Local Disk (server/public/uploads/)"]
        Controllers -->|"Upload Image"| CloudinaryCDN
        CloudinaryCDN -.->|"Fallback if Unconfigured"| LocalDisk
    end

    subgraph DatabaseTier ["DATABASE TIER (MongoDB)"]
        MongooseODM["Mongoose ODM 8"]
        PrimaryMongo[("Primary MongoDB (Local / Atlas)")]
        MemoryMongo[("Resilient In-Memory MongoDB Server")]
        
        Controllers --> MongooseODM
        MongooseODM --> PrimaryMongo
        PrimaryMongo -.->|"Fallback if Offline (2.5s Timeout)"| MemoryMongo
    end

    subgraph AITier ["AI FORENSIC VERIFICATION MODULE"]
        pHashModule["Node.js 2D DCT-II pHash & SHA-256 (aiHashService)"]
        EXIFModule["EXIF Hardware & C2PA Inspector (aiMetadataService)"]
        PythonMicroservice["Python Flask Microservice (Port 5001) ELA + 2D DFT + Laplacian Variance"]
        InProcessFallback["In-Process Sharp Laplacian Fallback"]
        
        Controllers -->|"Trigger Verification"| pHashModule
        Controllers -->|"Inspect Metadata"| EXIFModule
        Controllers -->|"Call AI Inference"| PythonMicroservice
        PythonMicroservice -.->|"Fallback if Offline"| InProcessFallback
    end
```

---

## 10. Project Folder Structure

```
ConstructionMet/
├── .env.example                     # Root environment variable template (sanitized)
├── .gitignore                       # Git ignore configuration
├── package.json                     # Monorepo management scripts
├── README.md                        # Complete technical documentation
│
├── ai-service/                      # Python AI Forensic Inference Microservice
│   ├── app.py                       # Flask service entry point (Port 5001)
│   ├── forensic_detector.py         # Multi-signal forensic engine (ELA, 2D DFT, Laplacian)
│   ├── README.md                    # Microservice technical documentation
│   └── requirements.txt             # Python dependencies (Flask, Pillow, numpy)
│
├── client/                          # Frontend Application (React 18 + Vite)
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Frontend dependencies and scripts
│   ├── postcss.config.js            # PostCSS configuration for Tailwind
│   ├── tailwind.config.js           # Custom design tokens & theme configuration
│   ├── vite.config.js               # Vite build config & backend API/uploads proxy
│   └── src/
│       ├── App.jsx                  # Main application routes & protected role layout
│       ├── index.css                # Global styles & Tailwind directives
│       ├── main.jsx                 # React root renderer
│       ├── components/
│       │   └── common/
│       │       ├── AcceptRequestModal.jsx   # Modal for scheduling pickup details
│       │       ├── AiImageAnalysisBanner.jsx# Forensic analysis badge & risk card
│       │       ├── CategoryCard.jsx         # Category display card
│       │       ├── ConfirmModal.jsx         # Action confirmation dialog
│       │       ├── EnquiryModal.jsx         # Buyer enquiry submission dialog
│       │       ├── Footer.jsx               # Universal platform footer
│       │       ├── ImageUploader.jsx        # Multi-image drag-and-drop component
│       │       ├── MaterialCard.jsx         # Grid item card with status pills
│       │       ├── Navbar.jsx               # Navigation bar with role tabs & notifications
│       │       ├── OrderChatModal.jsx       # Real-time order messaging thread
│       │       ├── OrderCompletionModal.jsx # Seller handover confirmation
│       │       ├── ProtectedRoute.jsx       # Client-side JWT & RBAC route guard
│       │       ├── StatCard.jsx             # Analytical dashboard stat tile
│       │       ├── StatusBadge.jsx          # Color-coded status badge
│       │       └── UpdatePickupModal.jsx    # Modal to update scheduled pickup slots
│       ├── context/
│       │   ├── AuthContext.jsx              # Global user authentication session context
│       │   └── ToastContext.jsx             # Global toast alert notification context
│       ├── layouts/
│       │   └── MainLayout.jsx               # Master page wrapper with Navbar & Footer
│       ├── pages/
│       │   ├── About.jsx                    # Platform mission & sustainability statistics
│       │   ├── AdminCategories.jsx          # Admin category CRUD manager
│       │   ├── AdminDashboard.jsx           # Admin executive metrics & platform KPIs
│       │   ├── AdminImageMonitoring.jsx     # Admin AI forensic review & deduplication board
│       │   ├── AdminMaterials.jsx           # Admin listing moderation & approval
│       │   ├── AdminUsers.jsx               # Admin user management & status toggling
│       │   ├── BrowseMaterials.jsx          # Multi-faceted search & catalog explorer
│       │   ├── BuyerDashboard.jsx           # Buyer overview, active requests & orders
│       │   ├── BuyerOrders.jsx              # Buyer order tracking & pickup instructions
│       │   ├── EditMaterial.jsx             # Seller listing editor & photo modifier
│       │   ├── FavoritesPage.jsx            # Buyer saved materials watchlist
│       │   ├── Home.jsx                     # Landing page with hero, search & features
│       │   ├── Login.jsx                    # Sign-in portal with email and password
│       │   ├── MaterialDetails.jsx          # Detailed listing view with image gallery
│       │   ├── NotFound.jsx                 # 404 error page
│       │   ├── Profile.jsx                  # User profile and address manager
│       │   ├── Register.jsx                 # Account registration (Buyer / Seller)
│       │   ├── RequestsPage.jsx             # Centralized request coordinator
│       │   ├── SellerDashboard.jsx          # Seller inventory metrics & listing manager
│       │   ├── SellerOrders.jsx             # Seller order fulfillment & pickup scheduling
│       │   ├── SellMaterial.jsx             # New listing submission form
│       │   └── TransactionsPage.jsx         # Historical completed transaction ledger
│       └── services/
│           └── api.js                       # Axios instance with JWT interceptors
│
└── server/                          # Backend Application (Node.js + Express)
    ├── .env.example                 # Server environment template (sanitized)
    ├── package.json                 # Backend dependencies, scripts, and test runners
    ├── server.js                    # Express application entry point & route mounting
    ├── config/
    │   ├── cloudinary.js            # Cloudinary SDK init & local disk fallback engine
    │   └── db.js                    # MongoDB connection with In-Memory fallback
    ├── controllers/
    │   ├── adminController.js       # Admin statistics, user management, material approval
    │   ├── aiController.js          # AI analysis, verification, flagging, and admin reviews
    │   ├── authController.js        # User registration, authentication, and session retrieval
    │   ├── categoryController.js    # Category retrieval and admin CRUD operations
    │   ├── favoriteController.js    # Watchlist toggle, retrieval, and status checks
    │   ├── materialController.js    # Listing CRUD, text search, filtering, and status toggle
    │   ├── messageController.js     # In-app contextual order messaging
    │   ├── notificationController.js# System notifications retrieval and read tracking
    │   ├── orderController.js       # Order creation, pickup scheduling, atomic completion
    │   ├── requestController.js     # Purchase enquiries, offer negotiation, acceptance
    │   └── userController.js        # Profile retrieval, updates, and avatar uploads
    ├── middleware/
    │   ├── authMiddleware.js        # JWT token verification (`protect`, `authorize`)
    │   ├── errorMiddleware.js       # 404 notFound & centralized error handling
    │   └── uploadMiddleware.js      # Multer file size/type validation filter (5MB max)
    ├── models/
    │   ├── Category.js              # Mongoose Category schema
    │   ├── Favorite.js              # Mongoose Favorite compound index schema
    │   ├── ImageAnalysis.js         # Mongoose ImageAnalysis forensic record schema
    │   ├── Material.js              # Mongoose Material listing schema with text index
    │   ├── Message.js               # Mongoose Order Chat Message schema
    │   ├── Notification.js          # Mongoose System Notification schema
    │   ├── Order.js                 # Mongoose Order & Pickup Coordination schema
    │   ├── Request.js               # Mongoose Purchase Enquiry schema
    │   └── User.js                  # Mongoose User credentials & profile schema
    ├── public/
    │   └── uploads/                 # Local disk image directory (Cloudinary fallback)
    ├── routes/
    │   ├── adminRoutes.js           # Admin routes (`/api/admin`)
    │   ├── aiRoutes.js              # AI forensic endpoints (`/api/ai`)
    │   ├── authRoutes.js            # Auth endpoints (`/api/auth`)
    │   ├── categoryRoutes.js        # Category endpoints (`/api/categories`)
    │   ├── favoriteRoutes.js        # Watchlist endpoints (`/api/favorites`)
    │   ├── materialRoutes.js        # Material catalog endpoints (`/api/materials`)
    │   ├── messageRoutes.js         # Order chat endpoints (`/api/messages`)
    │   ├── notificationRoutes.js    # Notification endpoints (`/api/notifications`)
    │   ├── orderRoutes.js           # Order fulfillment endpoints (`/api/orders`)
    │   ├── requestRoutes.js         # Enquiry endpoints (`/api/requests`)
    │   └── userRoutes.js            # User profile endpoints (`/api/users`)
    ├── services/
    │   ├── aiImageService.js        # pHash indexer, batch sync, and buffer resolver
    │   ├── aiImageVerificationService.js # 5-layer multi-signal forensic verification engine
    │   ├── aiInferenceService.js    # Client for Python microservice with Sharp fallback
    │   └── reverseImageSearchService.js # SerpApi Google Lens client & evaluation registry
    ├── tests/
    │   ├── cloudinaryIntegrationTest.js # 28-test Cloudinary & failover audit suite
    │   ├── comprehensiveMasterTest.js   # End-to-end integration test runner
    │   ├── evaluationBenchmark.js       # Precision, Recall & F1 forensic benchmark
    │   ├── runAiTests.js                # Perceptual hash unit test suite
    │   └── runApiRoutesTest.js          # AI routes & RBAC test runner
    └── utils/
        ├── aiHashService.js         # 2D DCT-II pHash, Hamming distance, similarity logic
        ├── aiMetadataService.js     # EXIF, TIFF, C2PA, and SHA-256 extraction utilities
        ├── seedData.js              # Realistic seed data (categories, users, materials)
        └── seeder.js                # Database seeder execution script (`-d` to destroy)
```

---

## 11. Prerequisites

Before installing BuildExchange on a new workstation, ensure the following runtimes are installed:

- **Node.js:** `v18.0.0` or higher (tested up to Node.js v22+)
- **npm:** `v9.0.0` or higher (bundled with Node.js)
- **Python:** `3.10` or higher (required only if running the `ai-service` microservice; the backend includes an automated in-process Node.js fallback if Python is omitted)
- **MongoDB:** (Optional) Local MongoDB Community Server `v6.0+` or a MongoDB Atlas cluster URI. *If neither is available, the server automatically starts an in-memory MongoDB instance for development.*
- **Git:** Version control client for cloning the repository

---

## 12. Installation and Setup

### Step 1: Clone or Navigate to the Project Root
```bash
git clone <repository-url>
cd ConstructionMet
```

### Step 2: Install Node Dependencies
The project provides a consolidated convenience script in root `package.json` that installs both server and client packages:
```bash
npm run install-all
```
*Alternatively, you can install them individually:*
```bash
cd server && npm install
cd ../client && npm install
cd ..
```

### Step 3: Install Python AI Service Dependencies (Optional but Recommended)
To enable the multi-signal AI image forensic microservice (ELA, 2D Fourier transform, and Laplacian texture roughness analysis):
```bash
cd ai-service
pip install -r requirements.txt
cd ..
```

### Step 4: Configure Environment Variables
Copy the sanitized environment template to create your `.env` configuration file in the project root:
```bash
cp .env.example .env
```
*(On Windows PowerShell, use `Copy-Item .env.example .env`)*

You can also place `.env` inside `server/.env`—the backend automatically searches both locations.

### Step 5: Seed the Database
Populate the database with standard construction categories, pre-configured demo users (Admin, Sellers, Buyers), realistic material listings, and image analysis indices:
```bash
npm run seed
```
*(To clear all database collections, run `npm run seed:destroy`)*

---

## 13. Environment Variable Configuration

The application reads its environment configuration from `.env` in the root or `server/` directory.

### Configuration Reference Table

| Variable Name | Required? | Default / Example Value | Description |
|---|:---:|---|---|
| `PORT` | Optional | `5000` | Port on which the Express API server listens |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGO_URI` | Optional | `mongodb://127.0.0.1:27017/construction_exchange` | Primary MongoDB connection URI. If offline, the server falls back to In-Memory MongoDB. |
| `JWT_SECRET` | **Required** | `your_jwt_secret_key_change_in_production` | Cryptographic secret for signing and verifying JWT tokens |
| `JWT_EXPIRE` | Optional | `30d` | JWT session lifetime token expiry (e.g., `30d`, `24h`) |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Allowed origin for CORS headers |
| `CLOUDINARY_URL` | Optional | *(Leave empty for local fallback)* | Full Cloudinary connection string (`cloudinary://key:secret@cloud_name`) |
| `CLOUDINARY_CLOUD_NAME` | Optional | `your_cloud_name` | Individual Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Optional | `your_api_key` | Individual Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | `your_api_secret` | Individual Cloudinary API secret |
| `PHASH_EXACT_THRESHOLD` | Optional | `0` | Hamming distance for 100% exact visual match |
| `PHASH_LIKELY_THRESHOLD` | Optional | `5` | Maximum Hamming distance to classify as `likely_duplicate` |
| `PHASH_POSSIBLE_THRESHOLD`| Optional | `10` | Maximum Hamming distance to classify as `possible_duplicate` |
| `AI_SERVICE_URL` | Optional | `http://127.0.0.1:5001` | URL of the Python AI forensic microservice |
| `AI_SERVICE_SECRET` | Optional | `buildexchange_ai_service_internal_secret_2026` | Shared authentication secret for internal microservice communication |
| `REVERSE_IMAGE_SEARCH_API_KEY`| Optional | *(Empty)* | SerpApi Google Lens key for external web image search |
| `SERPAPI_API_KEY` | Optional | *(Empty)* | Alias for reverse image search API key |

---

## 14. MongoDB Configuration

BuildExchange features an **Automated High-Availability Database Connector** (`server/config/db.js`):

1. **Primary Connection:** The backend attempts to connect to `process.env.MONGO_URI` (defaulting to `mongodb://127.0.0.1:27017/construction_exchange`).
2. **Connection Timeout:** A strict 2500ms timeout (`serverSelectionTimeoutMS: 2500`) prevents server startup hangs.
3. **Resilient In-Memory Fallback:** If standalone MongoDB is offline or unreachable, the system automatically initializes `mongodb-memory-server` in the background. It provides full MongoDB functionality, supports all Mongoose models, compound indexes, text queries, and seeders without requiring any manual database installation on the evaluation computer.

---

## 15. Cloudinary Configuration

BuildExchange implements an **Automated Media Storage Failover Engine** (`server/config/cloudinary.js`):

### Dual Credential Support
The server detects Cloudinary credentials through either:
- A consolidated URL string: `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`
- Individual parameters: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Automatic Zero-Config Local Storage Fallback
- **When Cloudinary credentials are provided:** Uploaded material photos stream via `cloudinary.uploader.upload_stream` to Cloudinary's secure CDN, returning permanent HTTPS URLs under the `construction_materials/` folder.
- **When credentials are omitted or the cloud upload fails:** The system catches the event without crashing and transparently redirects storage to `server/public/uploads/` on the local disk.
- **Vite Proxy Mapping:** The frontend Vite dev server (`client/vite.config.js`) proxies both `/api` and `/uploads` directly to `http://127.0.0.1:5000`, guaranteeing that images display seamlessly regardless of whether Cloudinary is active.

---

## 16. How to Run the Project

To run BuildExchange, open separate terminal windows for the backend, frontend, and (optionally) the AI microservice.

### Terminal 1: Start Backend Server
```bash
npm run server
```
*Script executes:* `npm run dev --prefix server` $\rightarrow$ `nodemon server.js`  
*Runs on:* **`http://localhost:5000`**

### Terminal 2: Start Frontend Client
```bash
npm run client
```
*Script executes:* `npm run dev --prefix client` $\rightarrow$ `vite`  
*Runs on:* **`http://localhost:5173`**

### Terminal 3: Start AI Forensic Microservice (Optional)
```bash
cd ai-service
python app.py
```
*Runs on:* **`http://127.0.0.1:5001`**  
*(If omitted, the Node.js backend seamlessly executes its built-in in-process Sharp Laplacian texture fallback).*

### Pre-Seeded Demonstration Accounts

All pre-seeded demo accounts share the universal password: **`Password@123`**

| Role | User Name | Email Address | Password | Demonstration Tasks |
|---|---|---|---|---|
| **Admin** | System Administrator | `admin@buildexchange.com` | `Password@123` | Platform metrics, user toggle/delete, approve listings, AI image monitoring |
| **Seller** | Rajesh Sharma | `rajesh.seller@gmail.com` | `Password@123` | Post surplus cement/steel, manage inventory, schedule pickups |
| **Seller** | Vikram Mehta | `vikram.mehta@infraapex.com` | `Password@123` | Manage bricks/blocks listings, accept requests, complete handovers |
| **Seller** | Sunil Kulkarni | `sunil.kulkarni@heritage.in` | `Password@123` | Plumbing & timber stock management, order chat |
| **Buyer** | Amit Kumar | `amit.buyer@gmail.com` | `Password@123` | Browse catalog, submit offers, track pickup schedules, chat |
| **Buyer** | Pooja Deshmukh | `pooja.deshmukh@gmail.com` | `Password@123` | Manage favorites watchlist, coordinate collection |

---

## 17. Application Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    actor Seller
    actor Admin
    participant Frontend as React Client (Vite)
    participant Backend as Express Server
    participant AI as AI Forensic Engine
    participant DB as MongoDB

    %% Listing Creation
    Seller->>Frontend: Fill listing form & upload photos
    Frontend->>Backend: POST /api/materials (multipart/form-data)
    Backend->>Backend: Upload to Cloudinary (or local fallback)
    Backend->>DB: Save Material Document
    Backend->>AI: Trigger Forensic Verification
    AI->>AI: Compute SHA-256, 2D DCT pHash, EXIF scan, ELA/DFT
    AI->>DB: Persist ImageAnalysis record & update Material summary
    Backend-->>Frontend: Listing Created (HTTP 201)

    %% Buyer Enquiry
    Buyer->>Frontend: Browse catalog & submit enquiry
    Frontend->>Backend: POST /api/requests (qty, offer price, note)
    Backend->>DB: Validate stock & create Request
    Backend-->>Frontend: Enquiry submitted (HTTP 201)

    %% Seller Acceptance & Pickup Scheduling
    Seller->>Frontend: Review enquiry & click Accept
    Frontend->>Backend: PATCH /api/requests/:id/accept (pickup schedule & address)
    Backend->>DB: Update Request status to 'accepted'
    Backend->>DB: Create Order (status: 'Pickup Scheduled')
    Backend->>DB: Create Notification for Buyer
    Backend-->>Frontend: Pickup scheduled successfully

    %% Pickup Coordination
    Seller->>Frontend: Mark "Ready for Pickup"
    Frontend->>Backend: PATCH /api/orders/:id/ready
    Backend->>DB: Update Order status to 'Ready for Pickup'
    Backend->>DB: Send notification to Buyer
    Buyer->>Seller: In-App Message (OrderChatModal)
    Buyer->>Seller: Physical arrival, inspection & cash/offline settlement

    %% Handover Completion & Stock Reduction
    Seller->>Frontend: Confirm material collection
    Frontend->>Backend: PATCH /api/orders/:id/complete
    Backend->>DB: Atomic stock decrement ($inc: quantity -order.qty)
    Backend->>DB: If quantity reaches 0, update Material status to 'sold'
    Backend->>DB: Update Order status to 'Completed'
    Backend-->>Frontend: Handover completed & inventory updated

    %% Admin Moderation
    Admin->>Frontend: Open /admin/ai-monitoring
    Frontend->>Backend: GET /api/ai/flagged
    Backend-->>Frontend: Return flagged duplicate/synthetic images
    Admin->>Frontend: Confirm or Dismiss flag
    Frontend->>Backend: PATCH /api/ai/:analysisId/review
    Backend->>DB: Update review status & notes
```

### Critical Operational Policy: Offline / On-Site Settlement
> **Notice:** BuildExchange coordinates physical material exchange, condition inspection, and pickup time windows. The application **does not process online payments or credit card transactions**. Financial settlement occurs directly between the buyer and seller upon physical inspection and handover at the collection site.

---

## 18. AI Image Verification Methodology

The BuildExchange integrity module combines multiple independent forensic layers to evaluate image authenticity:

```
                            [Uploaded Image]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  [Exact Match]            [Perceptual Hash]          [EXIF Forensics]
  SHA-256 Digest             2D DCT-II pHash          Exifr Parser
  (Identical bytes)        (Visual duplicates)      (Camera vs Stripped)
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
[Python AI Microservice]                           [In-Process Fallback]
  • Error Level Analysis (ELA)                       • Sharp 3x3 Laplacian Filter
  • 2D Discrete Fourier Transform (DFT)              • Pixel variance calculation
  • Laplacian texture variance roughness             • Synthetic gradient detection
  • Metadata generator chunk scan
                                   │
                                   ▼
             [Multi-Signal Decision & Risk Scoring Engine]
            (Risk Score 0-100, Verification Status, Reasons)
```

### 1. 2D Discrete Cosine Transform (pHash) Deduplication
*Implementation located in:* `server/utils/aiHashService.js`

1. **Standardized Downsampling & Grayscale Conversion:** Sharp resizes the input buffer to a fixed $32 \times 32$ matrix ($N = 32$) in raw 8-bit luminance values.
2. **Separable 2D DCT-II Decomposition:** The $32 \times 32$ luminance matrix is transformed into frequency space using row-wise 1D DCT followed by column-wise 1D DCT with precomputed cosine tables:
   $$X_{k} = \alpha_k \sum_{n=0}^{N-1} x_n \cos\left( \frac{\pi (2n+1)k}{2N} \right), \quad \alpha_k = \begin{cases} \sqrt{\frac{1}{N}} & k = 0 \\ \sqrt{\frac{2}{N}} & k > 0 \end{cases}$$
3. **Low-Frequency Coefficient Extraction:** The top-left $8 \times 8$ sub-matrix ($M = 8$, representing the 64 lowest non-zero AC frequencies) is extracted. The DC component at $(0,0)$ is excluded to ensure lighting invariance.
4. **Median AC Thresholding:** The median value of the 63 AC coefficients is computed.
5. **64-bit Binary Fingerprint Generation:** Each coefficient is compared against the median:
   $$b_{u,v} = \begin{cases} 1 & \text{if } \text{DCT}(u,v) > \text{median} \\ 0 & \text{otherwise} \end{cases}$$
6. **16-Character Hexadecimal Serialization:** The 64 bits are grouped into 4-bit nibbles to generate a compact 16-character hexadecimal hash (e.g., `d8b2a34f190c4e1a`).
7. **Hamming Distance Calculation:** The difference between two hashes is calculated using bitwise XOR and popcount:
   $$D_H(h_1, h_2) = \text{popcount}(h_1 \oplus h_2)$$
8. **Normalized Similarity Percentage:**
   $$\text{Similarity } (\%) = \frac{64 - D_H}{64} \times 100$$
9. **Decision Thresholds:**
   - $D_H = 0$: Exact visual match (`100%`)
   - $D_H \le 5$: `likely_duplicate` ($\ge 92.2\%$ visual similarity)
   - $6 \le D_H \le 10$: `possible_duplicate` ($84.4\% - 90.6\%$ visual similarity)
   - $D_H > 10$: `no_match` (distinct visual features)

### 2. Camera Hardware EXIF & Metadata Forensics
*Implementation located in:* `server/utils/aiMetadataService.js`

- **Hardware Signature Extraction:** Uses `exifr` to extract camera manufacturer (`Make`), camera model (`Model`), lens specification, focal length, ISO, exposure duration, capture timestamp, and GPS coordinates.
- **Stock Web Dimension Heuristics:** Flags standard desktop web and catalog thumbnail dimensions (e.g., $1920\times1080$, $1200\times800$, $800\times600$) compared to standard multi-megapixel mobile camera sensors.
- **Metadata Stripping Detection:** Detects files stripped of standard EXIF structures—common when images are downloaded from web browsers, social networks, or messaging apps.
- **C2PA Content Credentials Provenance:** Scans binary buffers for JUMBF (`jumb`) boxes and C2PA claim generators to identify cryptographically signed synthetic or edited media.

### 3. Synthetic AI Image Detection (Python Microservice)
*Implementation located in:* `ai-service/forensic_detector.py`

1. **Error Level Analysis (ELA):** Recompresses the image buffer at reference quality (92%) and measures pixel-wise absolute difference $\Delta = |I_{\text{original}} - I_{\text{recompressed}}|$. Real physical photos show a uniform noise floor across the entire sensor frame; synthetic diffusion renders exhibit abnormal compression layer variance.
2. **2D Discrete Fourier Transform (DFT) Power Spectrum:** Resizes image to $256 \times 256$ grayscale and performs 2D FFT with DC shifting. Generative diffusion decoders and convolutional upsamplers produce periodic high-frequency checkerboard grid artifacts and anomalous spectral spikes in the radial periphery (Frank et al., ICML 2020).
3. **High-Frequency Laplacian Texture Variance:** Evaluates micro-texture surface roughness using a discrete 2D Laplacian convolution kernel:
   $$K = \begin{bmatrix} 0 & 1 & 0 \\ 1 & -4 & 1 \\ 0 & 1 & 0 \end{bmatrix}$$
   Physical construction materials (concrete, bricks, stone aggregates, timber) produce high Laplacian variance ($> 250$). Generative models frequently produce unnaturally smooth, plastic surface gradients ($< 80$).
4. **Generator Provenance Scanner:** Scans metadata chunks for signatures from Midjourney, Stable Diffusion, DALL-E, ComfyUI, NovelAI, Adobe Firefly, and Civitai.

### 4. Technical Distinction Between pHash and AI Detection
> **Important Distinction:** Perceptual hashing (pHash) is designed specifically to detect visual duplicates and near-identical re-uploads (e.g., cropped, resized, or re-compressed copies of previously listed photos). **pHash alone does not detect whether an image is AI-generated.** AI-generated image detection is performed by the dedicated multi-signal forensic pipeline analyzing frequency-domain spectral spikes, ELA recompression variance, and surface roughness metrics.

---

## 19. API Documentation and Important Endpoints

All endpoints are prefixed with `/api`. Protected routes require a valid JWT token passed in the `Authorization: Bearer <token>` HTTP header.

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Request Body | Expected Response | Description |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ name, email, phone, password, role, address, city, district, state, pincode }` | `{ success: true, token, user }` | Registers a new user account |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | `{ success: true, token, user }` | Authenticates user & issues JWT token |
| `GET` | `/api/auth/me` | Private | None | `{ success: true, user }` | Returns current user profile from token |

### 2. User Profile Endpoints (`/api/users`)

| Method | Endpoint | Access | Request Body / Form | Expected Response | Description |
|---|---|---|---|---|---|
| `GET` | `/api/users/profile` | Private | None | `{ success: true, user }` | Returns user details and populated activity |
| `PUT` | `/api/users/profile` | Private | Multipart: `profileImage` (file), `name`, `phone`, `address`, `city`, `district`, `state`, `pincode`, `password` | `{ success: true, user }` | Updates user profile and optional avatar |

### 3. Material Listing Endpoints (`/api/materials`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `GET` | `/api/materials` | Public | Query: `keyword`, `category`, `condition`, `state`, `city`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` | `{ success: true, count, totalPages, currentPage, materials: [...] }` | Multi-faceted search and catalog listing |
| `GET` | `/api/materials/featured` | Public | None | `{ success: true, materials: [...] }` | Returns latest 8 available listings |
| `GET` | `/api/materials/my` | Seller/Admin | None | `{ success: true, count, materials: [...] }` | Retrieves listings posted by seller |
| `GET` | `/api/materials/:id` | Public | URL Param: `id` | `{ success: true, material }` | Returns single listing & increments view count |
| `POST` | `/api/materials` | Seller/Admin | Multipart `images` (up to 6), `name`, `category`, `description`, `quantity`, `unit`, `condition`, `price`, `address`, `city`, `district`, `state`, `pincode`, `contactPhone` | `{ success: true, material }` | Creates new listing & triggers AI analysis |
| `PUT` | `/api/materials/:id` | Seller/Admin | Multipart: new `images`, `existingImages`, text fields | `{ success: true, material }` | Updates listing details and images |
| `DELETE`| `/api/materials/:id` | Seller/Admin | URL Param: `id` | `{ success: true, message }` | Deletes listing and destroys media assets |
| `PATCH`| `/api/materials/:id/status`| Seller/Admin | Body: `{ status: 'available' \| 'sold' }` | `{ success: true, material }` | Toggles listing availability status |

### 4. Enquiry & Request Endpoints (`/api/requests`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `POST` | `/api/requests` | Private | Body: `{ materialId, quantity, message, contactPhone, contactEmail }` | `{ success: true, request }` | Submits purchase enquiry to seller |
| `GET` | `/api/requests/my` | Private | None | `{ success: true, requests: [...] }` | Returns enquiries submitted by buyer |
| `GET` | `/api/requests/received`| Seller/Admin | None | `{ success: true, requests: [...] }` | Returns enquiries received by seller |
| `PATCH`| `/api/requests/:id/accept`| Seller/Admin | Body: `{ pickupAddress, pickupCity, pickupDate, pickupStartTime, pickupEndTime, sellerNote }` | `{ success: true, request, order }` | Accepts enquiry & creates scheduled Order |
| `PATCH`| `/api/requests/:id/reject`| Seller/Admin | Body: `{ sellerNote }` | `{ success: true, request }` | Rejects enquiry with explanation note |
| `PATCH`| `/api/requests/:id/status`| Seller/Admin | Body: `{ status }` | `{ success: true, request }` | Updates generic request status |

### 5. Order Fulfillment & Pickup Endpoints (`/api/orders`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `POST` | `/api/orders` | Private | Body: `{ materialId, quantity, requestId, pickupAddress, pickupCity, pickupDate, pickupStartTime, pickupEndTime, sellerMessage }` | `{ success: true, order }` | Directly creates scheduled order |
| `GET` | `/api/orders/my` | Private | Query: `status` | `{ success: true, count, orders: [...] }` | Retrieves orders placed by buyer |
| `GET` | `/api/orders/seller` | Seller/Admin | Query: `status` | `{ success: true, count, orders: [...] }` | Retrieves orders fulfilled by seller |
| `GET` | `/api/orders/transactions`| Private | None | `{ success: true, count, orders: [...] }` | Historical ledger of completed orders |
| `GET` | `/api/orders/:id` | Private | URL Param: `id` | `{ success: true, order }` | Retrieves single order details |
| `PATCH`| `/api/orders/:id/pickup` | Seller/Admin | Body: `{ pickupAddress, pickupCity, pickupDate, pickupStartTime, pickupEndTime, sellerMessage }` | `{ success: true, order }` | Updates scheduled pickup time/place |
| `PATCH`| `/api/orders/:id/ready` | Seller/Admin | URL Param: `id` | `{ success: true, order }` | Marks order "Ready for Pickup" |
| `PATCH`| `/api/orders/:id/complete`| Seller/Admin | URL Param: `id` | `{ success: true, order }` | Completes order & atomically decrements stock |
| `PATCH`| `/api/orders/:id/cancel` | Private | Body: `{ cancellationReason }` | `{ success: true, order }` | Cancels scheduled order |

### 6. Order Messaging Endpoints (`/api/messages`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `POST` | `/api/messages` | Private | Body: `{ orderId, message }` | `{ success: true, data: message }` | Sends in-app message within active order |
| `GET` | `/api/messages/order/:orderId` | Private | URL Param: `orderId` | `{ success: true, count, data: [...] }` | Retrieves all messages for an order |
| `PATCH`| `/api/messages/:id/read` | Private | URL Param: `id` | `{ success: true, data: message }` | Marks message as read |

### 7. Notification Endpoints (`/api/notifications`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `GET` | `/api/notifications` | Private | None | `{ success: true, unreadCount, count, notifications: [...] }` | Retrieves notifications for user |
| `PATCH`| `/api/notifications/read-all`| Private | None | `{ success: true, message }` | Marks all notifications as read |
| `PATCH`| `/api/notifications/:id/read`| Private | URL Param: `id` | `{ success: true, notification }` | Marks single notification as read |

### 8. Watchlist Endpoints (`/api/favorites`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `GET` | `/api/favorites` | Private | None | `{ success: true, count, favorites: [...] }` | Returns user's saved materials |
| `POST` | `/api/favorites/:materialId` | Private | URL Param: `materialId` | `{ success: true, message, isFavorite: true }` | Adds listing to favorites |
| `DELETE`| `/api/favorites/:materialId`| Private | URL Param: `materialId` | `{ success: true, message, isFavorite: false }`| Removes listing from favorites |
| `GET` | `/api/favorites/check/:materialId`| Private| URL Param: `materialId` | `{ success: true, isFavorite: boolean }` | Checks favorite status of a listing |

### 9. Category Endpoints (`/api/categories`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `GET` | `/api/categories` | Public | None | `{ success: true, count, categories: [...] }` | Returns all available categories |
| `POST` | `/api/categories` | Admin | Body: `{ name, description, image, icon }` | `{ success: true, category }` | Creates new material category |
| `PUT` | `/api/categories/:id` | Admin | Body: `{ name, description, image, icon }` | `{ success: true, category }` | Updates existing category details |
| `DELETE`| `/api/categories/:id` | Admin | URL Param: `id` | `{ success: true, message }` | Deletes category (fails if items linked) |

### 10. Admin Endpoints (`/api/admin`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | None | `{ success: true, stats: { users, materials, requests, orders, value } }` | Overall platform KPIs & metrics |
| `GET` | `/api/admin/users` | Admin | Query: `role`, `search`, `page`, `limit` | `{ success: true, count, users: [...] }` | Lists registered users |
| `PATCH`| `/api/admin/users/:id/status`| Admin | None | `{ success: true, user }` | Toggles user active / disabled state |
| `DELETE`| `/api/admin/users/:id` | Admin | URL Param: `id` | `{ success: true, message }` | Permanently deletes user account |
| `GET` | `/api/admin/materials` | Admin | Query: `status`, `approved`, `search` | `{ success: true, count, materials: [...] }` | Comprehensive listing moderation view |
| `PATCH`| `/api/admin/materials/:id/approve`| Admin| Body: `{ isApproved: boolean }` | `{ success: true, material }` | Approves or rejects listing |
| `DELETE`| `/api/admin/materials/:id` | Admin | URL Param: `id` | `{ success: true, message }` | Deletes fraudulent or invalid listing |
| `GET` | `/api/admin/requests` | Admin | None | `{ success: true, count, requests: [...] }` | System-wide view of all enquiries |

### 11. AI Forensic & Verification Endpoints (`/api/ai`)

| Method | Endpoint | Access | Parameters / Body | Expected Response | Description |
|---|---|---|---|---|---|
| `POST` | `/api/ai/analyze-image` | Private | Multipart `image` OR JSON `{ imageUrl }` | `{ success: true, imageHash, hammingDistance, similarityScore, result, closestMatch, similarMatches }` | pHash deduplication lookup |
| `POST` | `/api/ai/verify-image` | Private | Multipart `image` OR JSON `{ imageUrl }` | `{ success: true, verificationStatus, imageOriginPrediction, riskScore, confidenceLevel, reasons, metadataFindings }` | Full multi-signal authenticity verification |
| `GET` | `/api/ai/material/:materialId` | Private | URL Param: `materialId` | `{ success: true, count, analyses: [...] }` | Retrieves forensic analysis for listing |
| `GET` | `/api/ai/flagged` | Admin | Query: `status`, `reviewStatus`, `page` | `{ success: true, count, flagged: [...] }` | Lists flagged duplicate/synthetic images |
| `PATCH`| `/api/ai/:analysisId/review` | Admin | Body: `{ reviewStatus: 'confirmed' \| 'dismissed', reviewNotes }` | `{ success: true, analysis }` | Admin decision on flagged image |
| `POST` | `/api/ai/sync` | Admin | None | `{ success: true, result: { indexedCount, skippedCount, totalMaterials } }` | Batch indexes catalog images for pHash |
| `GET` | `/api/ai/stats` | Admin | None | `{ success: true, stats: { totalAnalyzed, flaggedCount, reviewedCount, averageRiskScore } }` | High-level forensic engine metrics |

### 12. Health Check Endpoint
- **`GET /api/health`** (Public): Returns server status, timestamp, and active environment.

---

## 20. Database Models and Relationships

```mermaid
erDiagram
    User ||--o{ Material : "lists"
    User ||--o{ Request : "submits (buyer)"
    User ||--o{ Request : "receives (seller)"
    User ||--o{ Order : "places (buyer)"
    User ||--o{ Order : "fulfills (seller)"
    User ||--o{ Message : "sends / receives"
    User ||--o{ Notification : "receives"
    User ||--o{ Favorite : "saves"
    Category ||--o{ Material : "categorizes"
    Material ||--o{ Request : "requested in"
    Material ||--o{ Order : "ordered in"
    Material ||--o{ Favorite : "bookmarked as"
    Material ||--o{ ImageAnalysis : "analyzed in"
    Request ||--o| Order : "converted to"
    Order ||--o{ Message : "contains"
```

### Schema Field Summary

#### 1. `User` Model (`server/models/User.js`)
- `name` (String, required, max 100)
- `email` (String, required, unique, lowercase, regex-validated)
- `phone` (String, required)
- `password` (String, required, min 6, hashed with bcryptjs, hidden by default `select: false`)
- `role` (String, enum: `['buyer', 'seller', 'admin']`, default: `'buyer'`)
- `address`, `city`, `district`, `state`, `pincode` (Strings for geographical locality)
- `profileImage` (String URL)
- `isActive` (Boolean, default: `true`)
- Timestamps: `createdAt`, `updatedAt`

#### 2. `Category` Model (`server/models/Category.js`)
- `name` (String, required, unique, max 50)
- `description` (String)
- `image` (String URL)
- `icon` (String, Lucide icon identifier, default: `'Box'`)
- Timestamps: `createdAt`, `updatedAt`

#### 3. `Material` Model (`server/models/Material.js`)
- `sellerId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `name` (String, required, max 120, text indexed)
- `category` (String, required, indexed, text indexed)
- `description` (String, required, max 3000, text indexed)
- `quantity` (Number, required, min 0)
- `unit` (String, required, e.g. `'Bags'`, `'Pieces'`, `'Sq.Ft'`, `'Kg'`, `'Tons'`)
- `condition` (String, required, enum: `['New', 'Like New', 'Good', 'Used', 'Damaged']`)
- `price` (Number, required, min 0, INR currency)
- `images` (Array of `{ url: String, public_id: String }`, min 1 image required)
- `address`, `city`, `district`, `state`, `pincode` (Geographic location, 6-digit postal regex)
- `contactPhone` (String)
- `status` (String, enum: `['available', 'sold']`, default: `'available'`)
- `isApproved` (Boolean, default: `true`, indexed)
- `verificationSummary` (Embedded object: `status`, `origin`, `riskScore`, `aiGeneratedScore`, `duplicateMatch`, `checkedAt`)
- `views` (Number, default: 0)
- Timestamps: `createdAt`, `updatedAt`
- **Compound Text Index:** `{ name: 'text', category: 'text', description: 'text', city: 'text', district: 'text', state: 'text' }`

#### 4. `Request` Model (`server/models/Request.js`)
- `buyerId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `sellerId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `materialId` (ObjectId $\rightarrow$ `Material`, required, indexed)
- `quantity` (Number, required, min 1)
- `message` (String, required, max 1000)
- `contactPhone` (String, required)
- `contactEmail` (String)
- `status` (String, enum: `['pending', 'accepted', 'rejected', 'completed', 'cancelled']`, default: `'pending'`)
- `orderId` (ObjectId $\rightarrow$ `Order`, optional)
- `sellerNote` (String)
- Timestamps: `createdAt`, `updatedAt`

#### 5. `Order` Model (`server/models/Order.js`)
- `buyerId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `sellerId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `materialId` (ObjectId $\rightarrow$ `Material`, required, indexed)
- `requestId` (ObjectId $\rightarrow$ `Request`, optional)
- `quantity` (Number, required, min 1)
- `unitPrice` (Number, required, min 0)
- `totalPrice` (Number, required, min 0)
- `status` (String, enum: `['Pending', 'Accepted', 'Pickup Scheduled', 'Ready for Pickup', 'Completed', 'Cancelled']`, default: `'Pickup Scheduled'`)
- `pickupAddress`, `pickupCity`, `pickupDistrict`, `pickupPincode`, `pickupLandmark` (Strings, site collection location)
- `pickupDate`, `pickupStartTime`, `pickupEndTime` (Strings, coordinated collection window)
- `sellerMessage` (String)
- `acceptedAt`, `pickupScheduledAt`, `readyAt`, `completedAt`, `cancelledAt` (Date milestones)
- `cancellationReason` (String)
- Timestamps: `createdAt`, `updatedAt`

#### 6. `Message` Model (`server/models/Message.js`)
- `senderId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `receiverId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `orderId` (ObjectId $\rightarrow$ `Order`, required, indexed)
- `message` (String, required, max 2000)
- `read` (Boolean, default: `false`, indexed)
- Timestamps: `createdAt`, `updatedAt`

#### 7. `Notification` Model (`server/models/Notification.js`)
- `userId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `type` (String, default: `'order_update'`)
- `title` (String, required)
- `message` (String, required)
- `relatedOrderId` (ObjectId $\rightarrow$ `Order`)
- `relatedRequestId` (ObjectId $\rightarrow$ `Request`)
- `isRead` (Boolean, default: `false`, indexed)
- Timestamps: `createdAt`, `updatedAt`

#### 8. `Favorite` Model (`server/models/Favorite.js`)
- `userId` (ObjectId $\rightarrow$ `User`, required, indexed)
- `materialId` (ObjectId $\rightarrow$ `Material`, required, indexed)
- **Unique Compound Index:** `{ userId: 1, materialId: 1 }` (prevents duplicate bookmarks)
- Timestamp: `createdAt`

#### 9. `ImageAnalysis` Model (`server/models/ImageAnalysis.js`)
- `materialId` (ObjectId $\rightarrow$ `Material`, indexed)
- `sellerId` (ObjectId $\rightarrow$ `User`, indexed)
- `imageUrl`, `public_id` (String)
- `exactFileHash` (String, 64-char SHA-256 hex digest)
- `imageHash` (String, 16-char 2D DCT pHash hex fingerprint)
- `hammingDistance` (Number, 0-64)
- `similarityScore` (Number, 0-100%)
- `duplicateMatch` (Boolean)
- `closestMatch` (Embedded object: `analysisId`, `materialId`, `imageUrl`, `hammingDistance`, `similarityScore`, `isExactByteMatch`)
- `similarMatches` (Array of closest match objects)
- `metadataFindings` (Embedded object: `hasExif`, `isStripped`, `evidenceType`, `cameraMake`, `cameraModel`, `software`, `isAiSoftwareDetected`, `warnings`)
- `provenanceFindings` (Embedded object: `c2paManifestFound`, `hasDigitalSignature`, `claimGenerator`)
- `sourceMatches` (Array of external reverse image search results)
- `aiGeneratedScore` (Number, 0.0 to 1.0)
- `verificationStatus` (Enum: `['LIKELY_ORIGINAL', 'POSSIBLY_DOWNLOADED', 'POSSIBLY_AI_GENERATED', 'DUPLICATE_DETECTED', 'MANUAL_REVIEW_REQUIRED', 'VERIFICATION_UNAVAILABLE']`)
- `imageOriginPrediction` (Enum: `['camera_captured', 'web_downloaded', 'ai_generated', 'duplicate', 'unknown']`)
- `riskScore` (Number, 0-100)
- `confidenceLevel` (Enum: `['LOW', 'MEDIUM', 'HIGH']`)
- `reasons` (Array of explanation strings)
- `reviewStatus` (Enum: `['not_reviewed', 'reviewed', 'dismissed', 'confirmed']`, default: `'not_reviewed'`)
- `reviewedBy` (ObjectId $\rightarrow$ `User`), `reviewedAt` (Date), `reviewNotes` (String)
- Compound Indexes: `{ verificationStatus: 1, reviewStatus: 1, createdAt: -1 }`, `{ result: 1, reviewStatus: 1, createdAt: -1 }`

---

## 21. Testing Instructions

The repository includes structured automated test suites located in `server/tests/`:

### 1. Cloudinary Integration & Security Audit Suite
Executes 28 automated tests across 7 audit suites verifying dual-mode credentials, upload streaming, listing update asset replacements, listing deletion image purges, 5MB file limits, non-image rejection, unauthorized route guards, and zero-downtime local disk failover:
```bash
cd server
npm run test:cloudinary
```

### 2. AI Routes & RBAC Authorization Suite
Tests AI analysis endpoints, pHash lookups, authentication protection, and admin-only flagging/review endpoints:
```bash
cd server
node tests/runApiRoutesTest.js
```

### 3. Perceptual Hash (pHash) Unit Test Suite
Evaluates DCT-II transform mathematics, BigInt Hamming distance calculation, scaling invariance, and similarity thresholds:
```bash
cd server
node tests/runAiTests.js
```

### 4. Image Verification & Forensic Evaluation Benchmark
Benchmarks the multi-signal forensic verification pipeline across camera-captured photos, web downloads, exact duplicates, near-duplicates, and synthetic AI images, calculating Precision, Recall, Accuracy, and F1-Scores:
```bash
cd server
node tests/evaluationBenchmark.js
```

---

## 22. Troubleshooting

### Issue 1: "Primary MongoDB connection failed, starting In-Memory fallback"
- **Cause:** Standalone MongoDB service is not running on `mongodb://127.0.0.1:27017`.
- **Resolution:** No action required! The server detects this within 2.5 seconds and automatically starts `MongoMemoryServer`. If you want to persist data to a real database across restarts, start MongoDB locally via `net start MongoDB` (Windows) or update `MONGO_URI` to a MongoDB Atlas cluster URI in your `.env` file.

### Issue 2: "No Cloudinary API keys supplied in .env. Using built-in local static uploads directory as fallback"
- **Cause:** Cloudinary credentials (`CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`) are not set in `.env`.
- **Resolution:** The platform operates normally in local fallback mode, saving images to `server/public/uploads/` and serving them through the Vite proxy. To enable cloud hosting, obtain free credentials from [Cloudinary](https://cloudinary.com) and add them to `.env`.

### Issue 3: "Port 5000 or 5173 is already in use"
- **Cause:** A previous Node.js server instance or another development tool is occupying the port.
- **Resolution (Windows PowerShell):**
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
  ```

### Issue 4: Python AI Service connection error / timeout
- **Cause:** The Python microservice (`ai-service`) is not running on port 5001.
- **Resolution:** The Node.js backend handles this seamlessly by falling back to its built-in in-process Sharp Laplacian texture filter. If you wish to enable full Fourier and ELA analysis, open a terminal, run `cd ai-service && pip install -r requirements.txt && python app.py`.

### Issue 5: CORS Errors in Browser Console
- **Cause:** The frontend is running on a port not listed in `server.js` allowed origins.
- **Resolution:** Ensure `CLIENT_URL=http://localhost:5173` is set in `.env`. The server automatically allows `http://localhost:5173` and `http://127.0.0.1:5173` in development.

---

## 23. Security Considerations

- **Password Cryptography:** User passwords are encrypted using `bcryptjs` with 10 salt rounds prior to MongoDB storage. Passwords are never returned in database projections (`select: false`).
- **Stateless JWT Tokens:** Authentication utilizes cryptographic HMAC SHA-256 JSON Web Tokens with configurable expiration (`JWT_EXPIRE=30d`).
- **Role-Based Access Control (RBAC):** Middleware (`protect` and `authorize`) verifies user tokens and asserts strict role hierarchies (`buyer`, `seller`, `admin`).
- **HTTP Security Headers:** `helmet` applies essential security headers (XSS filtering, frameguard, no-sniff) while setting `crossOriginResourcePolicy: false` so that static uploaded images load correctly across frontend origins.
- **CORS Whitelisting:** Strictly restricts external origin access in production to verified frontend clients.
- **File Upload Safeguards:** `multer` restricts uploads to authenticated users, limits batch sizes to 6 files, caps file size at 5MB, and validates MIME types strictly against `image/jpeg`, `image/png`, and `image/webp`.
- **API Secret Isolation:** Cloudinary and AI service secrets reside strictly in backend memory and are never serialized into client responses.
- **Race Condition Prevention:** Inventory reduction uses atomic database modifications (`$inc: { quantity: -order.quantity }` with a condition `{ quantity: { $gte: order.quantity } }`), preventing concurrent over-allocation.

---

## 24. Future Enhancements

1. **Real-Time WebSocket Gateway:** Upgrade current in-app polling chat and notifications to live bidirectional WebSockets (Socket.io) with typing indicators and online presence indicators.
2. **Escrow Payment Integration:** Incorporate Razorpay or Stripe webhooks to hold buyer deposits in a digital escrow account, releasing funds to sellers only after physical site inspection approval.
3. **Automated Defect & Structural Damage Detection:** Integrate a YOLOv8 or Vision Transformer (ViT) model to automatically analyze uploaded concrete photos for crack widths, steel rebars for surface corrosion percentages, and timber for dry rot.
4. **Logistics & Freight Calculation:** Integrate Google Maps Distance Matrix API to calculate hauling freight costs per kilometer based on estimated material tonnage and transport vehicle class (mini-truck vs flatbed).
5. **Mobile Applications:** Package native mobile applications for iOS and Android using React Native or Flutter to enable on-site barcode scanning and camera uploads.

---

## 25. Project Limitations

1. **No Online Payment Processing:** In accordance with the project's peer-to-peer collection model, financial settlement is conducted offline/on-site upon physical handover inspection. No credit card or banking gateway is embedded.
2. **Offline Local Storage Scalability:** When running in local disk fallback mode without Cloudinary, uploaded images are saved to the server's local file system. In multi-instance load-balanced deployments, shared object storage (Cloudinary, AWS S3, or GCS) is required.
3. **Web-Stripped Metadata Limitations:** When users upload photos previously shared through messaging apps (e.g., WhatsApp) or social media, EXIF hardware tags are stripped by those platforms. In such cases, the system relies on frequency-domain spectral analysis and texture variance rather than hardware EXIF tags.
4. **Logistics Coordination:** Material transport and hauling logistics must be agreed upon directly between buyers and sellers. The platform does not dispatch third-party freight vehicles.

---

## 26. License

This project is licensed under the **ISC License**, as declared in `package.json`:

```text
ISC License (ISC)

Copyright (c) 2026 BuildExchange Project Team

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
