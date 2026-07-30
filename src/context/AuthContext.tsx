import React, { createContext, useContext, useEffect, useState, ReactNode, FC } from 'react';
import { 
  onAuthStateChanged, 
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            let data = docSnap.data() as UserProfile;
            let needsUpdate = false;
            
            // Backwards compatibility: add email/name if missing
            const fallbackEmail = user.email || user.providerData?.[0]?.email || '';
            const fallbackName = user.displayName || fallbackEmail.split('@')[0] || '';
            
            if (!data.email && fallbackEmail) {
              data.email = fallbackEmail;
              needsUpdate = true;
            }
            if (!data.displayName && fallbackName) {
              data.displayName = fallbackName;
              needsUpdate = true;
            }

            // Check if this is the target admin email and they don't have admin role
            if (fallbackEmail === 'abdulmalikgd@gmail.com' && data.role !== 'admin') {
              data = { ...data, role: 'admin' as const };
              needsUpdate = true;
            }

            if (needsUpdate) {
              await setDoc(docRef, data, { merge: true });
            }
            
            setProfile(data);
          } else {
            // Check if this is the target admin email
            const isAdminEmail = user.email === 'abdulmalikgd@gmail.com';
            
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || user.providerData?.[0]?.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || user.providerData?.[0]?.email?.split('@')[0] || '',
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: Date.now(),
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback if firestore fails
          const isAdminEmail = user.email === 'abdulmalikgd@gmail.com';
          setProfile({
            uid: user.uid,
            email: user.email || user.providerData?.[0]?.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || user.providerData?.[0]?.email?.split('@')[0] || '',
            role: isAdminEmail ? 'admin' : 'user',
            createdAt: Date.now(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';
  const isStaff = profile?.role === 'staff';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isStaff, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
