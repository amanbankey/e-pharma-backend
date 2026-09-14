# Vernal Rx — Backend

Express + MongoDB API for the Vernal Rx storefront. Built from the CardPe/CardShare backend — auth, profile, payment and mail logic kept as-is; card, deal, chat, notification, bank, friend-request and rating/review modules removed and replaced with product catalogue + order/delivery tracking.

## Setup

```bash
npm install
cp .env.example .env   # fill in Mongo, JWT, Razorpay, Cloudinary, Brevo values
npm run dev
```

## Routes

```
POST   /api/signup
POST   /api/login
POST   /api/send-otp
POST   /api/reset-password-token
POST   /api/reset-password
POST   /api/changepassword          (auth)
GET    /api/me                      (auth)
PUT    /api/me                      (auth)
DELETE /api/me                      (auth)
GET    /api/user/:id                (auth)

GET    /api/products
GET    /api/products/:id
POST   /api/products                (auth, admin)
PUT    /api/products/:id            (auth, admin)
DELETE /api/products/:id            (auth, admin)

POST   /api/payments/create-order   (auth)  - creates a Razorpay order for the cart total
POST   /api/payments/verify-payment (auth)  - verifies signature, marks order paid
POST   /api/payments/webhook                - Razorpay webhook
GET    /api/payments/my-orders      (auth)  - purchase history + delivery status
PUT    /api/payments/:id/status     (auth, admin) - update delivery status
```

## What changed from the original CardPe backend

- Removed: `Card`, `Deal`, `Bank`, `Notification`, `FriendRequest`, `Review`,
  and Socket.io/chat wiring.
- `User` model dropped the `holder/buyer/both` role in favour of a plain
  `user/admin` role.
- `Profile` controller dropped card/bank/deal/friend logic, kept image
  upload + basic detail updates.
- `Payment` controller was re-built around a `Product`/`Order` model instead
  of the deal-commission flow: `createOrder` charges the full cart total
  (not just a commission), and `verifyPayment` marks the order `paid` and
  sets `deliveryStatus`/`expectedDeliveryDate`.
- Login/signup/OTP/password-reset/email logic is unchanged from your
  original code.

## Notes

- `isAdmin` middleware gates product creation and delivery-status updates —
  set `role: "admin"` on a user document to use the admin endpoints.
- The webhook route needs raw body parsing, already wired in `index.js`
  ahead of `express.json()`.
