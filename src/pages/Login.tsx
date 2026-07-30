import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile,
  sendEmailVerification,
  signOut,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Rocket, Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد (أو مجلد البريد غير المرغوب فيه/الرسائل المزعجة).');
        setIsForgotPassword(false);
        setPassword('');
      } else if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        let requireVerification = !userCredential.user.emailVerified;
        
        // If they are not verified, check if they were created by an admin
        if (requireVerification) {
           try {
             const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
             if (userDoc.exists() && (userDoc.data().createdByAdmin === true || userDoc.data().role === 'admin')) {
                requireVerification = false;
             }
           } catch (e) {
             console.error("Could not fetch user role", e);
           }
        }

        if (requireVerification) {
          await signOut(auth);
          setError('يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.');
          setLoading(false);
          return;
        }
        navigate('/');
      } else {
        // Check if email already exists in Firestore to prevent duplicate accounts for different providers
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setError('هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول وإذا نسيت كلمة المرور استخدم استعادة كلمة المرور، أو سجل دخولك باستخدام جوجل.');
          setLoading(false);
          return;
        }

        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });
        await sendEmailVerification(user);
        await signOut(auth);
        setSuccessMsg('تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب (يرجى التحقق أيضاً من مجلد البريد غير المرغوب فيه/الرسائل المزعجة).');
        setIsLogin(true);
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
         setError('البريد الإلكتروني مستخدم بالفعل.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
         setError(err.message || 'حدث خطأ ما، يرجى المحاولة لاحقاً');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const email = user.email || user.providerData?.[0]?.email || '';
      
      if (email) {
         // Check if this email exists under a different UID in Firestore
         const q = query(collection(db, 'users'), where('email', '==', email));
         const querySnapshot = await getDocs(q);
         
         if (!querySnapshot.empty) {
            const differentAccount = querySnapshot.docs.find(doc => doc.id !== user.uid);
            if (differentAccount) {
               await signOut(auth);
               setError('هذا البريد الإلكتروني مسجل بحساب آخر. يرجى تسجيل الدخول بالطريقة السابقة.');
               return;
            }
         }
      }

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('هذا البريد الإلكتروني مسجل بالفعل بطريقة تسجيل دخول مختلفة.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-primary-600 rounded-2xl shadow-lg shadow-primary-200 mb-4">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {isForgotPassword ? 'استعادة كلمة المرور' : isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-gray-500">
              {isForgotPassword ? 'أدخل بريدك الإلكتروني لتلقي رابط الاستعادة' : isLogin ? 'سجل دخولك للوصول إلى طلباتك وسلة مشترياتك' : 'انضم إلينا واستمتع بأفضل العروض التقنية'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="relative">
                <UserIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type="text" 
                  placeholder="الاسم الكامل"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input 
                type="email" 
                placeholder="البريد الإلكتروني"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
              />
            </div>
            
            {!isForgotPassword && (
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input 
                  type="password" 
                  placeholder="كلمة المرور"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                />
              </div>
            )}
            
            {isLogin && !isForgotPassword && (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-sm font-bold text-primary-600 hover:text-primary-700"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            {error && <p className="text-red-600 text-sm font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}
            {successMsg && <p className="text-green-600 text-sm font-bold text-center bg-green-50 p-3 rounded-xl flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/>{successMsg}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center p-4"
            >
              {loading ? (
                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? 'إرسال الرابط' : isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                  {!isForgotPassword && <ArrowLeft className="mr-2 h-5 w-5" />}
                </>
              )}
            </button>
            
            {isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-center text-gray-500 font-bold hover:text-primary-600"
              >
                العودة لتسجيل الدخول
              </button>
            )}
          </form>

          {!isForgotPassword && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">أو عبر</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-medium"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                  <span>المتابعة باستخدام جوجل</span>
                </button>
              </div>

              <p className="text-center text-gray-500">
                {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary-600 font-bold hover:underline"
                >
                  {isLogin ? 'أنشئ حساباً' : 'سجل دخولك'}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
