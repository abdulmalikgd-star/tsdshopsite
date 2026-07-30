import React, { useState, useEffect } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { collection, query, documentId, getDocs, where, FieldPath } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Favorites() {
  const { favorites, loading: favoritesLoading } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [favorites]);

  const fetchProducts = async () => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Firebase 'in' queries are limited to 10 items.
      // For a robust wishlist handling more than 10, we'd need to chunk the array
      // or fetch individually. Let's do chunking.
      
      const chunks = [];
      for (let i = 0; i < favorites.length; i += 10) {
        chunks.push(favorites.slice(i, i + 10));
      }
      
      let allProducts: Product[] = [];
      
      for (const chunk of chunks) {
        const q = query(
          collection(db, 'products'),
          where(documentId(), 'in', chunk)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        allProducts = [...allProducts, ...fetchedProducts];
      }
      
      setProducts(allProducts);
    } catch (error) {
      console.error("Error fetching wishlist products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (favoritesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-24">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
          <Heart className="h-8 w-8 fill-current" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">المفضلة</h1>
        <p className="text-gray-500 max-w-lg">
          المنتجات التي أبديت إعجابك بها محفوظة هنا لسهولة الوصول إليها لاحقاً.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} idx={idx} />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="h-24 w-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">لا يوجد منتجات في المفضلة</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            لم تقم بإضافة أي منتجات إلى قائمتك المفضلة حتى الآن. تصفح المنتجات وأضف ما يعجبك!
          </p>
          <a href="/products" className="inline-block bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
            تصفح المنتجات
          </a>
        </motion.div>
      )}
    </div>
  );
}
