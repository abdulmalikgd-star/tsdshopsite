import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProductReview {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  createdAt: number;
  isActive: boolean;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', text: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'product_reviews'), 
        where('productId', '==', productId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductReview));
      // Sort manually since we might not have a composite index for productId and createdAt
      data.sort((a, b) => b.createdAt - a.createdAt);
      // Filter out inactive ones
      setReviews(data.filter(r => r.isActive !== false));
    } catch (e) {
      console.error('Failed to fetch reviews', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.text.trim()) return;
    
    setSubmitting(true);
    try {
      const reviewData = {
        ...newReview,
        productId,
        createdAt: Date.now(),
        isActive: true
      };
      await addDoc(collection(db, 'product_reviews'), reviewData);
      setSuccess(true);
      setIsAdding(false);
      setNewReview({ name: '', text: '', rating: 5 });
      fetchReviews();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-8 bg-yellow-400 rounded-full inline-block"></span>
          التقييمات والآراء
        </h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-primary-600 font-bold hover:underline"
          >
            كتابة تقييم
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
          تمت إضافة تقييمك بنجاح! شكراً لك.
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-8 space-y-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">أضف تقييمك لهذا المنتج</h3>
          
          <div className="flex flex-col gap-1.5 mb-2">
            <span className="text-sm font-medium text-gray-700">تقييمك:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNewReview({...newReview, rating: num})}
                  className="focus:outline-none"
                >
                  <Star className={`w-7 h-7 transition-colors ${num <= newReview.rating ? 'text-[#ff9900] fill-[#ff9900]' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input 
                required 
                type="text" 
                value={newReview.name}
                onChange={e => setNewReview({...newReview, name: e.target.value})}
                placeholder="أدخل اسمك"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرأي / التعليق</label>
              <textarea 
                required 
                rows={4}
                value={newReview.text}
                onChange={e => setNewReview({...newReview, text: e.target.value})}
                placeholder="ما رأيك في هذا المنتج؟"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl font-bold transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center min-w-[120px]"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال التقييم'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100">
          <MessageSquareIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">لا توجد تقييمات حتى الآن. كن أول من يقيّم هذا المنتج!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold block text-gray-900">{review.name}</span>
                    <span className="text-xs text-gray-500">{format(review.createdAt, 'dd MMMM yyyy', { locale: ar })}</span>
                  </div>
                </div>
                <div className="flex text-[#ff9900]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
