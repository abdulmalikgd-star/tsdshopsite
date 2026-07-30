import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { WhatsAppIcon } from './WhatsAppIcon';

export default function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();
  
  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'الأقسام', path: '/categories', icon: LayoutGrid },
    { name: 'واتساب', path: 'https://wa.me/967733739900', icon: WhatsAppIcon, isExternal: true },
    { name: 'السلة', path: '/cart', icon: ShoppingCart, badge: totalItems },
    { name: 'حسابي', path: user ? '/profile' : '/login', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 px-2 py-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = !item.isExternal && (location.pathname === item.path || (item.path === '/categories' && (location.pathname === '/products' || location.pathname.startsWith('/product/'))));
          const Icon = item.icon;
          
          if (item.isExternal) {
            return (
              <a 
                key={item.name}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex flex-col items-center p-2 rounded-xl transition-all text-[#25D366] hover:text-[#128C7E]"
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </a>
            );
          }

          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                isActive ? 'text-primary-600 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              
              {/* Optional solid fill overlay approach if you want filled active state */}
              {isActive && <Icon className="h-6 w-6 absolute top-2" />}

              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/4 bg-red-500 rounded-full border-2 border-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
