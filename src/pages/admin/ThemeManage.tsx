import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, GripVertical, Check, Image as ImageIcon, LayoutGrid, Sparkles, MessageSquare, Plus, Trash2, Megaphone, Type, Box, UploadCloud, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

interface ThemeSection {
  id: string;
  type: 'hero' | 'categories' | 'products_row' | 'promotional_banner' | 'announcement' | 'reviews';
  title?: string;
  subtitle?: string;
  categoryId?: string;
  link?: string;
  ctaText?: string;
  imageUrl?: string;
  bgColor?: string;
  isActive: boolean;
}

const SECTION_ICONS = {
  hero: ImageIcon,
  categories: LayoutGrid,
  products_row: Box,
  promotional_banner: Sparkles,
  announcement: Megaphone,
  reviews: MessageSquare
};

const SECTION_LABELS = {
  hero: 'عرض الشرائح (البانر الرئيسي)',
  categories: 'شبكة الأقسام',
  products_row: 'شريط منتجات',
  promotional_banner: 'بنر ترويجي مستقل',
  announcement: 'شريط إعلاني',
  reviews: 'آراء العملاء'
};

const DEFAULT_SECTIONS: ThemeSection[] = [
  { id: 'hero-1', type: 'hero', isActive: true },
  { id: 'cat-1', type: 'categories', isActive: true },
  { id: 'prod-latest', type: 'products_row', title: 'أحدث المنتجات', categoryId: 'latest', isActive: true },
  { id: 'promo-1', type: 'promotional_banner', title: 'سماعات لاسلكية حديثة بخصم 40%', subtitle: 'لا تفوت فرصة الحصول على تجربة صوتية فريدة بأسعار لاتقبل المنافسة. العرض ساري حتى نفاذ الكمية.', ctaText: 'اطلب الآن', link: '/products', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', isActive: true },
  { id: 'prod-best', type: 'products_row', title: 'الأكثر مبيعاً', categoryId: 'best_sellers', isActive: true },
  { id: 'rev-1', type: 'reviews', isActive: true }
];

function SortableItem({ section, onEdit, onDelete, onToggle }: { section: ThemeSection, onEdit: () => void, onDelete: () => void, onToggle: () => void, key?: React.Key }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const Icon = SECTION_ICONS[section.type] || LayoutGrid;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white rounded-xl border p-4 shadow-sm my-3 ${isDragging ? 'border-primary-500 ring-2 ring-primary-100 opacity-90' : 'border-gray-200'} ${!section.isActive && 'opacity-60 grayscale'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div {...attributes} {...listeners} className="cursor-grab hover:bg-gray-100 p-2 rounded-lg text-gray-400 touch-none">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-gray-800 block">{SECTION_LABELS[section.type]}</span>
            {section.title && <span className="text-xs text-gray-500">{section.title}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">
            {section.isActive ? 'مفعل' : 'معطل'}
          </button>
          
          <button onClick={onEdit} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThemeManage() {
  const [sections, setSections] = useState<ThemeSection[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSection, setEditingSection] = useState<ThemeSection | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTheme();
    fetchCategories();
  }, []);

  const fetchTheme = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'theme'));
      if (docSnap.exists() && docSnap.data().sections) {
        setSections(docSnap.data().sections);
      } else {
        setSections(DEFAULT_SECTIONS);
      }
    } catch (e) {
      console.error(e);
      setSections(DEFAULT_SECTIONS);
    }
  };

  const fetchCategories = async () => {
    try {
      const catQ = query(collection(db, 'categories'));
      const catSnap = await getDocs(catQ);
      setDbCategories(catSnap.docs.map(d => d.data().name));
    } catch (e) {
      console.error(e);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveLayout = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Strip out any undefined values to avoid Firestore errors
      const cleanSections = JSON.parse(JSON.stringify(sections));
      await setDoc(doc(db, 'settings', 'theme'), { sections: cleanSections });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = (type: ThemeSection['type']) => {
    const newSection: ThemeSection = {
      id: `sec-${Date.now()}`,
      type,
      isActive: true,
      title: type === 'products_row' ? 'قسم جديد' : type === 'announcement' ? 'إعلان هام' : '',
      categoryId: type === 'products_row' ? 'latest' : undefined,
    };
    setSections([...sections, newSection]);
    setIsAdding(false);
    setEditingSection(newSection);
  };

  const updateEditingSection = (updates: Partial<ThemeSection>) => {
    if (editingSection) {
      setEditingSection({ ...editingSection, ...updates });
    }
  };

  const saveEditedSection = () => {
    if (editingSection) {
      setSections(sections.map(s => s.id === editingSection.id ? editingSection : s));
      setEditingSection(null);
    }
  };

  const toggleSection = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const deleteSection = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
          updateEditingSection({ imageUrl: dataUrl });
        } else {
          updateEditingSection({ imageUrl: event.target?.result as string });
        }
        
        setIsUploading(false);
        e.target.value = '';
      };
      img.onerror = () => {
        alert("حدث خطأ أثناء معالجة الصورة");
        setIsUploading(false);
        e.target.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف");
      setIsUploading(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المحتوى والتصميم</h1>
          <p className="text-gray-500 mt-1">قم ببناء وتخصيص واجهة متجرك الرئيسية بالكامل.</p>
        </div>
        <button 
          onClick={saveLayout}
          disabled={isSaving}
          className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition flex items-center gap-2 shadow-lg shadow-primary-200"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-2 font-medium animate-pulse">
          <Check className="h-5 w-5" />
          تم حفظ الواجهة بنجاح.
        </div>
      )}

      {editingSection ? (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              إعدادات {SECTION_LABELS[editingSection.type]}
            </h3>
            <button onClick={() => setEditingSection(null)} className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg">إلغاء</button>
          </div>

          <div className="space-y-4">
            {editingSection.type === 'announcement' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">النص الإعلاني</label>
                  <input type="text" value={editingSection.title || ''} onChange={e => updateEditingSection({ title: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="مثال: خصم 20% بمناسبة العيد" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الرابط (اختياري)</label>
                  <input type="text" dir="ltr" value={editingSection.link || ''} onChange={e => updateEditingSection({ link: e.target.value })} className="w-full text-left border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="/products" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">لون الخلفية (اختياري)</label>
                  <input type="text" dir="ltr" value={editingSection.bgColor || ''} onChange={e => updateEditingSection({ bgColor: e.target.value })} className="w-full text-left border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="مثال: bg-primary-600" />
                </div>
              </>
            )}

            {editingSection.type === 'products_row' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">عنوان القسم</label>
                  <input type="text" value={editingSection.title || ''} onChange={e => updateEditingSection({ title: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="مثال: أحدث العطور" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">مصدر المنتجات</label>
                  <select value={editingSection.categoryId || 'latest'} onChange={e => updateEditingSection({ categoryId: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="latest">أحدث المنتجات (Latest)</option>
                    <option value="best_sellers">الأكثر مبيعاً (Best Sellers)</option>
                    {dbCategories.map(cat => <option key={cat} value={cat}>تصنيف: {cat}</option>)}
                  </select>
                </div>
              </>
            )}

            {editingSection.type === 'promotional_banner' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
                    <input type="text" value={editingSection.title || ''} onChange={e => updateEditingSection({ title: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">نص الزر</label>
                    <input type="text" value={editingSection.ctaText || ''} onChange={e => updateEditingSection({ ctaText: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="تسوق الآن" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                    <textarea rows={2} value={editingSection.subtitle || ''} onChange={e => updateEditingSection({ subtitle: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الصورة (الرابط أو الرفع)</label>
                    <div className="flex gap-2 mb-2">
                      <input type="text" dir="ltr" value={editingSection.imageUrl || ''} onChange={e => updateEditingSection({ imageUrl: e.target.value })} className="flex-1 text-left border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://" />
                      <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer px-4 rounded-xl border border-gray-200 transition-colors">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <UploadCloud className="w-5 h-5 text-gray-500" />}
                        <span className="mr-2 text-sm font-bold text-gray-700 hidden sm:inline">رفع صورة</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                    {editingSection.imageUrl && (
                       <img src={editingSection.imageUrl} alt="preview" className="h-32 object-cover rounded-xl mt-2 border border-gray-200" />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الرابط عند النقر</label>
                    <input type="text" dir="ltr" value={editingSection.link || ''} onChange={e => updateEditingSection({ link: e.target.value })} className="w-full text-left border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="/products" />
                  </div>
                </div>
              </>
            )}

            {(editingSection.type === 'hero' || editingSection.type === 'categories' || editingSection.type === 'reviews') && (
              <div className="text-gray-500 text-center py-6">
                هذا القسم لا يتطلب إعدادات إضافية. يمكنك تفعيله أو تعطيله فقط، وتعديل محتواه من الشاشات الخاصة به:
                <br />
                {editingSection.type === 'hero' && <span className="font-bold text-primary-600 mt-2 block">راجع إدارة "العروض والتسويق" لتعديل البانرات.</span>}
                {editingSection.type === 'categories' && <span className="font-bold text-primary-600 mt-2 block">راجع إدارة "الأقسام" لتعديل التصنيفات المعروضة.</span>}
                {editingSection.type === 'reviews' && <span className="font-bold text-primary-600 mt-2 block">راجع إدارة "آراء العملاء" لتعديل الآراء المعروضة.</span>}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={saveEditedSection} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 transition">
              موافق (تأكيد الإعدادات)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-gray-500" />
              ترتيب عناصر الصفحة الرئيسية
            </h3>
            
            <div className="relative">
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                إضافة قسم
              </button>
              
              {isAdding && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-xl p-2 z-20">
                  <div className="text-xs font-bold text-gray-400 mb-2 px-2 uppercase">اختر نوع القسم</div>
                  <div className="space-y-1">
                    {Object.entries(SECTION_LABELS).map(([k, label]) => {
                      const Icon = SECTION_ICONS[k as keyof typeof SECTION_ICONS];
                      return (
                        <button key={k} onClick={() => handleAddSection(k as any)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-right transition-colors">
                          <Icon className="w-4 h-4 text-primary-600" />
                          <span className="font-bold text-gray-700">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 relative z-10">
                {sections.length === 0 && (
                  <div className="text-center py-10 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                    لا توجد أقسام مضافة للرئيسية.
                  </div>
                )}
                {sections.map(section => (
                  <SortableItem 
                    key={section.id} 
                    section={section} 
                    onEdit={() => setEditingSection(section)}
                    onToggle={() => toggleSection(section.id)}
                    onDelete={() => deleteSection(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
