import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyBeforeUpdateEmail, updateProfile, AuthError } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { formatPrice } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User, Package, Settings, LogOut, ChevronLeft, Box, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserOrders();
      setDisplayName(profile?.displayName || '');
      setEmail(profile?.email || user?.email || '');
    }
  }, [user, profile]);

  const fetchUserOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort on client side to avoid needing a composite index
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(fetched);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'shipped': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'processing': return 'جاري التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const handleUpdateSettings = async () => {
    if (!user) return;
    setSettingsLoading(true);
    setSettingsSuccess('');
    setSettingsError('');

    try {
      let updated = false;
      let emailVerifying = false;

      // Update Display Name
      if (displayName !== profile?.displayName) {
        await updateProfile(user, { displayName });
        await updateDoc(doc(db, 'users', user.uid), { displayName });
        updated = true;
      }

      // Update Email
      if (email !== user.email && email !== profile?.email && email.trim() !== '') {
        try {
          await verifyBeforeUpdateEmail(user, email);
          emailVerifying = true;
        } catch (err: any) {
          if (err.code === 'auth/requires-recent-login') {
            throw new Error('لتغيير البريد الإلكتروني، يرجى تسجيل الخروج والدخول مجدداً ثم المحاولة.');
          } else {
            throw err;
          }
        }
      }

      if (emailVerifying) {
        setSettingsSuccess('تم حفظ الاسم (إن وجد). يرجى التحقق من بريدك الإلكتروني الجديد لتأكيد تغييره (يرجى مراجعة مجلد البريد غير المرغوب فيه/الرسائل المزعجة في حال عدم وصوله).');
      } else if (updated) {
        setSettingsSuccess('تم تحديث البيانات بنجاح.');
      }
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.message || 'حدث خطأ أثناء حفظ التغييرات.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-80 space-y-8">
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
              <div className="h-24 w-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                {profile?.displayName?.[0] || user?.email?.[0] || '?'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.displayName || 'مستخدم جديد'}</h2>
              <p className="text-gray-500 text-sm mt-1">{profile?.email || user?.email || 'لا يوجد بريد'}</p>
              <div className="mt-4 inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-bold ring-1 ring-primary-100">
                {profile?.role === 'admin' ? 'مدير المتجر' : profile?.role === 'staff' ? 'موظف' : 'عميل مميز'}
              </div>
           </div>

           <nav className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn("w-full flex items-center space-x-3 space-x-reverse px-4 py-4 rounded-2xl font-bold transition-all", activeTab === 'orders' ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-gray-500 hover:bg-gray-50")}
              >
                <Package className="h-5 w-5" />
                <span>طلباتي السابقة</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn("w-full flex items-center space-x-3 space-x-reverse px-4 py-4 rounded-2xl font-bold transition-all", activeTab === 'settings' ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-gray-500 hover:bg-gray-50")}
              >
                <Settings className="h-5 w-5" />
                <span>إعدادات الحساب</span>
              </button>
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center space-x-3 space-x-reverse px-4 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span>تسجيل الخروج</span>
              </button>
           </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'orders' ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">سجل الطلبات</h3>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <Loader2 className="h-10 w-10 animate-spin mb-2" />
                   <span>جاري جلب طلباتك...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 space-y-6">
                   <div className="mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <Box className="h-10 w-10" />
                   </div>
                   <h4 className="text-xl font-bold text-gray-900">لا توجد طلبات بعد</h4>
                   <p className="text-gray-500 max-w-xs mx-auto">عندما تقوم بالشراء من المتجر، ستظهر طلباتك هنا لتتمكن من متابعتها.</p>
                </div>
              ) : (
                <div className="space-y-6">
                   {orders.map((order) => (
                     <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 transition-all hover:shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                           <div className="flex items-center space-x-3 space-x-reverse">
                              <span className="font-mono text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</span>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-xs text-gray-500">{format(order.createdAt, 'd MMMM yyyy', { locale: ar })}</span>
                           </div>
                           <div className={cn("px-4 py-1 rounded-full text-xs font-bold ring-1", getStatusColor(order.status))}>
                              {getStatusText(order.status)}
                           </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-b border-gray-50 py-6 overflow-x-auto no-scrollbar">
                           {order.items.map((item, idx) => (
                             <div key={idx} className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                               <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                             </div>
                           ))}
                        </div>

                        <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl">
                           <div>
                              <p className="text-xs text-gray-400">إجمالي الطلب</p>
                              <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                           </div>
                           <button className="flex items-center text-primary-600 font-bold text-sm hover:underline">
                              التفاصيل
                              <ChevronLeft className="mr-1 h-4 w-4" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm space-y-10">
               <h3 className="text-2xl font-bold text-gray-900">إعدادات الحساب</h3>
               <div className="space-y-6 max-w-lg">
                  {settingsSuccess && <div className="p-4 bg-green-50 text-green-600 rounded-2xl font-bold text-sm">{settingsSuccess}</div>}
                  {settingsError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm">{settingsError}</div>}
                  
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-700">الاسم الظاهر</label>
                     <input 
                       value={displayName}
                       onChange={(e) => setDisplayName(e.target.value)}
                       className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                     <input 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                     />
                     <p className="text-xs text-gray-500 mt-1">إذا قمت بتغيير البريد الإلكتروني، سيتم إرسال رابط تأكيد إلى البريد الجديد، ولن يتم اعتماده إلا بعد فتح الرابط.</p>
                  </div>
                  <button 
                    onClick={handleUpdateSettings}
                    disabled={settingsLoading}
                    className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg w-full sm:w-auto flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {settingsLoading ? <Loader2 className="animate-spin h-5 w-5 ml-2" /> : null}
                     حفظ التغييرات
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
