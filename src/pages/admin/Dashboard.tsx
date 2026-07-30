import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  PlusCircle,
  FolderTree,
  ShieldCheck,
  BarChart3,
  Tags,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import Overview from './Overview';
import ProductsManage from './ProductsManage';
import OrdersManage from './OrdersManage';
import UsersManage from './UsersManage';
import CategoriesManage from './CategoriesManage';
import OffersManage from './OffersManage';
import ThemeManage from './ThemeManage';
import StaffManage from './StaffManage';
import ReportsManage from './ReportsManage';
import SettingsManage from './SettingsManage';
import ReviewsManage from './ReviewsManage';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isStaff, isAdmin } = useAuth();

  useEffect(() => {
    if (isStaff && location.pathname === '/admin') {
      navigate('/admin/products');
    }
  }, [isStaff, location.pathname, navigate]);

  let sidebarItems = [
    { name: 'نظرة عامة', path: '/admin', icon: LayoutDashboard },
    { name: 'إدارة المنتجات', path: '/admin/products', icon: Package },
    { name: 'إدارة الأقسام', path: '/admin/categories', icon: FolderTree },
    { name: 'إدارة الطلبات', path: '/admin/orders', icon: ShoppingCart },
    { name: 'العملاء', path: '/admin/users', icon: Users },
    { name: 'العروض والتسويق', path: '/admin/offers', icon: Tags },
    { name: 'المحتوى والتصميم', path: '/admin/theme', icon: ImageIcon },
    { name: 'آراء العملاء', path: '/admin/reviews', icon: MessageSquare },
    { name: 'الموظفين والصلاحيات', path: '/admin/staff', icon: ShieldCheck },
    { name: 'التقارير والإحصائيات', path: '/admin/reports', icon: BarChart3 },
    { name: 'إعدادات النظام', path: '/admin/settings', icon: Settings },
  ];

  if (isStaff && !isAdmin) {
    sidebarItems = [
      { name: 'إدارة المنتجات', path: '/admin/products', icon: Package },
    ];
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-l border-gray-100 p-6 space-y-8">
        <div className="hidden md:block">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">لوحة التحكم</h2>
        </div>
        <nav className="flex md:flex-col space-x-2 space-x-reverse md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide border-b border-gray-100 md:border-0">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-2xl font-medium transition-all",
                  isActive 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 hide-scrollbar overflow-hidden">
        <Routes>
          {isStaff && !isAdmin ? (
            <>
              <Route path="products" element={<ProductsManage />} />
              <Route path="*" element={<ProductsManage />} />
            </>
          ) : (
            <>
              <Route index element={<Overview />} />
              <Route path="products" element={<ProductsManage />} />
              <Route path="categories" element={<CategoriesManage />} />
              <Route path="orders" element={<OrdersManage />} />
              <Route path="users" element={<UsersManage />} />
              <Route path="offers" element={<OffersManage />} />
              <Route path="theme" element={<ThemeManage />} />
              <Route path="reviews" element={<ReviewsManage />} />
              <Route path="staff" element={<StaffManage />} />
              <Route path="reports" element={<ReportsManage />} />
              <Route path="settings" element={<SettingsManage />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}
