import React from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ProductCardProps {
  product: Product;
  idx?: number;
  key?: React.Key;
}

export default function ProductCard({ product, idx = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isFavorite = favorites.includes(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(product.id);
  };

  return (
    <motion.div 
      key={product.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-[#f8f9fa] rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full border border-gray-300"
    >
      <div className="relative w-full pt-[100%] bg-transparent">
        <Link to={`/product/${product.id}`} className="absolute inset-0 flex items-center justify-center p-6">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
          />
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col pt-2 px-4 pb-4">
        <div className="flex flex-col items-center mb-4 mt-auto">
          {product.discountPrice ? (
            <>
              <div className="text-gray-900 font-medium text-2xl flex items-baseline gap-1">
                {formatPrice(product.discountPrice)}
              </div>
              <div className="text-gray-500 text-sm line-through mt-0.5">
                {formatPrice(product.price)}
              </div>
            </>
          ) : (
            <div className="text-gray-900 font-medium text-2xl flex items-baseline gap-1 mt-5">
              {formatPrice(product.price)}
            </div>
          )}
          
          <Link to={`/product/${product.id}`} className="block w-full mt-3">
            <h3 className="font-medium text-gray-800 text-[16px] text-center hover:text-primary-600 transition-colors line-clamp-2 leading-relaxed">
              {product.name}
            </h3>
          </Link>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-200/60 pt-3 px-2">
          <a 
            href={`https://wa.me/967733739900?text=${encodeURIComponent(`اريد شراء هذا المنتج: ${product.name} - السعر: ${product.discountPrice ? formatPrice(product.discountPrice) : formatPrice(product.price)} - الرابط: ${window.location.origin}/product/${product.id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 text-gray-500 hover:text-[#2bd865] hover:bg-[#2bd865]/10 rounded-full transition-colors flex-1 flex justify-center"
            title="طلب عبر الواتساب"
          >
            <WhatsAppIcon className="w-6 h-6" />
          </a>
          <button 
            onClick={handleFavoriteClick}
            className={`p-2.5 rounded-full transition-colors flex-1 flex justify-center ${
              isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
            title="إضافة للمفضلة"
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); addToCart(product); }}
            className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors flex-1 flex justify-center"
            title="إضافة للسلة"
          >
            <ShoppingCart className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
