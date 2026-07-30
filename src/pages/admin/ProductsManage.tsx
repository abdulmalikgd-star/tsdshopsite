import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product, CATEGORIES } from '../../types';
import { Plus, Edit2, Trash2, Search, X, Loader2, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../data';
import { formatPrice } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductsManage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedCats = querySnapshot.docs.map(doc => doc.data().name);
      if (fetchedCats.length > 0) {
        setDbCategories(fetchedCats);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async () => {
    if (!window.confirm('هل أنت متأكد من إضافة المنتجات التجريبية لقاعدة البيانات؟')) return;
    setIsSeeding(true);
    try {
      // Create categories first if needed
      for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        if (!dbCategories.includes(cat)) {
          await addDoc(collection(db, 'categories'), { name: cat, order: i });
        }
      }
      
      // Add initial products
      for (const p of INITIAL_PRODUCTS) {
        const { id, ...data } = p; // remove old fixed ID, let firestore generate
        await addDoc(collection(db, 'products'), data);
      }
      
      alert('تم إضافة البيانات بنجاح!');
      fetchCategories();
      fetchProducts();
    } catch (error) {
      console.error("Error seeding:", error);
      alert('فشل في إضافة البيانات. تأكد من أنك تملك صلاحيات الأدمن.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description);
      setCategory(product.category);
      setImageUrls(product.images || []);
      setCurrentImageUrl('');
      setSpecs(product.specs || {});
      setNewSpecKey('');
      setNewSpecValue('');
    } else {
      setEditingProduct(null);
      setName('');
      setPrice('');
      setDescription('');
      setCategory(dbCategories.length > 0 ? dbCategories[0] : CATEGORIES[0]);
      setImageUrls([]);
      setCurrentImageUrl('');
      setSpecs({});
      setNewSpecKey('');
      setNewSpecValue('');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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
          setImageUrls(prev => [...prev, dataUrl]);
        } else {
          setImageUrls(prev => [...prev, event.target?.result as string]);
        }
        
        setIsUploading(false);
        e.target.value = '';
      };
      
      img.onerror = () => {
        alert("حدث خطأ أثناء معالجة الصورة.");
        setIsUploading(false);
        e.target.value = '';
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف.");
      setIsUploading(false);
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };
  
  const handleAddImageUrl = () => {
    if (currentImageUrl.trim()) {
      setImageUrls(prev => [...prev, currentImageUrl.trim()]);
      setCurrentImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setSpecs(prev => ({ ...prev, [newSpecKey.trim()]: newSpecValue.trim() }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const handleRemoveSpec = (key: string) => {
    setSpecs(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages = imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1546868871-70c122467d16?auto=format&fit=crop&q=80&w=800'];
    const productData = {
      name,
      price: parseFloat(price),
      description,
      category,
      images: finalImages,
      stock: 10,
      specs,
      createdAt: editingProduct ? editingProduct.createdAt : Date.now(),
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      // Mock update for demo if firebase fails
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      } else {
        setProducts(prev => [{ id: Math.random().toString(), ...productData }, ...prev]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-gray-500">أضف، عدل أو احذف المنتجات من متجرك.</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {!loading && products.length === 0 && (
            <button 
              onClick={seedProducts}
              disabled={isSeeding}
              className="px-6 py-3 rounded-2xl font-bold transition-all bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            >
              {isSeeding ? 'جاري الإضافة...' : 'إضافة المنتجات التجريبية'}
            </button>
          )}
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">المنتج</th>
                <th className="px-6 py-4 font-bold">القسم</th>
                <th className="px-6 py-4 font-bold">السعر</th>
                <th className="px-6 py-4 font-bold">المخزون</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      جاري تحميل المنتجات...
                    </td>
                 </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="h-12 w-12 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-gray-900 line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-lg text-gray-600">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary-600">{formatPrice(product.price)}</td>
                  <td className="px-6 py-4 text-gray-500">{product.stock} قطع</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">اسم المنتج</label>
                    <input 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">السعر (بالريال اليمني القديم)</label>
                    <input 
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">قسم المنتج</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      {(dbCategories.length > 0 ? dbCategories : CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">وصف المنتج</label>
                    <textarea 
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">المواصفات (اختياري)</label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          placeholder="مثال: المعالج (CPU)"
                          value={newSpecKey}
                          onChange={(e) => setNewSpecKey(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <input
                          placeholder="مثال: Intel Core i7"
                          value={newSpecValue}
                          onChange={(e) => setNewSpecValue(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSpec();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSpec}
                          className="bg-gray-100 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          إضافة
                        </button>
                      </div>
                      
                      {Object.keys(specs).length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-gray-100 text-sm">
                              <div className="flex items-center space-x-4 space-x-reverse">
                                <span className="font-bold text-gray-700">{key}:</span>
                                <span className="text-gray-600">{value}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpec(key)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">صور المنتج</label>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ImageIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input 
                            value={currentImageUrl}
                            onChange={(e) => setCurrentImageUrl(e.target.value)}
                            placeholder="أدخل رابط الصورة..."
                            className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImageUrl();
                              }
                            }}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={handleAddImageUrl}
                          className="bg-gray-100 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          إضافة
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <label className="cursor-pointer flex-1 bg-white border border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 py-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition-colors">
                          {isUploading ? (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                              <span className="font-medium text-sm">جاري الرفع...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-6 w-6 text-gray-400" />
                              <span className="font-medium text-sm">أو اختر صورة من جهازك للرفع</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            disabled={isUploading}
                          />
                        </label>
                      </div>

                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {imageUrls.map((url, i) => (
                            <div key={i} className="relative group rounded-xl border border-gray-100 overflow-hidden aspect-square bg-gray-50">
                              <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => handleRemoveImage(i)}
                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-4 bg-white shrink-0">
                <button type="submit" onClick={(e) => { e.preventDefault(); handleSubmit(e); }} className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all p-4">
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all p-4">
                  إلغاء
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
