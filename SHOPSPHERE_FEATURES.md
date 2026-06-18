# ShopSphere Features

## Completed features
- User authentication: register, login, JWT token generation, token-based protected routes
- User profile: view and update profile (including basic address fields)
- Product catalog: backend product model, listing endpoint, product details endpoint
- Product listing UI: client-side product list, search box, category filters, sorting, pagination
- Product details UI: images gallery, description, price, stock display, add-to-cart
- Cart: client-side cart stored in localStorage (guest + per-user keys), add/remove/update items
- Checkout: shipping form, payment method selection (placeholder), order creation via API
- Orders: create order (backend), reduce product stock, frontend order success and order history pages
 - Address Management: server APIs and client address book UI with full CRUD, default address selection, and Checkout integration (migration from legacy `address` to `addresses` supported)
 - Order Details UI: detailed order view showing summary, items, shipping info (including phone), pricing breakdown, and an order timeline; route `/orders/:id` implemented and wired to protected order API
- Reviews (backend): product review model and POST /api/products/:id/reviews (protected)
- Admin APIs (backend): product create/update/delete, user list/delete, order listing and status updates
- Seeder: `server/seeder.js` to populate initial products and admin user

## Partially completed features
- Product reviews: backend supports reviews and rating aggregation; frontend shows static example reviews but no UI to submit reviews yet
- Admin functionality: backend endpoints exist but there is no dedicated admin UI in the client to manage products, users, or orders
- Payments: frontend allows selecting `card` but there is no payment gateway integration (card flow is placeholder; orders are marked paid via `/api/orders/:id/pay` endpoint only)
- Image handling: product `images` array is supported and `uploads/` is served statically, but there is no upload UI or API endpoint exposed in the client to upload product images
- Search/filter integration: backend supports keyword/category/price/rating filtering, but client currently performs local filtering on the returned product list rather than using server query params for precise server-side filtering/pagination

## Missing features / suggested improvements
- Payment gateway (Stripe/PayPal) integration and secure card handling
- Admin dashboard UI (product CRUD, order workflow, user management)
- Review submission UI and moderation controls
- Image upload UI + secured upload endpoints (multipart/form-data handling)
- Cart-server sync (merge guest cart on login) and persistent server-side carts
- Email notifications (order confirmation, shipping updates)

## Recent additions
- Address Management: Completed (server + client + migration script). Users can add/edit/delete addresses, set a default, and select address during checkout.
- Order Details page: Completed. Includes timeline and buy-again action.
- Inventory alerts and low-stock notifications
- Robust error handling and UX around network failures
- Tests (unit/integration) and CI pipeline
- Production-ready deployment configs (Docker, cloud infra, environment docs)

If you want, I can open detailed tickets for any of the above or scaffold an admin UI and Stripe integration next.
