import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Notifications from './pages/Notifications';
import Returns from './pages/Returns';
import ReturnRequestForm from './pages/ReturnRequestForm';
import SupportTickets from './pages/SupportTickets';
import SupportTicketDetail from './pages/SupportTicketDetail';
import Loyalty from './pages/Loyalty';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Components (Lazy Loaded)
const AdminLayout = lazy(() => import('./components/AdminLayout'));
import AdminRoute from './components/AdminRoute';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('./pages/admin/AdminOrderDetails'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns'));
const AdminReturnDetails = lazy(() => import('./pages/admin/AdminReturnDetails'));
const AdminReconciliation = lazy(() => import('./pages/admin/AdminReconciliation'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminSupportDetails = lazy(() => import('./pages/admin/AdminSupportDetails'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminFulfillmentOperations = lazy(() => import('./pages/admin/AdminFulfillmentOperations'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetails = lazy(() => import('./pages/admin/AdminCustomerDetails'));

import './App.css';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Storefront Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route 
                  path="wishlist" 
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account" 
                  element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account/notifications" 
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account/returns" 
                  element={
                    <ProtectedRoute>
                      <Returns />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account/returns/:orderNumber/request" 
                  element={
                    <ProtectedRoute>
                      <ReturnRequestForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="orders" 
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account/support" 
                  element={
                    <ProtectedRoute>
                      <SupportTickets />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account/support/:ticketNumber" 
                  element={
                    <ProtectedRoute>
                      <SupportTicketDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="account/loyalty" 
                  element={
                    <ProtectedRoute>
                      <Loyalty />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="orders/:orderNumber" 
                  element={
                    <ProtectedRoute>
                      <OrderDetails />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <Suspense fallback={<div className="flex justify-center items-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                    <AdminLayout />
                  </Suspense>
                </AdminRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="customers/:id" element={<AdminCustomerDetails />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:orderNumber" element={<AdminOrderDetails />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="returns" element={<AdminReturns />} />
                <Route path="returns/:id" element={<AdminReturnDetails />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="support/:ticketNumber" element={<AdminSupportDetails />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="reconciliation" element={<AdminReconciliation />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="fulfillment" element={<AdminFulfillmentOperations />} />
              </Route>
              
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
