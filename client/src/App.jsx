import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import BrowseMaterials from './pages/BrowseMaterials';
import MaterialDetails from './pages/MaterialDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Protected pages
import SellMaterial from './pages/SellMaterial';
import EditMaterial from './pages/EditMaterial';
import Profile from './pages/Profile';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import RequestsPage from './pages/RequestsPage';
import FavoritesPage from './pages/FavoritesPage';
import BuyerOrders from './pages/BuyerOrders';
import SellerOrders from './pages/SellerOrders';
import TransactionsPage from './pages/TransactionsPage';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminMaterials from './pages/AdminMaterials';
import AdminCategories from './pages/AdminCategories';
import AdminImageMonitoring from './pages/AdminImageMonitoring';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="materials" element={<BrowseMaterials />} />
        <Route path="materials/:id" element={<MaterialDetails />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Authenticated Shared Routes */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="requests"
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />

        {/* Buyer Routes */}
        <Route
          path="buyer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'admin']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'admin']}>
              <BuyerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="favorites"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'admin']}>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />

        {/* Seller Routes */}
        <Route
          path="seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller/orders"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <SellerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="sell"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <SellMaterial />
            </ProtectedRoute>
          }
        />
        <Route
          path="materials/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['seller', 'admin']}>
              <EditMaterial />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/materials"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/categories"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/ai-monitoring"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminImageMonitoring />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
