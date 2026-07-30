import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';

export default function CartNotificationModal() {
  const { cartModalOpen, setCartModalOpen, recentProduct } = useCart();
  const navigate = useNavigate();

  if (!recentProduct) return null;

  const handleGoToCart = () => {
    setCartModalOpen(false);
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    setCartModalOpen(false);
  };

  return (
    <AnimatePresence>
      {cartModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button
              onClick={handleContinueShopping}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-6 mt-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تم إضافة المنتج للسلة بنجاح</h3>
              <p className="text-gray-500 text-sm">
                تم إضافة <span className="font-bold text-gray-700">{recentProduct.name}</span> إلى سلة المشتريات.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoToCart}
                className="w-full bg-primary-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-primary-700 transition-colors"
              >
                الانتقال إلى السلة وإتمام الطلب
              </button>
              <button
                onClick={handleContinueShopping}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                مواصلة التصفح
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
