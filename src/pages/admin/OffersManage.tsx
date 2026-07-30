import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Plus, Trash2, Loader2, Image as ImageIcon, Upload } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

export default function OffersManage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newOffer, setNewOffer] = useState({ title: '', description: '', imageUrl: '', link: '', isActive: true });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'offers'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer));
      setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setNewOffer(prev => ({ ...prev, imageUrl: dataUrl }));
        } else {
          setNewOffer(prev => ({ ...prev, imageUrl: event.target?.result as string }));
        }
        
        setUploading(false);
        e.target.value = '';
      };
      img.onerror = () => {
        alert("حدث خطأ أثناء معالجة الصورة");
        setUploading(false);
        e.target.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف");
      setUploading(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffer.imageUrl) {
      alert("الرجاء إضافة صورة للعرض");
      return;
    }
    try {
      await addDoc(collection(db, 'offers'), { ...newOffer, createdAt: Date.now() });
      setIsAdding(false);
      setNewOffer({ title: '', description: '', imageUrl: '', link: '', isActive: true });
      fetchOffers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      fetchOffers();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (offer: Offer) => {
    try {
      await updateDoc(doc(db, 'offers', offer.id), { isActive: !offer.isActive });
      fetchOffers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة العروض (البانرات)</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          إضافة عرض
        </button>
      </div>
      
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-lg">عرض جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required type="text" placeholder="عنوان العرض" value={newOffer.title} 
              onChange={e => setNewOffer({...newOffer, title: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2"
            />
            
            <div className="md:col-span-2 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center relative hover:bg-gray-50 transition-colors">
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-primary-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-bold">جاري الرفع...</span>
                </div>
              ) : newOffer.imageUrl ? (
                <div className="relative w-full h-40 group">
                  <img src={newOffer.imageUrl} alt="preview" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <label className="cursor-pointer text-white flex items-center gap-2 font-bold px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm">
                      <Upload className="w-4 h-4" />
                      تغيير الصورة
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-500 mb-1">اضغط هنا لرفع صورة العرض</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP حتى 2MB</p>
                  <input type="file" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                </>
              )}
            </div>

            <input 
              type="text" placeholder="الوصف (اختياري)" value={newOffer.description} 
              onChange={e => setNewOffer({...newOffer, description: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2"
            />
            <input 
              type="text" placeholder="الرابط عند النقر (مثال: /products?category=جوالات)" value={newOffer.link} 
              onChange={e => setNewOffer({...newOffer, link: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none md:col-span-2 text-left" dir="ltr"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-bold">إلغاء</button>
            <button type="submit" disabled={uploading || !newOffer.imageUrl} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50">حفظ</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center space-y-4">
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <ImageIcon className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">لا توجد عروض</h3>
          <p className="text-gray-500">قم بإضافة عروض جديدة لتظهر في الصفحة الرئيسية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <div key={offer.id} className={`bg-white rounded-2xl border ${offer.isActive ? 'border-primary-100' : 'border-gray-200'} overflow-hidden shadow-sm flex flex-col`}>
              <div className="w-full h-40 bg-gray-100 relative">
                <img src={offer.imageUrl} alt={offer.title} className={`w-full h-full object-cover ${!offer.isActive && 'grayscale opacity-60'}`} />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => handleDelete(offer.id)} className="bg-white/90 text-red-600 p-2 rounded-lg hover:bg-white shadow">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-gray-900 mb-1">{offer.title}</h4>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{offer.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${offer.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {offer.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                  <button 
                    onClick={() => toggleStatus(offer)}
                    className="text-sm text-primary-600 font-bold hover:underline"
                  >
                    {offer.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
