<div align="center">
  <h1>👟 Juttax</h1>
  <p>Nepal's Marketplace for Handmade, Custom-Made & Everyday Footwear</p>

  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white" alt="Redux" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<br />

## 📖 Project Overview

**Juttax** is a full-stack MERN marketplace focused entirely on footwear — connecting Nepali shoemakers and cobblers (in Kathmandu, Lalitpur, and Bhaktapur) with shoppers looking for everything from everyday sneakers to handmade traditional jutta.

Built on the MERN stack, it implements persistent cart state management, role-based authorization, and secure payment simulation via the Stripe API — plus a footwear-specific catalog with sizes, colors, materials, maker/seller info, and Nepal-focused filtering.

## ✨ Core Features

### For Shoppers
* **Authentication & Security:** Secure registration and login using JWT (JSON Web Tokens) and bcryptjs for password hashing.
* **Full Footwear Category Tree:** Men, Women, Kids, Traditional / Local, and Sports — each with detailed sub-categories.
* **Rich Filtering:** Filter any listing by price, size, color, material, maker/seller, location, handmade, made in Nepal, ready stock vs. made to order, and rating.
* **Shop by Maker:** Browse footwear directly by the maker's city — Kathmandu, Lalitpur, or Bhaktapur.
* **Featured Local Collections:** Curated views for Made in Nepal, Handmade, New Arrivals, Best Selling, Budget and Premium footwear.
* **Interactive Shopping Cart:** Persistent cart state managed by Redux Toolkit and LocalStorage.
* **Secure Checkout:** Multi-step checkout flow handling shipping details and Stripe payment processing.
* **User Dashboard:** Logged-in users can manage their profiles, leave product reviews, and track order history.

### For Administrators (Admin Dashboard)
* **Inventory Management:** Full CRUD for products, including category/sub-category, sizes, colors, material, maker/location, handmade & made-in-Nepal flags, and stock type.
* **Order Fulfillment:** Dedicated portal to view customer orders and update delivery statuses.
* **User Management:** Ability to view the user base and revoke access for non-admin accounts.

## 🏗️ Architecture & Data Flow

The application follows a strict separation of concerns utilizing a **RESTful API** architecture:
* **Frontend (SPA):** Built with React and Tailwind CSS. Redux Toolkit manages global state (cart, user sessions). All API calls are routed through Axios.
* **Backend (API):** Node.js and Express handle business logic, routing, and token validation via custom middleware.
* **Database:** MongoDB stores documents (Users, Products, Orders) utilizing Mongoose as the Object Data Modeling (ODM) library.

## 🚀 How to Run Locally

1.  **Clone the repository** and set up environment variables (`.env` in both `backend` and `frontend`).

2.  **Install & start the backend:**
    ```bash
    cd backend
    npm install
    npm run server
    ```

3.  **Seed demo data (admin + demo user, full footwear catalog):**
    ```bash
    npm run data:import
    ```
    This creates two accounts:
    * **Admin:** `admin@juttax.com` / `Juttax@Admin123`
    * **Demo user:** `demo@juttax.com` / `Demo@1234`

    ⚠️ These are development-only credentials seeded in plain text in `backend/data/users.js` — change them before deploying anywhere public.

4.  **Install & start the frontend:**
    (In a new terminal)
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---
