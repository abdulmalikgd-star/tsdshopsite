import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit2, Trash2, X, Loader2, ArrowUp, ArrowDown, Box, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { CATEGORIES } from '../../types';

export interface Category {
  id: string;
  name: string;
  order: number;
  imageUrl?: string;
}

export default function CategoriesManage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedCats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(fetchedCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedCategories = async () => {
    if (!window.confirm('هل أنت متأكد من إضافة الأقسام التجريبية لقاعدة البيانات؟')) return;
    setIsSeeding(true);
    try {
      for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        if (!categories.find(c => c.name === cat)) {
          await addDoc(collection(db, 'categories'), { name: cat, order: i });
        }
      }
      alert('تم إضافة الأقسام بنجاح!');
      fetchCategories();
    } catch (error) {
      console.error("Error seeding categories:", error);
      alert('فشل في الإضافة. تأكد من صلاحياتك.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setImageUrl(category.imageUrl || '');
    } else {
      setEditingCategory(null);
      setName('');
      setImageUrl('');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، الحد الأقصى هو 2 ميجابايت');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max 500px for category icons/images
        const MAX_DIM = 500;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageUrl(dataUrl);
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), { name, imageUrl });
      } else {
        const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0;
        await addDoc(collection(db, 'categories'), { name, order: nextOrder, imageUrl });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    
    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newCategories[index].order;
    newCategories[index].order = newCategories[swapIndex].order;
    newCategories[swapIndex].order = tempOrder;

    // Swap elements in array for immediate UI feedback
    const temp = newCategories[index];
    newCategories[index] = newCategories[swapIndex];
    newCategories[swapIndex] = temp;
    
    setCategories(newCategories);

    try {
      // Update DB
      await updateDoc(doc(db, 'categories', newCategories[index].id), { order: newCategories[index].order });
      await updateDoc(doc(db, 'categories', newCategories[swapIndex].id), { order: newCategories[swapIndex].order });
    } catch (error) {
       console.error("Error updating order:", error);
       fetchCategories(); // revert on fail
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الأقسام</h1>
          <p className="text-gray-500">أضف، عدل أو رتب أقسام متجرك.</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {!loading && categories.length === 0 && (
            <button 
              onClick={seedCategories}
              disabled={isSeeding}
              className="px-6 py-3 rounded-2xl font-bold transition-all bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            >
              {isSeeding ? 'جاري الإضافة...' : 'إضافة الأقسام التجريبية'}
            </button>
          )}
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold w-20">الصورة</th>
                <th className="px-6 py-4 font-bold">اسم القسم</th>
                <th className="px-6 py-4 font-bold text-center">الترتيب</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      جاري تحميل الأقسام...
                    </td>
                 </tr>
              ) : categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Box className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                       <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30"><ArrowUp className="h-5 w-5" /></button>
                       <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categories.length - 1} className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30"><ArrowDown className="h-5 w-5" /></button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-10 text-center text-gray-500">لا يوجد أقسام مضافة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">صورة القسم (اختياري)</label>
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="relative group w-20 h-20 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setImageUrl('')} 
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors inline-block">
                        {isUploading ? 'جاري الرفع...' : 'اختر صورة'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">يفضل صور مربعة بخلفية بيضاء أو شفافة.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">اسم القسم</label>
                  <input 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثل: سماعات، ملحقات سيارة، مستلزمات..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all p-4">
                    {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all p-4">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
