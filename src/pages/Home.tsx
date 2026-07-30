import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Box, ArrowLeft, Star, Quote, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Product, CATEGORIES } from '../types';
import ProductCard from '../components/ProductCard';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Same ThemeSection interface as in ThemeManage
interface ThemeSection {
  id: string;
  type: 'hero' | 'categories' | 'products_row' | 'promotional_banner' | 'announcement' | 'reviews';
  title?: string;
  subtitle?: string;
  categoryId?: string;
  link?: string;
  ctaText?: string;
  imageUrl?: string;
  bgColor?: string;
  isActive: boolean;
}

const DEFAULT_SECTIONS: ThemeSection[] = [
  { id: 'hero-1', type: 'hero', isActive: true },
  { id: 'cat-1', type: 'categories', isActive: true },
  { id: 'prod-latest', type: 'products_row', title: 'أحدث المنتجات', categoryId: 'latest', isActive: true },
  { id: 'promo-1', type: 'promotional_banner', title: 'سماعات لاسلكية حديثة بخصم 40%', subtitle: 'لا تفوت فرصة الحصول على تجربة صوتية فريدة بأسعار لاتقبل المنافسة. العرض ساري حتى نفاذ الكمية.', ctaText: 'اطلب الآن', link: '/products', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', isActive: true },
  { id: 'prod-best', type: 'products_row', title: 'الأكثر مبيعاً', categoryId: 'best_sellers', isActive: true },
  { id: 'rev-1', type: 'reviews', isActive: true }
];

export default function Home() {
  const [sections, setSections] = useState<ThemeSection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data states for all possible sections
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<{name: string; imageUrl?: string}[]>([]);
  const [productsData, setProductsData] = useState<Record<string, Product[]>>({});
  const [reviews, setReviews] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch layout
      let layout: ThemeSection[] = DEFAULT_SECTIONS;
      const themeSnap = await getDoc(doc(db, 'settings', 'theme'));
      if (themeSnap.exists() && themeSnap.data().sections) {
        layout = themeSnap.data().sections;
      }
      setSections(layout);

      const activeSections = layout.filter(s => s.isActive);

      // 2. Load Hero Offers if needed
      if (activeSections.some(s => s.type === 'hero')) {
        const offersQ = query(collection(db, 'offers'));
        const offersSnap = await getDocs(offersQ);
        const activeOffers = offersSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter((o: any) => o.isActive !== false)
          .map((o: any) => ({
            title: o.title,
            description: o.description,
            image: o.imageUrl,
            ctaText: 'تسوق الآن',
            ctaLink: o.link || '/products'
          }));
        
        if (activeOffers.length > 0) {
          setHeroSlides(activeOffers);
        } else {
          // fallback default hero
          setHeroSlides([
            {
              title: 'بدء التسوق',
              description: 'أفضل المنتجات تجدها هنا',
              image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2000',
              ctaText: 'استعرض المنتجات',
              ctaLink: '/products'
            }
          ]);
        }
      }

      // 3. Load Categories if needed
      if (activeSections.some(s => s.type === 'categories' || s.type === 'products_row')) {
        const catQ = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const catSnapshot = await getDocs(catQ);
        const fetchedCats = catSnapshot.docs.map(doc => ({
          name: doc.data().name,
          imageUrl: doc.data().imageUrl
        }));
        setDbCategories(fetchedCats.length > 0 ? fetchedCats : CATEGORIES.map(name => ({name})));
      }

      // 4. Load Products for 'products_row'
      const rows = activeSections.filter(s => s.type === 'products_row');
      const pData: Record<string, Product[]> = {};
      for (const row of rows) {
        if (!row.categoryId) continue;
        if (row.categoryId === 'latest') {
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(10));
          const snap = await getDocs(q);
          pData[row.id] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        } else if (row.categoryId === 'best_sellers') {
           // mock best sellers by reversing limit query
           const q = query(collection(db, 'products'), limit(8));
           const snap = await getDocs(q);
           pData[row.id] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)).reverse();
        } else {
           // specific category
           const q = query(collection(db, 'products'), where('category', '==', row.categoryId), limit(8));
           const snap = await getDocs(q);
           pData[row.id] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        }
      }
      setProductsData(pData);

      // 5. Load Reviews if needed
      if (activeSections.some(s => s.type === 'reviews')) {
        const revQ = query(collection(db, 'reviews'));
        const revSnap = await getDocs(revQ);
        const revs = revSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(r => r.isActive !== false);
        setReviews(revs);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  const activeSections = sections.filter(s => s.isActive);

  return (
    <div className="pb-20 overflow-x-hidden">
      {activeSections.map((section, idx) => {
        const isFirst = idx === 0;
        const isAnnouncement = section.type === 'announcement';
        const isPrevAnnouncement = idx > 0 && activeSections[idx - 1].type === 'announcement';
        
        // Compute manual margin top
        let topMarginClass = '';
        if (!isFirst && !isAnnouncement && !isPrevAnnouncement) {
          topMarginClass = 'mt-16';
        }
        
        switch (section.type) {
          case 'announcement':
            return (
              <div key={section.id} className={`${section.bgColor || 'bg-primary-600'} text-white overflow-hidden flex items-center h-8 ${topMarginClass}`} dir="ltr">
                <div className="w-full">
                  <div className="marquee-rtl font-bold px-4 whitespace-nowrap text-sm sm:text-base">
                    {section.link ? (
                      <Link to={section.link} className="hover:underline" dir="rtl">{section.title}</Link>
                    ) : (
                      <span dir="rtl">{section.title}</span>
                    )}
                  </div>
                </div>
              </div>
            );

          case 'hero':
            return (
              <section key={section.id} className={`relative h-[600px] w-full bg-gray-900 group ${topMarginClass} z-0`}>
                <Swiper
                  modules={[Navigation, Pagination, Autoplay, EffectFade]}
                  effect="fade"
                  navigation={{ nextEl: '.swiper-next-btn', prevEl: '.swiper-prev-btn' }}
                  pagination={{ clickable: true, el: '.swiper-pagination-custom' }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  className="w-full h-full"
                >
                  {heroSlides.map((slide, sIdx) => (
                    <SwiperSlide key={sIdx} className="relative w-full h-full">
                       <div className="absolute inset-0">
                        <img 
                          src={slide.image} 
                          alt={slide.title}
                          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent" />
                      </div>
                      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8 }}
                          className="max-w-xl text-white space-y-6"
                        >
                          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white mb-2">{slide.title}</h1>
                          <p className="text-xl text-gray-200 leading-relaxed font-light">{slide.description}</p>
                          <div className="pt-4">
                            <Link to={slide.ctaLink} className="bg-primary-600 text-white px-8 py-4 rounded-full font-bold hover:bg-primary-500 transition-all inline-flex items-center shadow-lg shadow-primary-500/30 transform hover:-translate-y-1">
                              {slide.ctaText}
                              <ArrowLeft className="mr-2 h-5 w-5" />
                            </Link>
                          </div>
                        </motion.div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button className="swiper-prev-btn absolute top-1/2 right-4 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
                   <ChevronRight className="w-6 h-6" />
                </button>
                <button className="swiper-next-btn absolute top-1/2 left-4 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
                   <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="swiper-pagination-custom absolute bottom-6 w-full flex justify-center z-10 gap-2" />
              </section>
            );

          case 'categories':
            return (
              <section key={section.id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${topMarginClass}`}>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                  {(dbCategories.length > 0 ? dbCategories : CATEGORIES.map(name => ({name}))).map((cat, sIdx) => (
                    <Link 
                      key={sIdx} 
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="group text-center flex flex-col items-center w-[100px]"
                    >
                      <div className="w-[100px] h-[100px] rounded-3xl overflow-hidden bg-gray-50 mb-3 border border-gray-100 shadow-sm group-hover:shadow-md transition-all relative shrink-0">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100/50">
                             <Box className="h-8 w-8 text-gray-400 group-hover:text-primary-600 transition-colors" />
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors text-sm whitespace-nowrap">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );

          case 'products_row':
            const prods = productsData[section.id] || [];
            if (prods.length === 0) return null;
            return (
              <section key={section.id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${topMarginClass}`}>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-8 bg-primary-600 rounded-full inline-block"></span>
                      {section.title}
                    </h2>
                  </div>
                  <Link to={section.categoryId && section.categoryId !== 'latest' && section.categoryId !== 'best_sellers' ? `/products?category=${encodeURIComponent(section.categoryId)}` : '/products'} className="text-primary-600 font-medium hover:underline flex items-center text-sm">
                    عرض الكل
                    <ArrowLeft className="mr-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {prods.slice(0, 8).map((product, pIdx) => (
                    <ProductCard key={product.id} product={product} idx={pIdx} />
                  ))}
                </div>
              </section>
            );

          case 'promotional_banner':
            return (
              <section key={section.id} className={`bg-primary-50 py-16 px-4 overflow-hidden relative ${topMarginClass || 'my-10'}`}>
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
                
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                  <div className="flex-1 space-y-6 md:pr-10">
                    <span className="inline-block px-4 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold uppercase tracking-wider">عرض خاص</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{section.title}</h2>
                    <p className="text-gray-600 text-lg leading-relaxed">{section.subtitle}</p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      {section.link && (
                        <Link to={section.link} className="bg-primary-600 text-white px-8 py-4 rounded-full font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 transform hover:-translate-y-1">
                          {section.ctaText || 'تسوق الآن'}
                        </Link>
                      )}
                    </div>
                  </div>
                  {section.imageUrl && (
                    <div className="flex-1 w-full max-w-md relative">
                       <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full transform scale-110"></div>
                       <img 
                         src={section.imageUrl} 
                         alt={section.title} 
                         className="rounded-3xl shadow-2xl relative z-10 rotate-3 hover:rotate-0 transition-transform duration-700 border-4 border-white"
                       />
                    </div>
                  )}
                </div>
              </section>
            );

          case 'reviews':
            if (reviews.length === 0) return null;
            return (
              <section key={section.id} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${topMarginClass}`}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">آراء عملائنا</h2>
                  <p className="text-gray-500">نفخر بثقة الآلاف من العملاء في خدماتنا</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-white p-8 rounded-3xl border border-gray-100 relative shadow-sm hover:shadow-lg transition-shadow">
                      <Quote className="absolute top-6 right-6 w-8 h-8 text-primary-100 rotate-180" />
                      <div className="flex gap-1 mb-4 relative z-10">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-gray-600 mb-6 leading-relaxed relative z-10">"{review.text}"</p>
                      <div className="flex items-center gap-3 border-t border-gray-50 pt-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{review.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
