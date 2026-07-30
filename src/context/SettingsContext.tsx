import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StoreSettings {
  storeName?: string;
  storeLogo?: string;
  logoSize?: number;
  email?: string;
  phone?: string;
  aboutText?: string;
  currency?: string;
  usdToYerOld?: number;
  sarToYerOld?: number;
  paymentCreditCard?: boolean;
  paymentCashOnDelivery?: boolean;
  shippingLocal?: boolean;
  shippingInternational?: boolean;
  shippingCost?: number;
  notificationEmail?: boolean;
  notificationSMS?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  favicon?: string;
  ogImage?: string;
  socialLinks?: { id: string; platform: string; url: string; isActive: boolean }[];
}

interface SettingsContextType {
  settings: StoreSettings | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as StoreSettings);
        } else {
          setSettings({});
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        setSettings({});
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
