import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { MapPin, Phone, User, CreditCard, CheckCircle, UploadCloud, Loader2 } from 'lucide-react';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [transferReceipt, setTransferReceipt] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxWidth = 800;
        const maxHeight = 800;

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
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setTransferReceipt(dataUrl);
        } else {
          setTransferReceipt(event.target?.result as string);
        }
        
        setUploadingReceipt(false);
        e.target.value = '';
      };
      img.onerror = () => {
        alert("حدث خطأ أثناء معالجة الصورة");
        setUploadingReceipt(false);
        e.target.value = '';
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الملف");
      setUploadingReceipt(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!/^7[0-9]{8}$/.test(phone)) {
      setErrorMsg('يجب أن يتكون رقم الجوال من 9 أرقام ويبدأ بالرقم 7');
      return;
    }
    
    if (paymentMethod === 'transfer' && !transferReceipt) {
      setErrorMsg('يجب إرفاق صورة إشعار التحويل');
      return;
    }
    
    setErrorMsg('');

    setLoading(true);

    const orderData = {
      userId: user ? user.uid : 'guest',
      items,
      total: totalPrice,
      status: 'pending',
      shippingDetails: {
        fullName,
        phone,
        address,
        city
      },
      paymentMethod,
      transferReceipt: paymentMethod === 'transfer' ? transferReceipt : null,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      setSuccess(true);
      clearCart();
      setTimeout(() => navigate(user ? '/profile' : '/'), 3000);
    } catch (error) {
      console.error("Error creating order:", error);
      alert('حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-green-50 rounded-full"
        >
          <CheckCircle className="h-20 w-20 text-green-500" />
        </motion.div>
        <h2 className="text-4xl font-bold text-gray-900">تم استلام طلبك بنجاح!</h2>
        <p className="text-gray-500 text-lg max-w-md">شكراً لتسوقك معنا. سيتم التواصل معك قريباً لتأكيد الشحن.</p>
        <p className="text-sm font-bold text-primary-600">
          {user ? 'سيتم توجيهك لصفحة طلباتي خلال لحظات...' : 'سيتم توجيهك للصفحة الرئيسية خلال لحظات...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-10 text-center md:text-right">إتمام الطلب</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Shipping Form */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <MapPin className="ml-2 h-5 w-5 text-primary-600" />
              بيانات الشحن
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسمك الثلاثي"
                    className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input 
                    required 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="7xxxxxxxx"
                    maxLength={9}
                    className="w-full pr-12 pl-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-left"
                    dir="ltr"
                  />
                </div>
                {errorMsg && <p className="text-red-500 text-sm font-bold mt-1">{errorMsg}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">المدينة</label>
                <input 
                  required 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">العنوان بالتفصيل</label>
                <input 
                  required 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <CreditCard className="ml-2 h-5 w-5 text-primary-600" />
              طريقة الدفع
            </h3>
            <div className="space-y-4">
              <button 
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between transition-colors ${paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
              >
                 <div className="flex items-center">
                    <div className={`p-2 rounded-xl border ${paymentMethod === 'cod' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'} ml-4 transition-colors`}>
                       <CreditCard className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-lg">الدفع نقدًا عند الاستلام</span>
                 </div>
                 <div className={`h-6 w-6 rounded-full border-4 flex items-center justify-center transition-colors ${paymentMethod === 'cod' ? 'border-primary-600 bg-white' : 'border-gray-300 bg-transparent'}`} />
              </button>

              <div className="flex flex-col">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between transition-colors ${paymentMethod === 'transfer' ? 'border-primary-600 bg-primary-50/50 rounded-b-none border-b-0' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                >
                   <div className="flex items-center">
                      <div className={`p-2 rounded-xl border ${paymentMethod === 'transfer' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-400'} ml-4 transition-colors`}>
                         <CheckCircle className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-lg text-right">ايداع لمحفظة الكترونية أو حوالة للشبكات المحلية</span>
                   </div>
                   <div className={`h-6 w-6 shrink-0 rounded-full border-4 flex items-center justify-center transition-colors ${paymentMethod === 'transfer' ? 'border-primary-600 bg-white' : 'border-gray-300 bg-transparent'}`} />
                </button>
                {paymentMethod === 'transfer' && (
                  <div className="p-6 border-2 border-t-0 border-primary-600 bg-white rounded-b-2xl">
                    <p className="text-gray-700 text-[15px] leading-relaxed mb-4 font-medium">
                      يمكنكم إيداع المبلغ عبر اي محفظة إلكترونية أو تحويل حوالة عبر الشبكات المحلية الى حساب .
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-center">
                      <div className="text-lg text-red-600 font-bold mb-1">الإسم / توفيق سعد عبدالله الجبجبي</div>
                      <div className="text-lg text-red-600 font-bold mb-2">الرقم / 777707559</div>
                      <div className="text-gray-700 font-bold text-sm">ثم ارفاق صورة الإشعار هنا.</div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <span className="font-bold text-gray-700">رفع صورة اشعار التحويل او الإيداع</span>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleReceiptUpload} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingReceipt}
                        />
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 w-24 h-24 bg-white hover:bg-gray-50 rounded-xl">
                          {uploadingReceipt ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                          ) : transferReceipt ? (
                            <img src={transferReceipt} alt="Receipt" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-red-500 font-bold text-sm">رفع صورة</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary side */}
        <div>
          <div className="bg-gray-50 rounded-3xl p-8 space-y-6 sticky top-24 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">ملخص الطلب</h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.discountPrice || item.price)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">{formatPrice((item.discountPrice || item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 mt-6 border-t border-gray-200">
               <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي النهائي</span>
                  <span className="text-primary-600">{formatPrice(totalPrice)}</span>
               </div>
               <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all p-4 flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? 'جاري المعالجة...' : 'تأكيد الطلب وشحن البيانات'}
               </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
