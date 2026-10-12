# VTC Shoe / E-Commerce Platform

A comprehensive, full-stack B2B/B2C E-commerce platform featuring a modern storefront, a powerful admin dashboard, and a robust RESTful API backend.

## 🚀 Features

### Client Storefront
- **Modern UI/UX**: Built with Next.js 15 (App Router) and Tailwind CSS 4.
- **Product Catalog**: Advanced search, filtering, and categorization.
- **Shopping Cart & Checkout**: Seamless checkout experience with guest and authenticated user flows.
- **Payment Gateways**: Secure payments via Razorpay, Stripe, and Cash on Delivery (COD).
- **Customer Dashboard**: Track orders, view purchase history, and manage profile.
- **Loyalty Program**: Earn points on purchases and redeem them on future orders.

### Admin Dashboard
- **Comprehensive Management**: Manage products, categories, attributes, and inventory.
- **Order Processing**: View, process, and dispatch customer and vendor orders (Sale Orders).
- **User Management**: Manage customers, vendors, and internal staff roles.
- **Analytics & Reporting**: Interactive charts and data tables for sales and stock.
- **Discounts & Coupons**: Create and manage promotional campaigns, promo codes, and sundry discounts.
- **System Settings**: Configure shipping rules, currencies, languages, and notifications.

### Backend API
- **Secure & Scalable**: Node.js & Express API with MongoDB (Mongoose) database.
- **Authentication**: JWT-based secure authentication and role-based access control (RBAC).
- **Integrations**: Cloudinary for media management, Nodemailer for emails, and payment providers.
- **API Documentation**: Built-in Swagger UI for API endpoint reference.

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend (Store)** | Next.js 15, React 19, Tailwind CSS 4, Redux Toolkit, Zustand |
| **Frontend (Admin)** | React 18, Vite, Tailwind CSS, Redux Toolkit, Windmill UI |
| **Backend (API)** | Node.js, Express, MongoDB, Mongoose, JWT, Swagger |
| **Integrations** | Razorpay, Stripe, Cloudinary, PayPal |

## 📦 Project Structure

The project is structured into three main directories:

- `/client` - The Next.js storefront application.
- `/admin` - The Vite + React administrative dashboard.
- `/server` - The Node.js + Express backend API.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)
- Accounts for Cloudinary, Razorpay, or Stripe (optional, for full feature functionality)

### 1. Clone the Repository
```bash
git clone https://github.com/iamanKushwah09/pharma.git
cd pharma
```

### 2. Environment Setup
You will need to configure environment variables for all three directories (`server`, `client`, `admin`). 
Create `.env` files in each respective directory based on their `.env.example` (if provided) or setup the following essential variables:

**Server (`/server/.env`)**
```env
PORT=5056
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_URL=your_cloudinary_url
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_KEY=your_stripe_key
```

**Client (`/client/.env`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5056/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

**Admin (`/admin/.env`)**
```env
VITE_APP_API_BASE_URL=http://localhost:5056/api
```

### 3. Install Dependencies
Install dependencies for each part of the application:

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install

# Install Admin dependencies
cd ../admin
npm install
```

### 4. Running the Development Servers

You can run the servers individually in separate terminal windows:

**Run Server:**
```bash
cd server
npm run dev
```

**Run Storefront:**
```bash
cd client
npm run dev
```

**Run Admin Dashboard:**
```bash
cd admin
npm run dev
```

- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:4100](http://localhost:4100)
- **API Server**: [http://localhost:5056](http://localhost:5056)
- **Swagger Docs**: [http://localhost:5056/api-docs](http://localhost:5056/api-docs)

## 📄 License
This project is licensed under the ISC License.
