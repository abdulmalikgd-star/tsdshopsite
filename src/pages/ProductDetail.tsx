import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_PRODUCTS } from '../data';
import { ShoppingCart, Star, ArrowRight, ShieldCheck, Truck, RefreshCw, Minus, Plus, Heart, CreditCard, User, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';
import { collection, doc, getDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductReviews from '../components/ProductReviews';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        let currProduct: Product | null = null;
        if (docSnap.exists()) {
          currProduct = { id: docSnap.id, ...docSnap.data() } as Product;
        } else {
          // fallback to initial products for matching ID
          const fallback = INITIAL_PRODUCTS.find(p => p.id === id);
          if (fallback) currProduct = fallback;
        }
        
        if (currProduct) {
          setProduct(currProduct);
          // fetch related
          const q = query(collection(db, 'products'), where('category', '==', currProduct.category), limit(5));
          const relatedSnap = await getDocs(q);
          const related = relatedSnap.docs
             .map(d => ({ id: d.id, ...d.data() } as Product))
             .filter(p => p.id !== currProduct?.id)
             .slice(0, 4);
             
          if(related.length === 0) {
             setRelatedProducts(INITIAL_PRODUCTS.filter(p => p.category === currProduct?.category && p.id !== currProduct?.id).slice(0, 4));
          } else {
             setRelatedProducts(related);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setQuantity(1);
    setActiveImage(0);
  }, [id]);

  const isFavorite = id ? favorites.includes(id) : false;

  const handleFavoriteClick = async () => {
    if (id) {
      await toggleFavorite(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري التحميل...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">المنتج غير موجود</h2>
        <Link to="/products" className="text-primary-600 font-bold hover:underline">العودة للمنتجات</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8">
        <Link to="/products" className="flex items-center text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للمنتجات
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Images wrapper */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 relative cursor-zoom-in"
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
          >
            <img 
              src={product.images[activeImage]} 
              alt={product.name}
              className={`w-full h-full object-contain mix-blend-multiply p-8 transition-transform duration-200 ease-out ${isZooming ? 'scale-[2]' : 'scale-100'}`}
              style={isZooming ? { transformOrigin: `${mousePosition.x}% ${mousePosition.y}%` } : undefined}
            />
          </motion.div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all p-2 bg-gray-50 ${activeImage === idx ? 'border-primary-600 shadow-md transform -translate-y-1' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
              </button>
            ))}
          </div>
        </div>

        {/* Content wrapper */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium">{product.category}</span>
              <button 
                onClick={handleFavoriteClick}
                className={`p-3 rounded-full border border-gray-200 transition-all shadow-sm ${
                  isFavorite ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-white text-gray-400 hover:text-red-500 hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex text-yellow-400">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current text-gray-200" />
                </div>
                <span className="text-gray-500 text-sm font-medium">(45 تقييم)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <span className="text-gray-500 text-sm font-medium">السعر</span>
            <div className="flex items-baseline space-x-3 space-x-reverse">
              {product.discountPrice ? (
                <>
                  <span className="text-4xl font-black text-primary-600">{formatPrice(product.discountPrice)}</span>
                  <span className="text-xl text-gray-400 line-through font-medium">{formatPrice(product.price)}</span>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded ml-2">خصم</span>
                </>
              ) : (
                <span className="text-4xl font-black text-gray-900">{formatPrice(product.price)}</span>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary-600 rounded-full inline-block"></span>
                المواصفات التقنية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">{key}</span>
                      <span className="block font-bold text-gray-900">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex flex-1 gap-4">
                <a 
                  href={`https://wa.me/967733739900?text=${encodeURIComponent(`اريد شراء هذا المنتج: ${product.name} - السعر: ${product.discountPrice ? formatPrice(product.discountPrice) : formatPrice(product.price)} - الرابط: ${window.location.origin}/product/${product.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#2bd865] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#25c158] transition-all flex items-center justify-center"
                >
                  أشتري عبر واتساب
                </a>
                <button 
                  onClick={() => addToCart(product, quantity)}
                  className="flex-1 bg-[#ff5a1f] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#e04510] transition-all shadow-md flex items-center justify-center transform hover:-translate-y-1"
                >
                  أضف للسلة
                </button>
              </div>

              <div className="flex shrink-0 items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm h-[60px]">
                <button 
                  onClick={() => setQuantity(Math.min(product.stock || 100, quantity + 1))}
                  className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors bg-gray-50 font-bold"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center font-bold px-1 focus:outline-none appearance-none"
                />
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors bg-gray-50 font-bold"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-100">
            <div className="flex flex-col items-center text-center space-y-2 group">
              <div className="p-3 bg-gray-50 group-hover:bg-primary-50 rounded-full transition-colors text-gray-600 group-hover:text-primary-600">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gray-700">شحن سريع</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 group">
              <div className="p-3 bg-gray-50 group-hover:bg-primary-50 rounded-full transition-colors text-gray-600 group-hover:text-primary-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gray-700">ضمان حقيقي</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2 group">
              <div className="p-3 bg-gray-50 group-hover:bg-primary-50 rounded-full transition-colors text-gray-600 group-hover:text-primary-600">
                <RefreshCw className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gray-700">استرجاع مرن</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mb-20 pt-10 border-t border-gray-100">
         <ProductReviews productId={product.id} />
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
         <div className="pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 <span className="w-2 h-8 bg-primary-600 rounded-full inline-block"></span>
                 منتجات مشابهة قد تعجبك
               </h2>
               <Link to={`/products?category=${product.category}`} className="text-primary-600 font-bold hover:underline flex items-center">
                 عرض المزيد <ArrowLeft className="w-4 h-4 mr-1" />
               </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} idx={idx} />
              ))}
            </div>
         </div>
      )}
    </div>
  );
}
