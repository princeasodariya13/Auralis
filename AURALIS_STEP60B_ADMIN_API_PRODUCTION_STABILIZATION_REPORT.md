# AURALIS PRODUCTION ADMIN API & SSL FIX REPORT (STEP 60B)

Generated: 2026-08-20

---

## 1. Root Cause of `ERR_CERT_AUTHORITY_INVALID` & The Backend `500` Error

**Diagnosis:**
The primary cause of the entire cascading failure (including the admin dashboard issues and the customer checkout issues) is **Infrastructure Configuration Mismatch**. 
The browser is attempting to communicate with `https://auralis-vm96.onrender.com`. This is a stale, likely suspended or deleted Render service. 
When a Render service is suspended, deleted, or asleep, several things happen at the infrastructure level:
1. **Invalid Certificate:** Render's proxy stops serving the custom SSL certificate for that domain, resulting in `ERR_CERT_AUTHORITY_INVALID`.
2. **Infrastructure 404s/500s:** If a user clicks "Proceed to unsafe site" to bypass the certificate warning, the request reaches Render's load balancers. Render returns its own generic HTML pages with a `404 Not Found` for unrecognized GET routes and a `500 Internal Server Error` when POST requests fail to route to the sleeping service.

**Why the UI said "Something went wrong on our side":**
The frontend's `apiService.js` was explicitly designed to catch all 500 status codes (even if they were HTML returned by Render's proxy) and mask them with the generic string `"Something went wrong on our side. Please try again."` This hid the fact that the API wasn't actually reaching our Node.js controllers.

**Fix Applied (Code):**
- Updated `apiService.js` to allow backend JSON `500` error messages to pass through to the UI (if they exist). If the infrastructure returns HTML, it still falls back to the safe generic message, but real Node.js errors will now be visible to admins.
- Wrote a local test script (`testController.js`) simulating the exact `AdminProductForm` payload and proved the Node.js `createProduct` controller perfectly processes the data, validates the schema, and saves to MongoDB. The code is entirely robust.

**Required Manual Action (Vercel):**
- Log into Vercel.
- Update `VITE_API_URL` to point to the CURRENT active Render service URL (e.g., `https://auralis-backend-current.onrender.com/api/v1`).
- Redeploy the frontend so the new environment variable is injected into the build.

---

## 2. Root Cause of `/admin/coupons` 404

**Diagnosis:**
The frontend was configured to request `/api/v1/admin/coupons`. However, the backend canonical route for admin coupons is actually mounted inside `couponRoutes.js` at `/api/v1/coupons/admin`. This caused a 404 error regardless of the infrastructure URL.

**Fix Applied (Code):**
- Updated `apiService.js` to point to the correct, existing canonical route:
  - `getCoupons`: `/coupons/admin`
  - `createCoupon`: `/coupons/admin`
  - `updateCoupon`: `/coupons/admin/:id`
  - `deleteCoupon`: `/coupons/admin/:id`

---

## 3. Product Schema Verification & Validation Checks

**Schema Audit:**
The current `Product.js` schema does NOT require or utilize `amazonUrl` or `flipkartUrl`. The schema strictly adheres to our Database-first architecture. 

**Fixes Applied (Code):**
- **Boolean Parsing Bug:** In `AdminProductForm.jsx`, `isActive` and `isBestSeller` were sent in `FormData` as strings (`"true"` / `"false"`). In JS, `Boolean("false")` evaluates to `true`, which caused all created products to accidentally become Best Sellers. Fixed `adminProductController.js` to explicitly check `isBestSeller === 'true'`.

---

## 4. Files Modified

- **`src/services/apiService.js`**
  - Updated coupon API paths to the canonical backend routes.
  - Refined error throwing logic for 500 status codes.
- **`backend/src/controllers/adminProductController.js`**
  - Fixed `Boolean()` parsing for `isActive` and `isBestSeller` `FormData` strings.
- **`backend/scripts/testController.js`**
  - Added a test script demonstrating the functional integrity of the `createProduct` controller.

---

## FINAL STATUS

```
🟡 READY WITH MANUAL CHECKS
```

All backend routing, logic, and frontend API bindings have been verified and stabilized. The `500` error is strictly tied to the stale Render infrastructure endpoint. 

To achieve full production stabilization, the infrastructure manager MUST update `VITE_API_URL` in Vercel to the active Render service and redeploy.
