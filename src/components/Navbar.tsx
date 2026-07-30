import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Rocket, Heart, Search, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { cn } from '../lib/utils';
import { CATEGORIES } from '../types';
import { collection, onSnapshot, query, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { useSettings } from '../context/SettingsContext';

export default function Navbar() {
  const { user, profile, isAdmin, isStaff, signOut } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCats = snapshot.docs.map(doc => doc.data().name);
      if (fetchedCats.length > 0) {
        setDbCategories(fetchedCats);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-primary-600 text-white border-b border-primary-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Right Side (Mobile) & Nav links (Desktop) */}
            <div className="flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="text-white md:hidden hover:bg-white/10 p-2 rounded-lg transition-colors">
                <Menu className="h-7 w-7" />
              </button>
              <div className="hidden md:flex items-center space-x-6 space-x-reverse mr-4">
                <Link to="/" className="text-white/90 hover:text-white font-medium transition-colors">الرئيسية</Link>
                <div className="relative group/nav">
                  <span className="text-white/90 hover:text-white font-medium transition-colors cursor-pointer py-2">التصنيفات</span>
                  <div className="absolute top-full right-0 w-48 pt-4 hidden group-hover/nav:block opacity-0 group-hover/nav:opacity-100 transition-opacity z-[50]">
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 py-2">
                       {(dbCategories.length > 0 ? dbCategories : CATEGORIES).map((cat, idx) => (
                          <Link key={idx} to={`/products?category=${encodeURIComponent(cat)}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors">
                            {cat}
                          </Link>
                       ))}
                    </div>
                  </div>
                </div>
                <Link to="/products" className="text-white/90 hover:text-white font-medium transition-colors">كل المنتجات</Link>
                {(isAdmin || isStaff) && (
                  <Link to="/admin" className="text-white/90 hover:text-white font-medium transition-colors">لوحة التحكم</Link>
                )}
              </div>
            </div>

            {/* Center Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
              <Link to="/" className="flex items-center space-x-2 space-x-reverse">
                {settings?.storeLogo ? (
                   <img 
                    src={settings.storeLogo} 
                    alt={settings?.storeName || "Store"} 
                    className="object-contain"
                    style={{ width: settings?.logoSize ? `${settings.logoSize}px` : '150px' }}
                  />
                ) : (
                  <>
                    <div className="h-8 w-8 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/logo.png" 
                        alt={settings?.storeName || "توفيق تك"} 
                        className="h-full w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight hidden sm:block whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                      {settings?.storeName || "توفيق تك"}
                    </span>
                  </>
                )}
              </Link>
            </div>

            {/* Left Side (Mobile) & Actions (Desktop) */}
            <div className="flex items-center">
              <div className="flex md:hidden items-center gap-1">
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Search className="h-6 w-6" />
                </button>
                <Link to="/cart" className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-500 transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>

              <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                <div className="relative">
                  {isSearchOpen ? (
                    <form onSubmit={handleSearchSubmit} className="flex items-center absolute left-0 top-1/2 -translate-y-1/2 w-64">
                      <input 
                        type="text" 
                        placeholder="ابحث عن منتج..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white text-gray-900 rounded-full px-4 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                        autoFocus
                        onBlur={() => !searchQuery.trim() && setIsSearchOpen(false)}
                      />
                      <Search className="h-4 w-4 text-gray-400 absolute right-3" />
                    </form>
                  ) : (
                    <button onClick={() => setIsSearchOpen(true)} className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                      <Search className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {user && (
                  <Link to="/favorites" className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Heart className="h-5 w-5" />
                    {favorites.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-600 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                )}
                
                <Link to="/cart" className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-600 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Link>

                {user ? (
                  <div className="flex items-center space-x-2 space-x-reverse border-r border-[#846ed8] pr-4 mr-2">
                    <Link to="/profile" className="flex items-center space-x-2 space-x-reverse text-white/90 hover:text-white border border-transparent hover:border-white/20 px-3 py-1.5 rounded-full transition-all">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">{profile?.displayName || 'حسابي'}</span>
                    </Link>
                    <button onClick={handleSignOut} className="p-2 text-white/90 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors" title="تسجيل الخروج">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="bg-white text-primary-600 px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-all shadow-sm mr-2">
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </div>
          </div>
          {isSearchOpen && (
            <div className="bg-primary-700 px-4 py-3 md:hidden">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن منتجات..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-gray-900 rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none"
                  autoFocus
                />
                <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="bg-primary-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              {user ? (
                <>
                  <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-bold text-lg">{profile?.displayName || 'مرحباً، المستخدم'}</span>
                  <span className="text-white/70 text-sm">{profile?.email}</span>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-bold text-lg mb-2">أهلاً بك في توفيق تك</span>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="inline-block bg-white text-primary-600 px-6 py-2 rounded-full text-sm font-bold text-center">
                    تسجيل الدخول
                  </Link>
                </>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-safe p-4">
          <div className="mb-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-2">التصفح</h3>
            <div className="space-y-1">
              <Link to="/" className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-gray-800 font-medium transition-colors" onClick={() => setIsOpen(false)}>
                <span>الرئيسية</span>
              </Link>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-4" />

          <div className="mb-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-2">التصنيفات</h3>
            <div className="space-y-1">
              {(dbCategories.length > 0 ? dbCategories : CATEGORIES).map((cat, idx) => (
                <Link key={idx} to={`/products?category=${encodeURIComponent(cat)}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors" onClick={() => setIsOpen(false)}>
                  <span>{cat}</span>
                  <ChevronLeft className="h-4 w-4 text-gray-300" />
                </Link>
              ))}
              <div className="w-full h-px bg-gray-100 my-2" />
              <Link to="/products" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-gray-800 font-medium transition-colors" onClick={() => setIsOpen(false)}>
                <span>كل المنتجات</span>
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-4" />

          <div className="mb-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-2">حسابي</h3>
            <div className="space-y-1">
              {(isAdmin || isStaff) && (
                <Link to="/admin" className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-gray-800 transition-colors" onClick={() => setIsOpen(false)}>
                  <span className="font-medium">لوحة التحكم</span>
                </Link>
              )}
              {user && (
                <>
                  <Link to="/profile" className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-gray-800 transition-colors" onClick={() => setIsOpen(false)}>
                    <span>تعديل الحساب</span>
                  </Link>
                  <Link to="/favorites" className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-gray-800 transition-colors" onClick={() => setIsOpen(false)}>
                    <span>قائمة المفضلة</span>
                    {favorites.length > 0 && <span className="mr-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{favorites.length}</span>}
                  </Link>
                </>
              )}
              <Link to="/cart" className="flex items-center p-3 rounded-xl hover:bg-gray-50 text-gray-800 transition-colors" onClick={() => setIsOpen(false)}>
                <span>سلة المشتريات</span>
                {totalItems > 0 && <span className="mr-2 bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full font-bold">{totalItems}</span>}
              </Link>
            </div>
          </div>

          {user && (
            <>
              <div className="w-full h-px bg-gray-100 my-4" />
              <button 
                onClick={handleSignOut} 
                className="w-full flex items-center p-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors"
              >
                <LogOut className="h-5 w-5 ml-3" />
                <span>تسجيل الخروج</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
