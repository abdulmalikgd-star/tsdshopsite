import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES } from '../types';
import { Box, Loader2 } from 'lucide-react';

export default function Categories() {
  const [dbCategories, setDbCategories] = useState<{name: string, imageUrl?: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const catQ = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const catSnapshot = await getDocs(catQ);
      const fetchedCats = catSnapshot.docs.map(doc => ({
        name: doc.data().name,
        imageUrl: doc.data().imageUrl
      }));
      setDbCategories(fetchedCats.length > 0 ? fetchedCats : CATEGORIES.map(name => ({name})));
    } catch (e) {
      console.error(e);
      setDbCategories(CATEGORIES.map(name => ({name})));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">الأقسام</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
        {dbCategories.map((cat, idx) => (
          <Link
            key={idx}
            to={`/products?category=${encodeURIComponent(cat.name)}`}
            className="group text-center flex flex-col items-center w-[100px]"
          >
            <div className="w-[100px] h-[100px] rounded-3xl overflow-hidden bg-gray-50 mb-3 border border-gray-100 shadow-sm group-hover:shadow-md transition-all relative shrink-0">
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100/50">
                   <Box className="h-8 w-8 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              )}
            </div>
            <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors text-sm whitespace-nowrap">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
