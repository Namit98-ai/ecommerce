# 🛒 ShopZone E-commerce v2 — MongoDB + Vercel Ready

Full-featured e-commerce with storefront, cart, checkout, order tracking and admin dashboard.

![Status](https://img.shields.io/badge/status-working-brightgreen) ![Vercel](https://img.shields.io/badge/deploy-Vercel-black) ![MongoDB](https://img.shields.io/badge/database-MongoDB-green)

## ✨ Features
- Product browsing, search, category filter, sort
- Shopping cart (localStorage), checkout, order history
- JWT auth (register/login)
- Admin: products, orders, users, revenue stats
- Persistent MongoDB storage · Vercel ready

## 🚀 Run Locally
```bash
git clone https://github.com/Namit98-ai/ecommerce.git
cd ecommerce && npm install
cp .env.example .env
npm start
# Store: http://localhost:5000
# Admin: http://localhost:5000/admin  (admin@shop.com / admin123)
```

## ☁️ Deploy to Vercel
1. Push to GitHub → Import on vercel.com
2. Add env vars: `MONGODB_URI`, `JWT_SECRET`
3. Deploy ✅

## ⚙️ Environment Variables
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |

## 🔑 Default Admin
Email: `admin@shop.com` · Password: `admin123`

## 🛠️ Stack
Node.js · Express · MongoDB · Mongoose · JWT · bcryptjs · Vercel
