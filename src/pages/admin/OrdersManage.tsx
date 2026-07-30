import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { Search, Filter, Eye, Truck, CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function OrdersManage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold ring-1 ring-yellow-200"><Clock className="h-3 w-3" /> <span>معلق</span></span>;
      case 'processing': return <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold ring-1 ring-blue-200"><Truck className="h-3 w-3" /> <span>قيد التنفيذ</span></span>;
      case 'shipped': return <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold ring-1 ring-purple-200"><Truck className="h-3 w-3" /> <span>تم الشحن</span></span>;
      case 'delivered': return <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold ring-1 ring-green-200"><CheckCircle2 className="h-3 w-3" /> <span>تم التوصيل</span></span>;
      case 'cancelled': return <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold ring-1 ring-red-200"><XCircle className="h-3 w-3" /> <span>ملغي</span></span>;
      default: return null;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.shippingDetails.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
        <p className="text-gray-500">تابع الطلبات وغير حالتها لتحديث العملاء.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-4 space-x-reverse">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="ابحث برقم الطلب أو اسم العميل..." 
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
                <th className="px-6 py-4 font-bold">رقم الطلب</th>
                <th className="px-6 py-4 font-bold">العميل</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
                <th className="px-6 py-4 font-bold">الإجمالي</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">لا توجد طلبات حالياً</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{order.shippingDetails.fullName}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {format(order.createdAt, 'd MMMM yyyy', { locale: ar })}
                  </td>
                  <td className="px-6 py-4 font-bold">{formatPrice(order.total)}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
                      >
                        <Eye className="h-5 w-5" />
                        <span className="text-sm font-bold">عرض</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <h3 className="text-xl font-bold">تفاصيل الطلب</h3>
                  <span className="text-sm font-mono text-gray-400">#{selectedOrder.id}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                   <ChevronDown className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {/* Info side */}
                   <div className="space-y-8">
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest">معلومات العميل</h4>
                        <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                           <p className="font-bold text-gray-900">{selectedOrder.shippingDetails.fullName}</p>
                           <p className="text-sm text-gray-600">{selectedOrder.shippingDetails.phone}</p>
                           <p className="text-sm text-gray-600">{selectedOrder.shippingDetails.address}، {selectedOrder.shippingDetails.city}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest">معلومات الدفع</h4>
                        <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                           <p className="font-bold text-gray-900">
                              دفع {selectedOrder.paymentMethod === 'transfer' ? 'بواسطة حوالة بنكية / إيداع' : 'نقداً عند الاستلام'}
                           </p>
                           {selectedOrder.paymentMethod === 'transfer' && selectedOrder.transferReceipt && (
                              <div className="mt-4">
                                 <p className="text-sm font-bold text-gray-600 mb-2">إشعار التحويل:</p>
                                 <a href={selectedOrder.transferReceipt} target="_blank" rel="noopener noreferrer" className="block max-w-xs border border-gray-200 rounded-xl overflow-hidden hover:opacity-80 transition-opacity">
                                    <img src={selectedOrder.transferReceipt} alt="إشعار التحويل" className="w-full h-auto object-contain" />
                                 </a>
                              </div>
                           )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest">تحديث الحالة</h4>
                        <div className="grid grid-cols-2 gap-2">
                           {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                             <button
                               key={status}
                               onClick={() => handleUpdateStatus(selectedOrder.id, status as Order['status'])}
                               className={cn(
                                 "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                 selectedOrder.status === status 
                                   ? "bg-primary-600 text-white border-primary-600 shadow-md" 
                                   : "bg-white text-gray-600 border-gray-200 hover:border-primary-400"
                               )}
                             >
                               {status === 'pending' ? 'معلق' : status === 'processing' ? 'قيد التنفيذ' : status === 'shipped' ? 'تم الشحن' : status === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                             </button>
                           ))}
                        </div>
                      </div>
                   </div>

                   {/* Items side */}
                   <div className="space-y-4">
                      <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest">المنتجات</h4>
                      <div className="space-y-3">
                         {selectedOrder.items.map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl">
                             <div className="h-16 w-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                               <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-grow">
                               <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                               <p className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.discountPrice || item.price)}</p>
                             </div>
                             <p className="font-bold text-sm">{formatPrice((item.discountPrice || item.price) * item.quantity)}</p>
                           </div>
                         ))}
                      </div>
                      <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                         <p className="text-gray-500 font-bold">الإجمالي المعتمد:</p>
                         <p className="text-2xl font-bold text-primary-600">{formatPrice(selectedOrder.total)}</p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
