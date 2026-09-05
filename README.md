# MwanaSpoty API

The backend REST API for [MwanaSpoty](https://mwanaspoty.vercel.app/), a full-stack e-commerce platform for football jerseys.

**Live API:** https://mwanaspoty-server.onrender.com

## Overview

Handles authentication, product catalog, orders, image uploads, and admin analytics for the MwanaSpoty storefront.

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** PostgreSQL (hosted on Neon), via Prisma ORM
- **Auth:** JWT + bcrypt password hashing
- **Image storage:** Cloudinary (multi-image upload via Multer)
- **Deployment:** Render

## API Overview

**Public**

- `GET /api/jerseys` — list jerseys (supports `?league=`, `?search=`, `?classic=true`)
- `GET /api/jerseys/:id` — single jersey
- `GET /api/leagues` — distinct league list
- `GET /api/best-sellers` — top-selling jerseys
- `POST /api/register`, `POST /api/login`

**Authenticated (customer)**

- `POST /api/orders` — create an order from cart items
- `GET /api/orders`, `GET /api/orders/:id` — a customer's own order history

**Admin only**

- `POST/PUT/DELETE /api/jerseys/:id` — product management
- `POST /api/upload` — multi-image upload to Cloudinary
- `GET /api/admin/orders` — order list (excludes customer-requested print details)
- `GET /api/admin/orders/:id` — full order detail, including fulfillment/print info
- `PATCH /api/admin/orders/:id` — update order status
- `GET /api/admin/customers` — customer list with order counts
- `GET /api/admin/analytics/*` — best-sellers, best-leagues, segments, low-stock, sales-trend

All admin routes are protected by JWT auth + a role check.

## Getting Started (local development)

```bash
git clone https://github.com/blexolonde/mwanaspoty-server.git
cd mwanaspoty-server
npm install
```

Create a `.env` file with:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run migrations and start the server:

```bash
npx prisma migrate dev
npm start
```

API runs on `http://localhost:5000`.

## Related

- Frontend repo: [mwanaspoty](https://github.com/blexolonde/mwanaspoty)
