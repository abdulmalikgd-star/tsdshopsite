import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, Loader2, Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  isActive: boolean;
  productId?: string;
}

export default function ReviewsManage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'products'>('store');
  
  const [newReview, setNewReview] = useState({ name: '', text: '', rating: 5, isActive: true });

  useEffect(() => {
    if (activeTab === 'store') {
      fetchReviews();
    } else {
      fetchProductReviews();
    }
  }, [activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'product_reviews'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      setProductReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'products') return; // Can't add product rev from here right now easily
    try {
      await addDoc(collection(db, 'reviews'), { ...newReview, createdAt: Date.now() });
      setIsAdding(false);
      setNewReview({ name: '', text: '', rating: 5, isActive: true });
      fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, collectionName: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === 'reviews') fetchReviews();
      else fetchProductReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (review: Review, collectionName: string) => {
    try {
      await updateDoc(doc(db, collectionName, review.id), { isActive: !review.isActive });
      if (collectionName === 'reviews') fetchReviews();
      else fetchProductReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const currentList = activeTab === 'store' ? reviews : productReviews;
  const colName = activeTab === 'store' ? 'reviews' : 'product_reviews';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة آراء العملاء</h1>
        {activeTab === 'store' && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            إضافة رأي للمتجر
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`pb-3 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'store' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('store')}
        >
          آراء المتجر
        </button>
        <button
          className={`pb-3 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'products' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('products')}
        >
          تقييمات المنتجات
        </button>
      </div>
      
      {isAdding && activeTab === 'store' && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-lg">رأي جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required type="text" placeholder="اسم العميل" value={newReview.name} 
              onChange={e => setNewReview({...newReview, name: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2">
              <span className="text-gray-500 text-sm">التقييم:</span>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNewReview({...newReview, rating: num})}
                  className="focus:outline-none"
                >
                  <Star className={`w-6 h-6 ${num <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <textarea 
              required placeholder="نص الرأي والمراجعة" value={newReview.text} 
              onChange={e => setNewReview({...newReview, text: e.target.value})}
              rows={3}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-bold">إلغاء</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700">حفظ</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center space-y-4">
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <MessageSquare className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">لا توجد آراء</h3>
          <p className="text-gray-500">لم يتم العثور على أي تقييمات في هذا القسم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map(review => (
            <div key={review.id} className={`bg-white rounded-2xl border ${review.isActive ? 'border-primary-100 shadow-sm' : 'border-gray-300'} p-6 flex flex-col relative`}>
              <div className="absolute top-4 right-4 flex gap-1">
                 <button onClick={() => handleDelete(review.id, colName)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex gap-1 mb-4 pt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className={`text-gray-600 mb-4 flex-1 text-sm leading-relaxed ${!review.isActive && 'opacity-60'}`}>"{review.text}"</p>
              
              {review.productId && (
                <div className="text-xs text-gray-400 mb-4 break-all">رمز المنتج: {review.productId}</div>
              )}

              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${review.isActive ? 'bg-primary-500' : 'bg-gray-400'}`}>
                    {review.name.charAt(0)}
                  </div>
                  <span className={`font-bold text-sm ${review.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{review.name}</span>
                </div>
                <button 
                  onClick={() => toggleStatus(review, colName)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full hover:underline ${review.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                >
                  {review.isActive ? 'نشط (معروض)' : 'مخفي'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
