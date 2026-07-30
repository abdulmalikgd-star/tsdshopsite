import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Save, Settings, Truck, CreditCard, Bell, Globe, Loader2, UploadCloud, Store, Link as LinkIcon, Plus, Trash2, Youtube, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Send } from 'lucide-react';

export default function SettingsManage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const [settings, setSettings] = useState({
    storeName: "متجر العصر التقني",
    storeLogo: "",
    logoSize: 150,
    email: "support@example.com",
    phone: "770000000",
    aboutText: "وجهتك الأولى لتسوق أفضل الأجهزة الذكية والإلكترونيات. نقدم لك منتجات أصلية 100% مع ضمان الجودة وسرعة التوصيل.",
    currency: "YER",
    usdToYerOld: 540,
    sarToYerOld: 140,
    paymentCreditCard: true,
    paymentCashOnDelivery: true,
    shippingLocal: true,
    shippingInternational: false,
    shippingCost: 2000,
    notificationEmail: true,
    notificationSMS: false,
    seoTitle: "متجر العصر التقني",
    seoDescription: "متجر تقني رائد",
    seoKeywords: "هواتف, تقنية, شراء",
    favicon: "",
    ogImage: "",
    socialLinks: [] as { id: string; platform: string; url: string; isActive: boolean }[]
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'general'));
      if (docSnap.exists()) {
        setSettings({ ...settings, ...docSnap.data() });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
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
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          setSettings(prev => ({ ...prev, storeLogo: dataUrl }));
        } else {
          setSettings(prev => ({ ...prev, storeLogo: event.target?.result as string }));
        }
        
        setUploadingLogo(false);
        e.target.value = '';
      };
      img.onerror = () => {
        alert("حدث خطأ أثناء معالجة الصورة");
        setUploadingLogo(false);
        e.target.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف");
      setUploadingLogo(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'favicon' | 'ogImage',
    maxWidth: number,
    maxHeight: number,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
    forceSquare: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingState(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (forceSquare) {
           const size = Math.min(width, height);
           width = size;
           height = size;
        }

        if (width > maxWidth) {
           height *= maxWidth / width;
           width = maxWidth;
        }
        if (height > maxHeight) {
           width *= maxHeight / height;
           height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (forceSquare) {
             const size = Math.min(img.width, img.height);
             const startX = (img.width - size) / 2;
             const startY = (img.height - size) / 2;
             ctx.drawImage(img, startX, startY, size, size, 0, 0, width, height);
          } else {
             ctx.drawImage(img, 0, 0, width, height);
          }
          const format = key === 'ogImage' ? 'image/jpeg' : 'image/webp';
          const dataUrl = canvas.toDataURL(format, 0.8);
          setSettings(prev => ({ ...prev, [key]: dataUrl }));
        } else {
          setSettings(prev => ({ ...prev, [key]: event.target?.result as string }));
        }
        
        setLoadingState(false);
        e.target.value = '';
      };
      img.onerror = () => {
        alert("حدث خطأ أثناء معالجة الصورة");
        setLoadingState(false);
        e.target.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف");
      setLoadingState(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', name: 'إعدادات عامة', icon: Settings },
    { id: 'payment', name: 'بوابات الدفع', icon: CreditCard },
    { id: 'shipping', name: 'الشحن والتوصيل', icon: Truck },
    { id: 'notifications', name: 'الإشعارات', icon: Bell },
    { id: 'social', name: 'التواصل الاجتماعي', icon: LinkIcon },
    { id: 'seo', name: 'الظهور (SEO)', icon: Globe },
  ];

  if (loading) {
     return <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
          <p className="text-gray-500">تخصيص كافة إعدادات متجرك من مكان واحد.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span>حفظ التغييرات</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map(tab => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                 activeTab === tab.id 
                   ? 'bg-primary-50 text-primary-600' 
                   : 'text-gray-600 hover:bg-gray-50'
               }`}
             >
               <tab.icon className="w-5 h-5" />
               {tab.name}
             </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          {activeTab === 'general' && (
             <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">اسم المتجر</label>
                  <input type="text" value={settings.storeName} onChange={(e) => handleChange('storeName', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">شعار المتجر (اختياري)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {settings.storeLogo ? (
                        <img src={settings.storeLogo} alt="Store Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer px-4 py-2 rounded-xl transition-colors shrink-0">
                      {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin text-gray-500 sm:ml-2" /> : <UploadCloud className="w-5 h-5 text-gray-500 sm:ml-2" />}
                      <span className="text-sm font-bold text-gray-700 hidden sm:inline">رفع شعار جديد</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </label>
                    {settings.storeLogo && (
                      <button onClick={() => handleChange('storeLogo', '')} className="text-red-500 text-sm font-bold hover:underline px-2">إزالة</button>
                    )}
                  </div>
                </div>
                {settings.storeLogo && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">حجم الشعار: {settings.logoSize}px</label>
                    <input 
                      type="range" 
                      min="50" 
                      max="300" 
                      step="10"
                      value={settings.logoSize || 150} 
                      onChange={(e) => handleChange('logoSize', parseInt(e.target.value))} 
                      className="w-full accent-primary-600" 
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">البريد الإلكتروني للتواصل</label>
                  <input type="email" value={settings.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">رقم الجوال (للتنبيهات)</label>
                  <input type="tel" value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">نبذة عن المتجر (تظهر في الفوتر)</label>
                  <textarea rows={3} value={settings.aboutText} onChange={(e) => handleChange('aboutText', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">العملة الافتراضية</label>
                  <select value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none">
                     <option value="YER">ريال يمني (YER)</option>
                     <option value="SAR">ريال سعودي (SAR)</option>
                     <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-900 mb-2 mt-4">سعر صرف الدولار الأمريكي مقابل الريال اليمني القديم (YER)</label>
                   <input type="number" value={settings.usdToYerOld || 533} onChange={(e) => handleChange('usdToYerOld', parseFloat(e.target.value) || 533)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-left" dir="ltr" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-900 mb-2 mt-4">سعر صرف الريال السعودي مقابل الريال اليمني القديم (YER)</label>
                   <input type="number" step="0.01" value={settings.sarToYerOld || 140} onChange={(e) => handleChange('sarToYerOld', parseFloat(e.target.value) || 140)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-left" dir="ltr" />
                </div>
             </div>
          )}

          {activeTab === 'payment' && (
             <div className="space-y-6 max-w-2xl">
                <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleChange('paymentCreditCard', !settings.paymentCreditCard)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                         <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">البطاقات اللائتمانية</h4>
                         <p className="text-sm text-gray-500">تمكين الدفع بواسطة Visa, MasterCard</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input type="checkbox" checked={settings.paymentCreditCard} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                   </label>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleChange('paymentCashOnDelivery', !settings.paymentCashOnDelivery)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold text-xl">
                         $
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">الدفع عند الاستلام</h4>
                         <p className="text-sm text-gray-500">تمكين خيار الدفع نقداً عند استلام الطلب</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input type="checkbox" checked={settings.paymentCashOnDelivery} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                   </label>
                </div>
             </div>
          )}

          {activeTab === 'shipping' && (
             <div className="space-y-6 max-w-2xl">
                <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleChange('shippingLocal', !settings.shippingLocal)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                         <Truck className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">توصيل محلي</h4>
                         <p className="text-sm text-gray-500">توصيل داخل محافظات اليمن</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input type="checkbox" checked={settings.shippingLocal} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                   </label>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleChange('shippingInternational', !settings.shippingInternational)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                         <Globe className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">شحن دولي</h4>
                         <p className="text-sm text-gray-500">شحن لخارج اليمن</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input type="checkbox" checked={settings.shippingInternational} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                   </label>
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-gray-900 mb-2 mt-4">تكلفة الشحن الثابتة ({settings.currency})</label>
                   <input type="number" value={settings.shippingCost} onChange={(e) => handleChange('shippingCost', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-left" dir="ltr" />
                </div>
             </div>
          )}

          {activeTab === 'notifications' && (
             <div className="space-y-6 max-w-2xl">
                <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleChange('notificationEmail', !settings.notificationEmail)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                         <Bell className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">إشعارات البريد الإلكتروني</h4>
                         <p className="text-sm text-gray-500">إرسال تفاصيل الطلب وحالته عبر البريد للعميل</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input type="checkbox" checked={settings.notificationEmail} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                   </label>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleChange('notificationSMS', !settings.notificationSMS)}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center font-bold text-sm">
                         SMS
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900">إشعارات الرسائل النصية SMS</h4>
                         <p className="text-sm text-gray-500">تتطلب تفعيل خدمة مزود رسائل خارجي</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                      <input type="checkbox" checked={settings.notificationSMS} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                   </label>
                </div>
             </div>
          )}

          {activeTab === 'social' && (
             <div className="space-y-6 max-w-2xl">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
                   <div>
                      <h4 className="font-bold text-gray-900">روابط التواصل الاجتماعي</h4>
                      <p className="text-sm text-gray-500">أضف حسابات المتجر لتظهر للعملاء في أسفل الموقع</p>
                   </div>
                   <button 
                      onClick={() => {
                         const newLink = { id: Date.now().toString(), platform: 'whatsapp', url: 'https://', isActive: true };
                         handleChange('socialLinks', [...(settings.socialLinks || []), newLink]);
                      }}
                      className="flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 text-sm font-bold rounded-xl hover:bg-primary-200"
                   >
                      <Plus className="w-4 h-4" /> اضافة جديد
                   </button>
                </div>
                
                <div className="space-y-4">
                   {(settings.socialLinks || []).length === 0 ? (
                      <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                         لا توجد روابط مضافة حالياً.
                      </div>
                   ) : (
                      (settings.socialLinks || []).map((link, idx) => (
                         <div key={link.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 border border-gray-200 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                               <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                  <input 
                                     type="checkbox" 
                                     checked={link.isActive} 
                                     onChange={(e) => {
                                        const arr = [...settings.socialLinks];
                                        arr[idx].isActive = e.target.checked;
                                        handleChange('socialLinks', arr);
                                     }}
                                     className="sr-only peer" 
                                  />
                                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                               </label>
                               <select 
                                  value={link.platform}
                                  onChange={(e) => {
                                     const arr = [...settings.socialLinks];
                                     arr[idx].platform = e.target.value;
                                     handleChange('socialLinks', arr);
                                  }}
                                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                               >
                                  <option value="whatsapp">واتساب</option>
                                  <option value="facebook">فيسبوك</option>
                                  <option value="twitter">تويتر (X)</option>
                                  <option value="instagram">انستجرام</option>
                                  <option value="youtube">يوتيوب</option>
                                  <option value="snapchat">سناب شات</option>
                                  <option value="tiktok">تيك توك</option>
                                  <option value="telegram">تيليجرام</option>
                                  <option value="linkedin">لينكد إن</option>
                                  <option value="website">موقع إلكتروني</option>
                               </select>
                            </div>
                            <div className="flex-1 w-full">
                               <input 
                                  type="url" 
                                  value={link.url}
                                  onChange={(e) => {
                                     const arr = [...settings.socialLinks];
                                     arr[idx].url = e.target.value;
                                     handleChange('socialLinks', arr);
                                  }}
                                  placeholder="https://..."
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-left" 
                                  dir="ltr"
                               />
                            </div>
                            <button
                               onClick={() => {
                                  const arr = settings.socialLinks.filter((_, i) => i !== idx);
                                  handleChange('socialLinks', arr);
                               }}
                               className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            >
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                      ))
                   )}
                </div>
             </div>
          )}

          {activeTab === 'seo' && (
             <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">عنوان المتجر (Meta Title)</label>
                  <input type="text" value={settings.seoTitle} onChange={(e) => handleChange('seoTitle', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">وصف المتجر (Meta Description)</label>
                  <textarea value={settings.seoDescription} onChange={(e) => handleChange('seoDescription', e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">الكلمات المفتاحية (Meta Keywords)</label>
                  <input type="text" value={settings.seoKeywords} onChange={(e) => handleChange('seoKeywords', e.target.value)} placeholder="مثال: متجر, إلكترونيات, اليمن" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">فيڤيكون المتجر (Favicon) - مربع المقاس</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {settings.favicon ? (
                        <img src={settings.favicon} alt="Favicon" className="w-full h-full object-contain" />
                      ) : (
                        <Globe className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer px-4 py-2 rounded-xl transition-colors shrink-0">
                      {uploadingFavicon ? <Loader2 className="w-5 h-5 animate-spin text-gray-500 sm:ml-2" /> : <UploadCloud className="w-5 h-5 text-gray-500 sm:ml-2" />}
                      <span className="text-sm font-bold text-gray-700 hidden sm:inline">رفع أيقونة جديدة</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'favicon', 256, 256, setUploadingFavicon, true)} disabled={uploadingFavicon} />
                    </label>
                    {settings.favicon && (
                      <button onClick={() => handleChange('favicon', '')} className="text-red-500 text-sm font-bold hover:underline px-2">إزالة</button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">صورة المشاركة المفتوحة (OG Image) - مقاس 1200x630</label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {settings.ogImage ? (
                        <img src={settings.ogImage} alt="OG Image" className="w-full h-full object-cover" />
                      ) : (
                        <Globe className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer px-4 py-2 rounded-xl transition-colors shrink-0">
                      {uploadingOgImage ? <Loader2 className="w-5 h-5 animate-spin text-gray-500 sm:ml-2" /> : <UploadCloud className="w-5 h-5 text-gray-500 sm:ml-2" />}
                      <span className="text-sm font-bold text-gray-700 hidden sm:inline">رفع صورة للمشاركة</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'ogImage', 1200, 630, setUploadingOgImage, false)} disabled={uploadingOgImage} />
                    </label>
                    {settings.ogImage && (
                      <button onClick={() => handleChange('ogImage', '')} className="text-red-500 text-sm font-bold hover:underline px-2">إزالة</button>
                    )}
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
