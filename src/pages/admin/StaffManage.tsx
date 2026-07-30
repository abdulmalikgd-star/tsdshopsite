import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit2, Trash2, Loader2, Key } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function StaffManage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Manager', permissions: [] as string[] });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'staff'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      setStaffList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'staff'), { ...newStaff, createdAt: Date.now() });
      setIsAdding(false);
      setNewStaff({ name: '', email: '', role: 'Manager', permissions: [] });
      fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      await deleteDoc(doc(db, 'staff', id));
      fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const permissionOptions = [
    { value: 'all', label: 'كامل الصلاحيات' },
    { value: 'orders', label: 'الطلبات' },
    { value: 'products', label: 'المنتجات' },
    { value: 'users', label: 'العملاء' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الموظفين والصلاحيات</h1>
          <p className="text-gray-500">أضف موظفين جدد وحدد صلاحياتهم في لوحة التحكم.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
        >
          <Plus className="h-5 w-5" />
          <span>إضافة موظف</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-2">موظف جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required type="text" placeholder="اسم الموظف" value={newStaff.name} 
              onChange={e => setNewStaff({...newStaff, name: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input 
              required type="email" placeholder="البريد الإلكتروني" value={newStaff.email} 
              onChange={e => setNewStaff({...newStaff, email: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none text-left" dir="ltr"
            />
            <select 
              value={newStaff.role}
              onChange={e => setNewStaff({...newStaff, role: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="Super Admin">مدير نظام (Super Admin)</option>
              <option value="Manager">مدير (Manager)</option>
              <option value="Support">دعم فني (Support)</option>
            </select>
            
            <div className="border border-gray-200 rounded-xl px-4 py-2">
              <span className="text-sm text-gray-500 block mb-2 font-bold">الصلاحيات:</span>
              <div className="flex flex-wrap gap-2">
                {permissionOptions.map(opt => (
                   <label key={opt.value} className="flex items-center space-x-2 space-x-reverse text-sm">
                      <input 
                        type="checkbox" 
                        checked={newStaff.permissions.includes(opt.value)}
                        onChange={(e) => {
                           if(e.target.checked) {
                             setNewStaff({...newStaff, permissions: [...newStaff.permissions, opt.value]});
                           } else {
                             setNewStaff({...newStaff, permissions: newStaff.permissions.filter(p => p !== opt.value)});
                           }
                        }}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span>{opt.label}</span>
                   </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-bold">إلغاء</button>
            <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700">حفظ الموظف</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/50 text-gray-500 text-sm font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">اسم الموظف</th>
                <th className="px-6 py-4">الدور (Role)</th>
                <th className="px-6 py-4">الصلاحيات</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-600" />
                      جاري التحميل...
                    </td>
                 </tr>
              ) : staffList.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-bold">
                       لا يوجد موظفين حالياً.
                    </td>
                 </tr>
              ) : staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="mr-4">
                        <div className="font-bold text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-500">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      staff.role === 'Super Admin' ? 'bg-red-100 text-red-800' : 
                      staff.role === 'Manager' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.map(perm => (
                         <span key={perm} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">
                           {perm === 'all' ? 'كامل الصلاحيات' : perm === 'orders' ? 'الطلبات' : perm === 'products' ? 'المنتجات' : perm === 'users' ? 'العملاء' : perm}
                         </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(staff.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
}
