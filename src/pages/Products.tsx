import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product, CATEGORIES } from '../types';
import { Search, Filter, Loader2, ArrowDownWideNarrow } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating';

export default function Products() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);

      const catQ = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const catSnapshot = await getDocs(catQ);
      const fetchedCats = catSnapshot.docs.map(doc => doc.data().name);
      if (fetchedCats.length > 0) {
        setDbCategories(fetchedCats);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cat = searchParams.get('category');
    const search = searchParams.get('search');
    setSelectedCategory(cat || null);
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const sortedAndFilteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      const getPrice = (p: Product) => p.discountPrice || p.price;
      switch (sortBy) {
        case 'price_asc': return getPrice(a) - getPrice(b);
        case 'price_desc': return getPrice(b) - getPrice(a);
        case 'rating': return -1; // Dummy rating sort Since we don't have true ratings yet
        case 'newest':
        default: return 0; // Already sorted by created_at desc from DB generally
      }
    });

    return result;
  }, [searchTerm, selectedCategory, products, sortBy]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">كل المنتجات</h1>
          <p className="text-gray-500 text-sm">عرض {sortedAndFilteredProducts.length} منتج</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 flex-1 justify-end max-w-3xl">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div className="relative border border-gray-200 rounded-2xl bg-white flex items-center px-2">
            <Filter className="text-gray-400 h-5 w-5 mr-1" />
            <select 
              value={selectedCategory || ''}
              onChange={(e) => {setSelectedCategory(e.target.value || null); setVisibleCount(8);}}
              className="appearance-none font-medium pr-2 pl-8 py-3 bg-transparent text-gray-700 outline-none cursor-pointer"
            >
              <option value="">كل الأقسام</option>
              {((dbCategories.length > 0 ? dbCategories : CATEGORIES)).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="relative border border-gray-200 rounded-2xl bg-white flex items-center px-2">
            <ArrowDownWideNarrow className="text-gray-400 h-5 w-5 mr-1" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none font-medium pr-2 pl-8 py-3 bg-transparent text-gray-700 outline-none cursor-pointer"
            >
              <option value="newest">الأحدث</option>
              <option value="price_asc">السعر: من الأقل للأعلى</option>
              <option value="price_desc">السعر: من الأعلى للأقل</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">جاري تحميل المنتجات...</p>
          </div>
        ) : sortedAndFilteredProducts.length > 0 ? (
          sortedAndFilteredProducts.slice(0, visibleCount).map((product, idx) => (
            <ProductCard key={product.id} product={product} idx={idx} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">لا توجد نتائج</h3>
            <p className="text-gray-500 max-w-sm mx-auto">لم نعثر على أي منتجات تطابق بحثك. حاول البحث بكلمة أخرى أو تغيير الفلاتر المختارة.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory(null); setSortBy('newest');}}
              className="text-primary-600 font-bold hover:underline inline-block mt-2"
            >
              إعادة تهيئة البحث
            </button>
          </div>
        )}
      </div>

      {!loading && sortedAndFilteredProducts.length > visibleCount && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={loadMore}
            className="bg-white border-2 border-primary-600 text-primary-600 px-10 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-sm"
          >
            عرض المزيد
          </button>
        </div>
      )}
    </div>
  );
}
