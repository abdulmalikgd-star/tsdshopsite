import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, Send, Globe, Link as LinkIcon } from 'lucide-react';

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'facebook': return <Facebook className="w-5 h-5" />;
    case 'twitter': return <Twitter className="w-5 h-5" />;
    case 'instagram': return <Instagram className="w-5 h-5" />;
    case 'linkedin': return <Linkedin className="w-5 h-5" />;
    case 'youtube': return <Youtube className="w-5 h-5" />;
    case 'whatsapp': return <MessageCircle className="w-5 h-5" />;
    case 'telegram': return <Send className="w-5 h-5" />;
    case 'snapchat': return <span className="font-bold text-sm">Snap</span>;
    case 'tiktok': return <span className="font-bold text-sm">TikTok</span>;
    case 'website': return <Globe className="w-5 h-5" />;
    default: return <LinkIcon className="w-5 h-5" />;
  }
};

export default function Footer() {
  const { settings: storeSettings } = useSettings();

  useEffect(() => {
    if (storeSettings) {
      const data = storeSettings;
      let currData: any = { selected: 'YER', usdToYerOld: 533, sarToYerOld: 140 };
      try {
        const ls = localStorage.getItem('currencyData');
        if (ls) currData = JSON.parse(ls);
      } catch(e) {}
      
      let ratesChanged = false;
      if (data.usdToYerOld && currData.usdToYerOld !== data.usdToYerOld) {
         currData.usdToYerOld = data.usdToYerOld;
         ratesChanged = true;
      }
      if (data.sarToYerOld && currData.sarToYerOld !== data.sarToYerOld) {
         currData.sarToYerOld = data.sarToYerOld;
         ratesChanged = true;
      }
      if (ratesChanged) {
         localStorage.setItem('currencyData', JSON.stringify(currData));
      }
    }
  }, [storeSettings]);

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 px-4 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            {storeSettings?.storeLogo ? (
              <img 
                src={storeSettings.storeLogo} 
                alt={storeSettings.storeName || "Store Logo"} 
                className="object-contain"
                style={{ width: storeSettings.logoSize ? `${storeSettings.logoSize}px` : '150px' }}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-xl bg-primary-600 p-2">
                  <img 
                    src="/logo.png" 
                    alt={storeSettings?.storeName || "توفيق تك"} 
                    className="h-full w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{storeSettings?.storeName || 'توفيق تك'}</h3>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm whitespace-pre-line">
            {storeSettings?.aboutText || 'وجهتك الأولى لتسوق أفضل الأجهزة الذكية والإلكترونيات. نقدم لك منتجات أصلية 100% مع ضمان الجودة وسرعة التوصيل.'}
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            {storeSettings?.phone !== false && (
               <a href={`tel:${storeSettings?.phone || '920000000'}`} className="flex items-center gap-2 text-sm hover:text-primary-400 transition-colors">
                 <span className="text-primary-500">📞</span> {storeSettings?.phone || '920000000'}
               </a>
            )}
            {storeSettings?.email !== false && (
              <a href={`mailto:${storeSettings?.email || 'support@tawfiqtech.com'}`} className="flex items-center gap-2 text-sm hover:text-primary-400 transition-colors">
                <span className="text-primary-500">📧</span> {storeSettings?.email || 'support@tawfiqtech.com'}
              </a>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-6">روابط سريعة</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><Link to="/" className="hover:text-primary-400 transition-colors">الرئيسية</Link></li>
            <li><Link to="/products" className="hover:text-primary-400 transition-colors">كل المنتجات</Link></li>
            <li><Link to="/cart" className="hover:text-primary-400 transition-colors">سلة المشتريات</Link></li>
            <li><Link to="/profile" className="hover:text-primary-400 transition-colors">حسابي</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6">تواصل معنا</h4>
          {storeSettings?.socialLinks && storeSettings.socialLinks.filter(s => s.isActive).length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {storeSettings.socialLinks.filter(s => s.isActive).map(link => (
                <a 
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 hover:-translate-y-1 transition-all cursor-pointer text-gray-300 hover:text-white"
                  title={link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">لا توجد حسابات تواصل مضافة.</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
           <select className="bg-gray-800 text-gray-300 text-sm rounded-lg px-2 py-1 outline-none border-none cursor-pointer">
              <option>🇸🇦 العربية</option>
              <option>🇺🇸 English</option>
           </select>
           <select 
              className="bg-gray-800 text-gray-300 text-sm rounded-lg px-2 py-1 outline-none border-none cursor-pointer"
              onChange={(e) => {
                 let data: any = { selected: 'YER', usdToYerOld: 533, sarToYerOld: 140 };
                 try {
                   const curr = localStorage.getItem('currencyData');
                   if (curr) data = JSON.parse(curr);
                 } catch (err) {}
                 data.selected = e.target.value;
                 localStorage.setItem('currencyData', JSON.stringify(data));
                 window.dispatchEvent(new Event('currencyChanged'));
              }}
              defaultValue={(() => {
                 try {
                   const curr = localStorage.getItem('currencyData');
                   if (curr) return JSON.parse(curr).selected || 'YER';
                 } catch (err) {}
                 return 'YER';
              })()}
           >
              <option value="YER">YER الدفع بالريال اليمني (قديم)</option>
              <option value="SAR">SAR الدفع بالريال السعودي</option>
              <option value="USD">USD الدفع بالدولار الأمريكي</option>
           </select>
        </div>
        <div className="text-gray-500 text-sm text-center">
          &copy; {new Date().getFullYear()} {storeSettings?.storeName || 'توفيق تك'}. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
