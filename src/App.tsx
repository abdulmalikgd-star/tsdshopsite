/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import React, { ReactNode, useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Categories from './pages/Categories';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import CartNotificationModal from './components/CartNotificationModal';
import ScrollToTop from './components/ScrollToTop';

function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode, adminOnly?: boolean }) {
  const { user, profile, loading, isAdmin, isStaff } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && (!isAdmin && !isStaff)) return <Navigate to="/" />;

  return <>{children}</>;
}

import { SettingsProvider, useSettings } from './context/SettingsContext';

function MainApp() {
  const [currencyTick, setCurrencyTick] = React.useState(0);
  const { settings, loading: settingsLoading } = useSettings();

  React.useEffect(() => {
    if (settings) {
      if (settings.seoTitle || settings.storeName) {
        document.title = settings.seoTitle || settings.storeName || 'متجر توفيق تك';
      }
      if (settings.seoDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
           metaDesc = document.createElement('meta');
           metaDesc.setAttribute('name', 'description');
           document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', settings.seoDescription);
      }
      if (settings.favicon) {
        let linkIcon = document.querySelector('link[rel="icon"]');
        if (!linkIcon) {
           linkIcon = document.createElement('link');
           linkIcon.setAttribute('rel', 'icon');
           document.head.appendChild(linkIcon);
        }
        linkIcon.setAttribute('href', settings.favicon);
      }
      if (settings.ogImage) {
        let ogImg = document.querySelector('meta[property="og:image"]');
        if (!ogImg) {
           ogImg = document.createElement('meta');
           ogImg.setAttribute('property', 'og:image');
           document.head.appendChild(ogImg);
        }
        ogImg.setAttribute('content', settings.ogImage);
      }
    }
  }, [settings]);

  React.useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick(prev => prev + 1);
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col" key={currencyTick}>
            <Navbar />
            <CartNotificationModal />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/favorites" element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/checkout" 
                  element={<Checkout />} 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
            <BottomNav />
          </div>
        </Router>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}
