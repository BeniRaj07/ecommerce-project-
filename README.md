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
* **Secure Checkout:** Multi-step checkout flow handling shipping details and payment via Stripe (card/UPI), **eSewa** (Nepal's digital wallet, sandbox mode), or Cash on Delivery.
* **User Dashboard:** Logged-in users can manage their profiles, leave product reviews, and track order history.

### For Administrators (Admin Dashboard)
* **Inventory Management:** Full CRUD for products, including category/sub-category, sizes, colors, material, maker/location, handmade & made-in-Nepal flags, and stock type.
* **Order Fulfillment:** Dedicated portal to view customer orders and update delivery statuses.
* **User Management:** Ability to view the user base and revoke access for non-admin accounts.

## 🎨 Design System

The UI follows a modern **SaaS-product** visual language — card-based layouts, soft shadows, generous whitespace, a single accent color used sparingly, and clean sans-serif typography. The admin panel and customer storefront share the same tokens but use distinct layouts suited to each audience (a persistent sidebar for admin work vs. a marketing-style storefront for shopping).

### Tokens (`frontend/tailwind.config.js`)

| Token | Values | Used for |
|---|---|---|
| `brand-50` → `brand-900` | Indigo/violet scale (`#f4f5ff` → `#332481`) | Primary actions, links, active states, selected filters |
| `slate-*` (Tailwind default) | `slate-50` → `slate-900` | Page background, card text, borders, admin sidebar |
| `emerald-*` / `amber-*` / `red-*` (Tailwind default) | — | Semantic status: success/"Made in Nepal" (emerald), "Handmade" (amber), errors/unpaid (red) |
| `shadow-soft` | Subtle 2-layer shadow | Default card elevation |
| `shadow-card` / `shadow-card-hover` | Heavier shadow, larger on hover | Emphasized cards, hover-lift interactions |
| `rounded-2xl` | 1rem radius | Standard card/button radius across the app |
| `font-sans` | **Inter** (Google Fonts, loaded in `index.html`) | All UI text |

To retheme the app, edit the `brand` color scale in `tailwind.config.js` — every component references it by name (`bg-brand-600`, `text-brand-600`, etc.) rather than hardcoded hex values, so a single change propagates everywhere.

### Layout patterns

* **Customer storefront** (`App.jsx` + `Header`, `TopBar`, `CategoryNav`, `Footer`): sticky translucent header, a mega-menu under "All Categories", a card-based product grid (`Product.jsx`), and a sticky `FilterSidebar` on listing pages.
* **Admin panel** (`AdminLayout.jsx`): a dedicated dark sidebar (Dashboard / Products / Orders / Users, active-state highlighted) replaces the storefront chrome entirely — `App.jsx` detects `isAdmin && path.startsWith('/admin')` and swaps out `TopBar`/`CategoryNav`/`Footer` and the padded marketing container for `AdminLayout`'s own full-height shell. Admin pages use white `rounded-2xl shadow-soft` cards, pill badges for status (paid/delivered/role), and avatar-initial circles for people.
* **Admin dashboard charts** (`AdminDashboardPage.jsx`, via `recharts`): best-selling products and monthly sales are each shown as a magnitude chart (bar/line, single brand hue) *and* a share-of-total pie chart (fixed-order categorical palette, capped at 5–6 slices + "Other") — following the standard chart-design rule that ranking/trend data reads best in one hue, while identity/part-to-whole data reads best in distinct categorical colors.

### Component conventions

* Cards: `bg-white rounded-2xl shadow-soft p-5` (or `p-6` for forms)
* Primary button: `bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg`
* Secondary button: `bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg`
* Status/tag pill: `text-xs font-semibold px-2.5 py-1 rounded-full` with a semantic background (e.g. `bg-emerald-50 text-emerald-700`)
* Inputs: `border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500`

There's no separate CSS/SCSS layer beyond `index.css` (Tailwind directives + base font/background) — every component is styled directly with Tailwind utility classes, so the tokens above are the full extent of the "theme."

## 💳 eSewa Sandbox Payments

eSewa checkout uses eSewa's official **ePay v2** test/sandbox environment — no real money moves and no merchant account is required to try it.

**How it works:**
1. Choosing "Pay with eSewa" at checkout creates the order, then `POST /api/orders/:id/esewa/initiate` signs the order total (HMAC-SHA256) and returns a form the browser auto-submits to eSewa's sandbox (`rc-epay.esewa.com.np`).
2. After completing (or cancelling) payment on eSewa, the user is redirected back to `/order/:id?esewa=success` or `?esewa=failure`.
3. On success, `POST /api/orders/:id/esewa/verify` calls eSewa's server-side status-check API and marks the order paid only once eSewa confirms `COMPLETE`.

**Config** (`backend/config/esewa.js`, overridable via env vars — defaults are eSewa's own published sandbox values, equivalent to Stripe's `4242...` test card):

| Env var | Default |
|---|---|
| `ESEWA_PRODUCT_CODE` | `EPAYTEST` |
| `ESEWA_SECRET_KEY` | `8gBm/:&EnhH.1/q` |
| `ESEWA_PAYMENT_URL` | `https://rc-epay.esewa.com.np/api/epay/main/v2/form` |
| `ESEWA_STATUS_URL` | `https://rc.esewa.com.np/api/epay/transaction/status/` |
| `FRONTEND_URL` | `http://localhost:5173` (used to build the success/failure redirect URLs) |

**Test login for the eSewa sandbox UI itself** (eSewa's published test accounts, needed to simulate completing a payment):
* eSewa ID: `9806800001` through `9806800005`
* Password: `Nepal@123`
* OTP/Token: `123456`

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
