# ShopSphere Context

## Tech stack
- Frontend: React (18) + Vite, Tailwind CSS, React Router
- HTTP client: axios
- Backend: Node.js + Express, ES modules
- Database: MongoDB (Mongoose) — intended for MongoDB Atlas
- Auth: JWT (jsonwebtoken), password hashing with bcryptjs
- Dev tooling: Vite, PostCSS, Tailwind, nodemon (not committed)

## Folder structure (high level)
- client/ — React app (Vite)
	- src/ — app source (components, pages, contexts, hooks, services)
	- public/
	- package.json, vite.config.js, tailwind.config.js
- server/ — Express API
	- config/ (db.js)
	- controllers/ (auth, product, order)
	- models/ (User, Product, Order)
	- routes/ (authRoutes, productRoutes, orderRoutes)
	- middleware/ (authMiddleware, errorHandler)
	- seeder.js, server.js
- uploads/ — served static files directory (server/uploads)
- utils/ — shared helpers (generateToken)

## Database schemas (summary)
- User
	- name, email (unique), password (hashed), role (customer|admin)
	- phone, address (street, city, state, zipCode, country)
	- timestamps
- Product
	- user (creator/admin), name, description, price, category, brand
	- images (array of strings), stock (number), rating, numReviews, reviews
	- reviews: user, name, rating (1-5), comment, timestamps
	- full-text index on name/description/category
- Order
	- user, orderItems (product ref, name, image, price, quantity)
	- shippingAddress (street, city, state, zipCode, country)
	- paymentMethod (card|paypal|cod), itemsPrice, taxPrice, shippingPrice, totalPrice
	- status (pending|processing|shipped|delivered|cancelled), isPaid/isDelivered, timestamps

## Authentication flow
- Endpoints: POST /api/auth/register, POST /api/auth/login
- Successful auth responses include a JWT produced by `generateToken(user._id)` (expires: env JWT_EXPIRE or 30d)
- Backend: `protect` middleware reads `Authorization: Bearer <token>`, verifies JWT, and attaches `req.user` (without password)
- Admin routes use `admin` middleware after `protect` to check `req.user.role === 'admin'`
- Frontend: token saved to localStorage under key `shopsphere_token` via `authService` helpers
- Client-side session: `AuthContext` restores session by calling `/api/auth/profile` with token; logout clears localStorage

## API endpoints (overview)
- GET /api — API root (shows available route groups)
- Auth — /api/auth
	- POST /register — create user
	- POST /login — authenticate
	- GET /profile — get current user (protected)
	- PUT /profile — update current user (protected)
	- GET /users — list users (admin)
	- DELETE /users/:id — delete user (admin)
- Products — /api/products
	- GET / — list products (supports query: page, limit, keyword, category, brand, minPrice, maxPrice, rating, sort)
	- GET /top — top-rated products
	- GET /:id — get single product
	- POST / — create product (admin)
	- PUT /:id — update product (admin)
	- DELETE /:id — delete product (admin)
	- POST /:id/reviews — add review (protected)
- Orders — /api/orders
	- POST / — create order (protected)
	- GET /myorders — get logged-in user's orders (protected)
	- GET /:id — get order by id (protected; admin can view any)
	- PUT /:id/pay — mark paid (protected)
	- GET / — list all orders (admin)
	- PUT /:id/status — update order status (admin)

## Important implementation notes / environment
- Server expects environment variables: `MONGO_URI`, `JWT_SECRET`, optional `JWT_EXPIRE`, `CLIENT_URL`, `PORT`.
- `server/config/db.js` contains a manual SRV-resolve fallback for `mongodb+srv://` URIs (Node v24 workaround).
- Frontend `client/src/services/api.js` currently points to `http://localhost:5001/api` while server default port is `5000` — this is a likely config mismatch to fix before running locally.

## Current project status (summary)
- Backend: Express API with authentication, product, and order logic implemented and validated (Mongoose models + controllers present).
- Frontend: React SPA with product listing, product details, cart (localStorage), checkout flow, login/register, profile, protected routes, and order history pages.
- Seed data: `server/seeder.js` can populate products and a test admin user.
- Missing / incomplete areas: admin UI (no dedicated admin pages in client), payment gateway integration (card flow is placeholder), client-side product review submission (server supports reviews), image upload UI and APIs, some config mismatches (client API baseURL vs server port).

## Recently completed features
- Address Management: full CRUD server APIs and client UI for managing multiple addresses. Includes migration from legacy single `address` to new `addresses` array, support for default address selection, and integration with the Checkout flow to prefill shipping details.
- Order Details page: Amazon-style order details implemented on the client with order summary, product list, shipping information (full name + phone), pricing breakdown, timeline visualization, and action buttons (Back to Orders, Buy Again). Uses existing `GET /api/orders/:id` endpoint.

## Notes
- The Address Management feature preserves legacy `address` while supporting the new `addresses` array to allow idempotent migrations and safe roll-forward deployments.
- The Order Details UI is implemented at route `/orders/:id` and reuses the protected order retrieval endpoint; timeline and status rendering are client-side components fed by the order `status` field.

If you'd like, I can now update the project README or correct the `client/src/services/api.js` baseURL to match the server port and create a small run/dev guide.
