# Vellora Jewels - E-Commerce Platform

Welcome to **Vellora Jewels**, a premium e-commerce platform for jewelry. This repository is structured as a monorepo containing three core components: the customer storefront, the administrative dashboard, and a robust Node.js backend.

---

## 📁 Repository Structure

The project is split into three main directories:

*   **[`client`](file:///c:/Users/Shivani%20Sharma/Desktop/jewellary/client)**: Customer-facing storefront built with **Next.js 15 (TypeScript)**, **React 19**, **Tailwind CSS v4**, **Redux Toolkit**, and **Zustand**.
*   **[`admin`](file:///c:/Users/Shivani%20Sharma/Desktop/jewellary/admin)**: Administrative dashboard built with **React 18**, **Vite**, **Windmill UI**, and **Tailwind CSS v3**. Runs on port `4100` by default.
*   **[`server`](file:///c:/Users/Shivani%20Sharma/Desktop/jewellary/server)**: REST API backend server built with **Node.js**, **Express**, and **Mongoose (MongoDB)**. It features payment integrations (Stripe, Razorpay, PayPal) and Swagger API documentation.

---

## ⚙️ Getting Started & Installation

### Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v18.x or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas URI)
- **npm** or **yarn**

---

### 1. Backend Server Setup (`/server`)

The backend handles database interactions, authentication, orders, payments, and product management.

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   - Rename `.env.development` or configure a `.env` file in the `server` directory.
   - Ensure the following variables are configured:
     ```env
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/vellora_jewels
     JWT_SECRET=your_jwt_secret_key
     ```
4. Seed the database with sample jewelry data:
   ```bash
   npm run data:import
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

---

### 2. Admin Dashboard Setup (`/admin`)

The admin panel allows management of categories, products, orders, customers, and discount coupons.

1. Navigate to the admin folder:
   ```bash
   cd ../admin
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Configure the env variables:
   - Create a `.env` file containing the backend URL pointing to your running server (e.g., `http://localhost:5000/api`).
4. Start the development server (runs on `http://localhost:4100`):
   ```bash
   npm run dev
   ```

---

### 3. Customer Storefront Setup (`/client`)

The Next.js storefront allows customers to browse jewelry, add items to their cart, apply coupons, and make purchases.

1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Configure the env variables:
   - Create/modify the `.env` file to reference the backend API endpoint.
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000` to see the storefront.

---

## 🛠️ Summary of Available Scripts

| Directory | Script | Command | Description |
| :--- | :--- | :--- | :--- |
| **`server`** | `npm run dev` | `nodemon api/index.js` | Starts server in development mode |
| **`server`** | `npm run start` | `node api/index.js` | Runs server in production mode |
| **`server`** | `npm run data:import` | `node script/seed.js` | Seeds DB with sample products & categories |
| **`admin`** | `npm run dev` | `vite --force --port 4100` | Starts Admin dashboard on port 4100 |
| **`admin`** | `npm run build` | `vite build` | Builds Admin dashboard for production |
| **`client`** | `npm run dev` | `next dev` | Starts Client Next.js storefront |
| **`client`** | `npm run build` | `next build` | Builds Next.js storefront for production |

---

## 🔐 Payment & Third-Party Integrations
The backend is integrated with:
- **PayPal Checkout SDK**
- **Stripe**
- **Razorpay**
- **Cloudinary** (For product image uploads)
- **Nodemailer** (For transactional emails)


## Developed by Aman and Team