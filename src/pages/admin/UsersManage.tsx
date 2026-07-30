import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  query,
  orderBy,
  setDoc,
  getFirestore
} from 'firebase/firestore';
import { db, firebaseConfig } from '../../lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserProfile } from '../../types';
import { Shield, User, Search, Mail, Calendar, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function UsersManage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'staff'>('user');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (user: UserProfile, newRole: string) => {
    if (!window.confirm(`هل أنت متأكد من تغيير صلاحية ${user.displayName || user.email} إلى ${newRole}؟`)) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    setIsAdding(true);
    setAddError('');

    try {
      // Create a secondary Firebase app to avoid logging out the current admin
      const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      
      // Save user to Firestore using the secondary db (since the new user is authenticated there)
      await setDoc(doc(secondaryDb, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: newRole,
        createdByAdmin: true,
        createdAt: Date.now(),
      });

      // Cleanup secondary app auth
      await secondaryAuth.signOut();
      
      setShowAddUser(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      setAddError(error.message || 'حدث خطأ أثناء إضافة المستخدم');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-500">عرض مستخدمي المتجر وتعديل صلاحياتهم.</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 space-x-reverse font-bold transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">إضافة مستخدم جديد</h2>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {addError && (
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-xl">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4 text-right">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الصلاحية</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'user' | 'admin' | 'staff')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="user">مستخدم عادي</option>
                  <option value="staff">موظف (منتجات فقط)</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
              <div className="flex space-x-3 space-x-reverse pt-4">
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="flex-1 bg-primary-600 text-white font-bold py-2 rounded-xl border border-transparent shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isAdding ? 'جاري الإضافة...' : 'إضافة'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-white text-gray-700 font-bold py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-4 space-x-reverse">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو البريد..." 
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
                <th className="px-6 py-4 font-bold">المستخدم</th>
                <th className="px-6 py-4 font-bold">التواصل</th>
                <th className="px-6 py-4 font-bold">تاريخ الانضمام</th>
                <th className="px-6 py-4 font-bold">الصلاحية</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-10 text-center">جاري التحميل...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">لا يوجد مستخدمين حالياً</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                        {user.displayName?.[0] || user.email?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.displayName || 'مستخدم بلا اسم'}</p>
                        <p className="text-xs text-gray-400">{user.uid.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                       <Mail className="h-4 w-4 ml-2" />
                       {user.email || 'البريد غير متوفر'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div className="flex items-center">
                       <Calendar className="h-4 w-4 ml-2" />
                       {format(user.createdAt, 'd MMMM yyyy', { locale: ar })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-bold ring-1 ring-primary-200 w-fit">
                        <Shield className="h-3 w-3" />
                        <span>مدير</span>
                      </span>
                    ) : user.role === 'staff' ? (
                      <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold ring-1 ring-blue-200 w-fit">
                        <User className="h-3 w-3" />
                        <span>موظف</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-bold ring-1 ring-gray-200 w-fit">
                        <User className="h-3 w-3" />
                        <span>مستخدم</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                        <select 
                          value={user.role || 'user'}
                          onChange={(e) => handleChangeRole(user, e.target.value)}
                          className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="user">مستخدم عادي</option>
                          <option value="staff">موظف</option>
                          <option value="admin">مدير</option>
                        </select>
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
