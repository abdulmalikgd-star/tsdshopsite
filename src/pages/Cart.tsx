import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-8 bg-gray-100 rounded-full">
          <ShoppingBag className="h-16 w-16 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">سلة المشتريات فارغة</h2>
        <p className="text-gray-500 max-w-sm">يبدو أنك لم تضف أي منتجات إلى سلتك حتى الآن. ابدأ بالتسوق الآن!</p>
        <Link to="/products" className="bg-primary-600 text-white px-10 py-4 rounded-full font-bold hover:bg-primary-700 transition-all shadow-lg">
          استعرض المنتجات
        </Link>
      </div>
    );
  }

  const createWhatsAppMessage = () => {
    let text = "أريد إتمام هذا الطلب:\n\n";
    items.forEach(item => {
      text += `- ${item.name} (${item.quantity})\n`;
    });
    text += `\nالإجمالي: ${formatPrice(totalPrice)}`;
    return text;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">سلة المشتريات ({totalItems})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-2xl overflow-hidden">
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-primary-600 font-medium">{item.category}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-white rounded-md transition-all shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded-md transition-all shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice((item.discountPrice || item.price) * item.quantity)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-gray-900 rounded-3xl p-8 text-white space-y-6">
            <h3 className="text-xl font-bold border-b border-gray-800 pb-4">ملخص الطلب</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-gray-400">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>الشحن</span>
                <span className="text-green-500">مجاني</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                <span className="text-lg font-bold">الإجمالي</span>
                <span className="text-2xl font-bold text-primary-400">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/50 flex items-center justify-center p-4 ring-offset-2 ring-primary-600 focus:ring-2"
              >
                إتمام الطلب
                <ArrowLeft className="mr-3 h-5 w-5" />
              </button>
              
              <a 
                href={`https://wa.me/967733739900?text=${encodeURIComponent(createWhatsAppMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#2bd865] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#25c158] transition-all flex items-center justify-center p-4 shadow-xl shadow-[#2bd865]/30 focus:ring-2 ring-offset-2 ring-[#2bd865]"
              >
                إتمام الطلب عبر واتساب
                <WhatsAppIcon className="mr-3 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
