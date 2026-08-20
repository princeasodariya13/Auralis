# AURALIS CHECKOUT ORDER-PREVIEW FIX REPORT (STEP 60A)

Generated: 2026-08-20

---

## 1. Root Cause of `400 Bad Request` ("Product 1 is no longer available")

**Diagnosis:**
The `cartController` properly handles stale products on the frontend. When a user requests their cart (`GET /api/v1/cart`), the backend queries MongoDB for the products. If a product no longer exists (such as `id: 1` which was deactivated/deleted in a previous data migration), `populateCart` safely filters it out of the API response, making it invisible to the user in the UI.

However, the backend **does not automatically delete the stale item from the `Cart` document in MongoDB**.

When the user clicks "Proceed to Checkout", the frontend calls `POST /api/v1/orders/preview`. The `orderController` fetches the raw `Cart` document from MongoDB, which still contains the stale product `id: 1`. 

Prior to this fix, the `orderController` iterated through the cart items, and if it encountered an item missing from the `Product` collection, it intentionally threw a hard `400 Bad Request: Product 1 is no longer available`. 

**Why this caused a soft-lock:**
Because the stale item was invisible on the frontend (filtered by `cartController`), the user had no way to remove it from their cart to fix the checkout. 

**Fix Applied:**
- Modified `orderController.js` (`previewCheckout` and `createOrder`).
- The controller now gracefully `continue`s (skips) stale cart items that no longer exist in the `Product` collection, safely mirroring the frontend's filtered view.
- Added a validation check to block checkout with a user-friendly error if the *entire* cart becomes empty after filtering out stale items.
- Added a safer error message for valid products that are temporarily marked `isActive: false`, instructing the user to remove them.

---

## 2. Root Cause of `ERR_CERT_AUTHORITY_INVALID`

**Diagnosis:**
The browser reports `ERR_CERT_AUTHORITY_INVALID` when attempting to POST to:
`https://auralis-vm96.onrender.com/api/v1/orders/preview`

This error means the browser connected to a server, but the SSL/TLS certificate presented by the server was invalid for that hostname. In a PaaS environment like Render, this specifically happens when:
1. The Render service `auralis-vm96` has been suspended, deleted, or spun down, and the domain now points to a default parking page or an expired certificate.
2. The Vercel frontend was built using a stale `VITE_API_URL` environment variable pointing to an old deployment URL.

**Fix Required (Manual):**
This cannot be bypassed with code without disabling SSL (which violates security rules). The solution is entirely environmental:

1. **Verify Current Backend URL:** Log into Render and obtain the correct, active public URL for the Node.js backend API (e.g., `https://auralis-backend-xyz.onrender.com`).
2. **Update Vercel Environment Variables:** Log into Vercel, navigate to the Auralis project settings → Environment Variables, and update `VITE_API_URL` to match the active Render backend URL + `/api/v1`.
3. **Redeploy Vercel:** Trigger a new Vercel deployment so the frontend bundle is rebuilt with the correct active API URL.

---

## 3. Files Changed

- **`backend/src/controllers/orderController.js`**
  - Updated line 32-37 in `previewCheckout` to skip missing products.
  - Added line 61-63 in `previewCheckout` to check for empty valid cart.
  - Updated line 122-129 in `createOrder` to skip missing products.
  - Added line 154-156 in `createOrder` to check for empty valid cart.

---

## 4. Verification Checklists

### MongoDB & Cart
- ✅ Stale cart data (like `id: 1`) is safely ignored during checkout.
- ✅ Valid MongoDB products are correctly processed.
- ✅ Zero mock data arrays were introduced.

### Checkout Flow
- ✅ Graceful recovery from legacy seed data.
- ✅ Order preview succeeds without 400 errors for valid items.
- ✅ If a cart only contains stale items, it returns a safe "cart empty" message instead of a crash.

### Financial & Security
- ✅ Server-authoritative pricing intact.
- ✅ Razorpay order creation and webhook verification untouched.
- ✅ Inventory locking untouched.
- ✅ HTTPS requirement preserved (certificate error must be fixed via config, not by disabling SSL).

### Build Status
- ✅ Backend syntax check passes.
- ✅ Frontend build passes (`npm run build`).

---

## FINAL STATUS

```
🟡 READY WITH MANUAL CHECKS
```

The underlying application logic for the 400 error is completely fixed and production-safe. To resolve the `ERR_CERT_AUTHORITY_INVALID` error, the infrastructure manager must update the Vercel `VITE_API_URL` environment variable to point to the currently active Render backend URL and redeploy the frontend.
